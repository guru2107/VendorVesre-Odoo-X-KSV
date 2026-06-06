from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from typing import Optional
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies.auth import get_current_user, require_role
from ..models.user import User
from ..schemas.rfq import RFQCreate, RFQOut, RFQItemOut
from ..services.rfq_service import (
    create_rfq, publish_rfq, close_rfq, get_rfqs, get_rfq_by_id, save_attachment,
)

router = APIRouter(prefix="/rfqs", tags=["rfqs"])


@router.post("", response_model=RFQOut, status_code=201)
def create(body: RFQCreate, db: Session = Depends(get_db),
           current_user: User = Depends(require_role("procurement_officer", "admin"))):
    rfq = create_rfq(db, body, current_user)
    return _rfq_to_out(rfq)


@router.get("")
def list_rfqs(status: Optional[str] = Query(None), skip: int = 0, limit: int = 20,
              db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rfqs, total = get_rfqs(db, current_user, status, skip, limit)
    return {"rfqs": [_rfq_to_dict(r, current_user) for r in rfqs], "total": total}


@router.get("/{rfq_id}")
def get_rfq(rfq_id: int, db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)):
    rfq = get_rfq_by_id(db, rfq_id, current_user)
    return _rfq_to_dict(rfq, current_user)


@router.patch("/{rfq_id}/publish")
def publish(rfq_id: int, db: Session = Depends(get_db),
            current_user: User = Depends(require_role("procurement_officer", "admin"))):
    rfq = publish_rfq(db, rfq_id, current_user)
    return _rfq_to_dict(rfq, current_user)


@router.patch("/{rfq_id}/close")
def close(rfq_id: int, db: Session = Depends(get_db),
          current_user: User = Depends(require_role("procurement_officer", "admin"))):
    rfq = close_rfq(db, rfq_id, current_user)
    return _rfq_to_dict(rfq, current_user)


@router.post("/{rfq_id}/attachments")
def upload_attachment(rfq_id: int, file: UploadFile = File(...),
                      db: Session = Depends(get_db),
                      current_user: User = Depends(require_role("procurement_officer", "admin"))):
    att = save_attachment(db, rfq_id, file, current_user)
    return {"id": att.id, "filename": att.filename}


def _rfq_to_out(rfq):
    return RFQOut(
        id=rfq.id, title=rfq.title, description=rfq.description,
        deadline=rfq.deadline, status=rfq.status, created_by=rfq.created_by,
        created_at=rfq.created_at, updated_at=rfq.updated_at,
        items=[RFQItemOut.model_validate(i) for i in rfq.items],
        vendor_ids=[v.vendor_id for v in rfq.vendor_assignments],
    )


def _rfq_to_dict(rfq, current_user=None):
    vendor_ids = [v.vendor_id for v in rfq.vendor_assignments] if rfq.vendor_assignments else []
    is_invited = (
        current_user
        and current_user.role == "vendor"
        and current_user.vendor_id in vendor_ids
    )
    return {
        "id": rfq.id, "title": rfq.title, "description": rfq.description,
        "deadline": rfq.deadline.isoformat() if rfq.deadline else None,
        "status": rfq.status, "created_by": rfq.created_by,
        "created_at": rfq.created_at.isoformat() if rfq.created_at else None,
        "updated_at": rfq.updated_at.isoformat() if rfq.updated_at else None,
        "items": [
            {"id": i.id, "product_name": i.product_name, "quantity": float(i.quantity),
             "unit": i.unit, "specifications": i.specifications}
            for i in rfq.items
        ] if rfq.items else [],
        "vendor_ids": vendor_ids,
        "vendors": [
            {
                "id": v.vendor_id,
                "company_name": v.vendor.company_name if v.vendor else "Unknown",
                "email": v.vendor.email if v.vendor else None,
            }
            for v in rfq.vendor_assignments
        ] if rfq.vendor_assignments else [],
        "vendor_count": len(rfq.vendor_assignments) if rfq.vendor_assignments else 0,
        "quotation_count": len(rfq.quotations) if rfq.quotations else 0,
        "is_invited": is_invited,
        "attachments": [
            {"id": a.id, "filename": a.filename, "uploaded_at": a.uploaded_at.isoformat() if a.uploaded_at else None}
            for a in rfq.attachments
        ] if rfq.attachments else [],
    }
