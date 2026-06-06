import os
import re
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..models.rfq import RFQ, RFQItem, RFQAttachment, RFQVendor
from ..models.vendor import Vendor
from ..utils.logger import log_activity


def create_rfq(db: Session, data, current_user) -> RFQ:
    if data.deadline <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Deadline must be in the future")

    for vid in data.vendor_ids:
        vendor = db.query(Vendor).filter(Vendor.id == vid).first()
        if not vendor:
            raise HTTPException(status_code=400, detail=f"Vendor ID {vid} not found")
        if vendor.status != "active":
            raise HTTPException(
                status_code=400,
                detail=f"Vendor '{vendor.company_name}' is not active",
            )

    rfq = RFQ(
        title=data.title,
        description=data.description,
        deadline=data.deadline,
        created_by=current_user.id,
    )
    db.add(rfq)
    db.flush()

    for item in data.items:
        db.add(RFQItem(
            rfq_id=rfq.id,
            product_name=item.product_name,
            quantity=item.quantity,
            unit=item.unit,
            specifications=item.specifications,
        ))

    for vid in data.vendor_ids:
        db.add(RFQVendor(rfq_id=rfq.id, vendor_id=vid))

    log_activity(db, current_user.id, "CREATE", "rfq", rfq.id,
                 f"RFQ '{data.title}' created")
    db.commit()
    db.refresh(rfq)
    return rfq


def publish_rfq(db: Session, rfq_id: int, current_user):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if rfq.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft RFQs can be published")
    if rfq.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    rfq.status = "published"
    rfq.updated_at = datetime.now(timezone.utc)
    log_activity(db, current_user.id, "UPDATE", "rfq", rfq.id,
                 f"RFQ '{rfq.title}' published")
    db.commit()
    db.refresh(rfq)
    return rfq


def close_rfq(db: Session, rfq_id: int, current_user):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    rfq.status = "closed"
    rfq.updated_at = datetime.now(timezone.utc)
    log_activity(db, current_user.id, "UPDATE", "rfq", rfq.id,
                 f"RFQ '{rfq.title}' closed")
    db.commit()
    db.refresh(rfq)
    return rfq


def get_rfqs(db: Session, current_user, status_filter: Optional[str] = None,
             skip: int = 0, limit: int = 20):
    query = db.query(RFQ)
    if current_user.role == "vendor":
        if not current_user.vendor_id:
            return [], 0
        query = (
            query.join(RFQVendor)
            .filter(RFQVendor.vendor_id == current_user.vendor_id)
            .filter(RFQ.status != "draft")
        )
    if status_filter:
        query = query.filter(RFQ.status == status_filter)
    total = query.count()
    rfqs = query.order_by(RFQ.created_at.desc()).offset(skip).limit(limit).all()
    return rfqs, total


def get_rfq_by_id(db: Session, rfq_id: int, current_user):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    if current_user.role == "vendor":
        if not current_user.vendor_id:
            raise HTTPException(status_code=403, detail="User not linked to a vendor")
        if rfq.status == "draft":
            raise HTTPException(status_code=403, detail="Not authorized to view this RFQ")
        is_invited = (
            db.query(RFQVendor)
            .filter(RFQVendor.rfq_id == rfq_id, RFQVendor.vendor_id == current_user.vendor_id)
            .first()
        )
        if not is_invited:
            raise HTTPException(status_code=403, detail="Not authorized to view this RFQ")

    return rfq


def save_attachment(db: Session, rfq_id: int, file: UploadFile, current_user):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    upload_dir = os.path.join("uploads", f"rfq_{rfq_id}")
    os.makedirs(upload_dir, exist_ok=True)

    safe_name = re.sub(r'[^\w\-.]', '_', file.filename)
    file_path = os.path.join(upload_dir, safe_name)

    with open(file_path, "wb") as f:
        content = file.file.read()
        f.write(content)

    attachment = RFQAttachment(
        rfq_id=rfq_id,
        filename=file.filename,
        file_path=file_path,
    )
    db.add(attachment)
    log_activity(db, current_user.id, "CREATE", "rfq_attachment", rfq_id,
                 f"Attachment '{file.filename}' uploaded to RFQ {rfq_id}")
    db.commit()
    db.refresh(attachment)
    return attachment
