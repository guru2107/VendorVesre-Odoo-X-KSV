from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies.auth import get_current_user, require_role
from ..models.user import User
from ..models.quotation import Quotation
from ..schemas.quotation import QuotationSubmit, QuotationOut
from ..services.quotation_service import submit_quotation, edit_quotation, compare_quotations

router = APIRouter(prefix="/quotations", tags=["quotations"])


@router.post("", response_model=QuotationOut, status_code=201)
def submit(body: QuotationSubmit, db: Session = Depends(get_db),
           current_user: User = Depends(require_role("vendor"))):
    return submit_quotation(db, body, current_user)


@router.put("/{quotation_id}", response_model=QuotationOut)
def edit(quotation_id: int, body: QuotationSubmit, db: Session = Depends(get_db),
         current_user: User = Depends(require_role("vendor"))):
    return edit_quotation(db, quotation_id, body, current_user)


@router.get("/my")
def my_quotations(db: Session = Depends(get_db),
                  current_user: User = Depends(require_role("vendor"))):
    quotations = (
        db.query(Quotation)
        .filter(Quotation.vendor_id == current_user.vendor_id)
        .order_by(Quotation.submitted_at.desc())
        .all()
    )
    return [_q_to_dict(q) for q in quotations]


@router.get("/rfq/{rfq_id}")
def get_for_rfq(rfq_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(require_role("procurement_officer", "manager", "admin"))):
    quotations = (
        db.query(Quotation)
        .filter(Quotation.rfq_id == rfq_id)
        .all()
    )
    return [_q_to_dict(q) for q in quotations]


@router.get("/{quotation_id}")
def get_quotation(quotation_id: int, db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    q = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if current_user.role == "vendor" and q.vendor_id != current_user.vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return _q_to_dict(q)


@router.get("/compare/{rfq_id}")
def compare(rfq_id: int, db: Session = Depends(get_db),
            current_user: User = Depends(require_role("procurement_officer", "manager", "admin"))):
    return compare_quotations(db, rfq_id)


def _q_to_dict(q):
    return {
        "id": q.id, "rfq_id": q.rfq_id, "vendor_id": q.vendor_id,
        "vendor_name": q.vendor.company_name if q.vendor else None,
        "status": q.status, "delivery_days": q.delivery_days,
        "notes": q.notes, "subtotal": float(q.subtotal) if q.subtotal else 0,
        "submitted_at": q.submitted_at.isoformat() if q.submitted_at else None,
        "items": [
            {
                "id": qi.id, "rfq_item_id": qi.rfq_item_id,
                "unit_price": float(qi.unit_price), "quantity": float(qi.quantity),
                "total_price": float(qi.total_price) if qi.total_price else 0,
            }
            for qi in q.items
        ] if q.items else [],
    }
