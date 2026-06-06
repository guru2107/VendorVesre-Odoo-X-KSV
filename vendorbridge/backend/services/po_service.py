from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models.purchase_order import PurchaseOrder
from ..models.quotation import Quotation
from ..utils.logger import log_activity
from ..utils.number_generator import generate_po_number


def create_po(db: Session, quotation_id: int, issued_by_user_id=None, approval_id=None):
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    existing = db.query(PurchaseOrder).filter(PurchaseOrder.quotation_id == quotation_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="PO already exists for this quotation")

    from ..models.approval import Approval
    if not approval_id:
        approval = (
            db.query(Approval)
            .filter(Approval.quotation_id == quotation_id, Approval.status == "approved")
            .first()
        )
        if approval:
            approval_id = approval.id

    po_number = generate_po_number(db)
    po = PurchaseOrder(
        po_number=po_number,
        quotation_id=quotation_id,
        approval_id=approval_id,
        vendor_id=quotation.vendor_id,
        issued_by=issued_by_user_id,
    )
    db.add(po)
    log_activity(db, issued_by_user_id, "CREATE", "purchase_order", None,
                 f"Purchase Order {po_number} created")
    db.commit()
    db.refresh(po)
    return po


def get_pos(db: Session, current_user, status_filter=None, vendor_id=None,
            skip=0, limit=20):
    query = db.query(PurchaseOrder)
    if current_user.role == "vendor" and current_user.vendor_id:
        query = query.filter(PurchaseOrder.vendor_id == current_user.vendor_id)
    if vendor_id:
        query = query.filter(PurchaseOrder.vendor_id == vendor_id)
    if status_filter:
        query = query.filter(PurchaseOrder.status == status_filter)
    total = query.count()
    pos = query.order_by(PurchaseOrder.issued_at.desc()).offset(skip).limit(limit).all()
    return pos, total


def update_po_status(db: Session, po_id: int, new_status: str, current_user):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    po.status = new_status
    po.updated_at = datetime.now(timezone.utc)
    log_activity(db, current_user.id, "UPDATE", "purchase_order", po.id,
                 f"PO {po.po_number} status changed to {new_status}")
    db.commit()
    db.refresh(po)
    return po
