from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies.auth import get_current_user, require_role
from ..models.user import User
from ..schemas.approval import ApprovalRequest, ApprovalReview, ApprovalOut
from ..services.approval_service import request_approval, approve, reject, get_approvals

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.post("", response_model=ApprovalOut, status_code=201)
def request(body: ApprovalRequest, db: Session = Depends(get_db),
            current_user: User = Depends(require_role("procurement_officer", "admin"))):
    return request_approval(db, body.quotation_id, current_user)


@router.get("")
def list_approvals(status: Optional[str] = None, db: Session = Depends(get_db),
                   current_user: User = Depends(require_role("manager", "admin", "procurement_officer"))):
    approvals = get_approvals(db, current_user, status)
    return [_approval_to_dict(a) for a in approvals]


@router.get("/{approval_id}")
def get_approval(approval_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(require_role("manager", "admin", "procurement_officer"))):
    from ..models.approval import Approval
    a = db.query(Approval).filter(Approval.id == approval_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Approval not found")
    return _approval_to_dict(a)


@router.post("/{approval_id}/approve", response_model=ApprovalOut)
def approve_action(approval_id: int, body: ApprovalReview = None,
                   db: Session = Depends(get_db),
                   current_user: User = Depends(require_role("manager", "admin"))):
    remarks = body.remarks if body else ""
    return approve(db, approval_id, remarks or "", current_user)


@router.post("/{approval_id}/reject", response_model=ApprovalOut)
def reject_action(approval_id: int, body: ApprovalReview,
                  db: Session = Depends(get_db),
                  current_user: User = Depends(require_role("manager", "admin"))):
    return reject(db, approval_id, body.remarks, current_user)


def _approval_to_dict(a):
    result = {
        "id": a.id, "quotation_id": a.quotation_id, "rfq_id": a.rfq_id,
        "requested_by": a.requested_by, "reviewed_by": a.reviewed_by,
        "status": a.status, "remarks": a.remarks,
        "requested_at": a.requested_at.isoformat() if a.requested_at else None,
        "reviewed_at": a.reviewed_at.isoformat() if a.reviewed_at else None,
    }
    # Enrich with related data
    if a.quotation:
        result["vendor_name"] = a.quotation.vendor.company_name if a.quotation.vendor else None
        result["quotation_subtotal"] = float(a.quotation.subtotal) if a.quotation.subtotal else 0
    if a.rfq:
        result["rfq_title"] = a.rfq.title
    if a.requester:
        result["requested_by_name"] = a.requester.name
    if a.reviewer:
        result["reviewed_by_name"] = a.reviewer.name
    return result
