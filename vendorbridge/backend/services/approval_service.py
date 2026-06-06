from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models.approval import Approval
from ..models.quotation import Quotation
from ..models.rfq import RFQ
from ..utils.logger import log_activity


def request_approval(db: Session, quotation_id: int, current_user):
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    existing = (
        db.query(Approval)
        .filter(
            Approval.quotation_id == quotation_id,
            Approval.status.in_(["pending", "approved"]),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Approval already requested or approved")

    approval = Approval(
        quotation_id=quotation_id,
        rfq_id=quotation.rfq_id,
        requested_by=current_user.id,
    )
    quotation.status = "under_review"
    db.add(approval)
    log_activity(db, current_user.id, "CREATE", "approval", None,
                 f"Approval requested for quotation {quotation_id}")
    db.commit()
    db.refresh(approval)
    return approval


def approve(db: Session, approval_id: int, remarks: str, current_user):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    if approval.status != "pending":
        raise HTTPException(status_code=400, detail="Already reviewed")

    approval.status = "approved"
    approval.remarks = remarks
    approval.reviewed_by = current_user.id
    approval.reviewed_at = datetime.now(timezone.utc)

    quotation = db.query(Quotation).filter(Quotation.id == approval.quotation_id).first()
    quotation.status = "accepted"

    # Reject all other quotations for same RFQ
    other_quotations = (
        db.query(Quotation)
        .filter(Quotation.rfq_id == approval.rfq_id, Quotation.id != approval.quotation_id)
        .all()
    )
    for oq in other_quotations:
        oq.status = "rejected"

    # Close the RFQ
    rfq = db.query(RFQ).filter(RFQ.id == approval.rfq_id).first()
    rfq.status = "closed"

    log_activity(db, current_user.id, "APPROVE", "approval", approval.id,
                 f"Quotation {approval.quotation_id} approved")
    db.commit()

    # Auto-create PO
    from ..services.po_service import create_po
    create_po(db, approval.quotation_id, current_user.id, approval.id)

    return approval


def reject(db: Session, approval_id: int, remarks: str, current_user):
    if not remarks or len(remarks) < 10:
        raise HTTPException(status_code=400, detail="Remarks must be at least 10 characters")

    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    if approval.status != "pending":
        raise HTTPException(status_code=400, detail="Already reviewed")

    approval.status = "rejected"
    approval.remarks = remarks
    approval.reviewed_by = current_user.id
    approval.reviewed_at = datetime.now(timezone.utc)

    quotation = db.query(Quotation).filter(Quotation.id == approval.quotation_id).first()
    quotation.status = "rejected"

    log_activity(db, current_user.id, "REJECT", "approval", approval.id,
                 f"Quotation {approval.quotation_id} rejected")
    db.commit()
    return approval


def get_approvals(db: Session, current_user, status_filter=None):
    query = db.query(Approval)
    if current_user.role == "procurement_officer":
        query = query.filter(Approval.requested_by == current_user.id)
    if status_filter:
        query = query.filter(Approval.status == status_filter)
    return query.order_by(Approval.requested_at.desc()).all()
