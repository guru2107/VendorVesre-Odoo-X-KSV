from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies.auth import get_current_user, require_role
from ..models.user import User
from ..models.purchase_order import PurchaseOrder
from ..schemas.purchase_order import POStatusUpdate
from ..services.po_service import get_pos, update_po_status

router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])


@router.get("")
def list_pos(status: Optional[str] = None, vendor_id: Optional[int] = None,
             skip: int = 0, limit: int = 20,
             db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    pos, total = get_pos(db, current_user, status, vendor_id, skip, limit)
    return {"pos": [_po_to_dict(po) for po in pos], "total": total}


@router.get("/{po_id}")
def get_po(po_id: int, db: Session = Depends(get_db),
           current_user: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    if current_user.role == "vendor" and po.vendor_id != current_user.vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return _po_to_dict(po, detailed=True)


@router.patch("/{po_id}/status")
def update_status(po_id: int, body: POStatusUpdate,
                  db: Session = Depends(get_db),
                  current_user: User = Depends(require_role("procurement_officer", "admin"))):
    po = update_po_status(db, po_id, body.status, current_user)
    return _po_to_dict(po)


def _po_to_dict(po, detailed=False):
    result = {
        "id": po.id, "po_number": po.po_number,
        "quotation_id": po.quotation_id, "approval_id": po.approval_id,
        "vendor_id": po.vendor_id, "issued_by": po.issued_by,
        "status": po.status,
        "issued_at": po.issued_at.isoformat() if po.issued_at else None,
        "updated_at": po.updated_at.isoformat() if po.updated_at else None,
    }
    if po.vendor:
        result["vendor_name"] = po.vendor.company_name
    if detailed and po.quotation:
        result["subtotal"] = float(po.quotation.subtotal) if po.quotation.subtotal else 0
        result["items"] = [
            {
                "product_name": qi.rfq_item.product_name if qi.rfq_item else "",
                "quantity": float(qi.quantity),
                "unit": qi.rfq_item.unit if qi.rfq_item else "",
                "unit_price": float(qi.unit_price),
                "total_price": float(qi.total_price) if qi.total_price else 0,
            }
            for qi in po.quotation.items
        ]
        if po.approval:
            result["approval"] = {
                "approved_by": po.approval.reviewer.name if po.approval.reviewer else None,
                "approved_at": po.approval.reviewed_at.isoformat() if po.approval.reviewed_at else None,
                "remarks": po.approval.remarks,
            }
    return result
