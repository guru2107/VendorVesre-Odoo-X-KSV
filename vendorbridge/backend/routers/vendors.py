from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime, timezone

from ..database import get_db
from ..dependencies.auth import get_current_user, require_role
from ..models.user import User
from ..models.vendor import Vendor
from ..schemas.vendor import VendorCreate, VendorUpdate, VendorOut, VendorListResponse
from ..utils.logger import log_activity

router = APIRouter(prefix="/vendors", tags=["vendors"])


@router.post("", response_model=VendorOut, status_code=201)
def create_vendor(
    body: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "procurement_officer")),
):
    if db.query(Vendor).filter(Vendor.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if body.gst_number and db.query(Vendor).filter(Vendor.gst_number == body.gst_number).first():
        raise HTTPException(status_code=400, detail="GST number already registered")

    vendor = Vendor(
        company_name=body.company_name,
        category=body.category,
        gst_number=body.gst_number,
        contact_person=body.contact_person,
        email=body.email,
        phone=body.phone,
        address=body.address,
        created_by=current_user.id,
    )
    db.add(vendor)
    db.flush()
    log_activity(db, current_user.id, "CREATE", "vendor", vendor.id,
                 f"Vendor {body.company_name} created")
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("", response_model=VendorListResponse)
def list_vendors(
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "procurement_officer", "manager")),
):
    query = db.query(Vendor)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Vendor.company_name.ilike(pattern),
                Vendor.contact_person.ilike(pattern),
                Vendor.email.ilike(pattern),
                Vendor.gst_number.ilike(pattern),
            )
        )
    if category:
        query = query.filter(Vendor.category == category)
    if status:
        query = query.filter(Vendor.status == status)

    total = query.count()
    vendors = query.order_by(Vendor.created_at.desc()).offset(skip).limit(limit).all()
    return VendorListResponse(vendors=vendors, total=total)


@router.get("/{vendor_id}", response_model=VendorOut)
def get_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "vendor":
        if not current_user.vendor_id or current_user.vendor_id != vendor_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this vendor")
    elif current_user.role not in ("admin", "procurement_officer", "manager"):
        raise HTTPException(status_code=403, detail="Not authorized")

    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.put("/{vendor_id}", response_model=VendorOut)
def update_vendor(
    vendor_id: int,
    body: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vendor, key, value)
    vendor.updated_at = datetime.now(timezone.utc)
    log_activity(db, current_user.id, "UPDATE", "vendor", vendor.id,
                 f"Vendor {vendor.company_name} updated")
    db.commit()
    db.refresh(vendor)
    return vendor


@router.patch("/{vendor_id}/status", response_model=VendorOut)
def update_vendor_status(
    vendor_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    vendor.status = body.get("status", vendor.status)
    vendor.updated_at = datetime.now(timezone.utc)
    log_activity(db, current_user.id, "UPDATE", "vendor", vendor.id,
                 f"Vendor {vendor.company_name} status changed to {vendor.status}")
    db.commit()
    db.refresh(vendor)
    return vendor
