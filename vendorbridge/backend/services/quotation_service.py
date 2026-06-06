from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models.quotation import Quotation, QuotationItem
from ..models.rfq import RFQ, RFQItem, RFQVendor
from ..utils.logger import log_activity


def submit_quotation(db: Session, data, current_user):
    if not current_user.vendor_id:
        raise HTTPException(status_code=403, detail="User not linked to a vendor")

    rfq = db.query(RFQ).filter(RFQ.id == data.rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if rfq.status != "published":
        raise HTTPException(status_code=400, detail="RFQ is not open for quotations")

    is_invited = (
        db.query(RFQVendor)
        .filter(RFQVendor.rfq_id == data.rfq_id, RFQVendor.vendor_id == current_user.vendor_id)
        .first()
    )
    if not is_invited:
        raise HTTPException(status_code=403, detail="Vendor not invited to this RFQ")

    existing = (
        db.query(Quotation)
        .filter(Quotation.rfq_id == data.rfq_id, Quotation.vendor_id == current_user.vendor_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Quotation already submitted")

    rfq_item_ids = {item.id for item in rfq.items}
    submitted_ids = {item.rfq_item_id for item in data.items}
    missing = rfq_item_ids - submitted_ids
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing items: {missing}")

    subtotal = Decimal("0")
    quotation = Quotation(
        rfq_id=data.rfq_id,
        vendor_id=current_user.vendor_id,
        delivery_days=data.delivery_days,
        notes=data.notes,
    )
    db.add(quotation)
    db.flush()

    for item_data in data.items:
        rfq_item = db.query(RFQItem).filter(RFQItem.id == item_data.rfq_item_id).first()
        total_price = Decimal(str(item_data.unit_price)) * rfq_item.quantity
        subtotal += total_price
        db.add(QuotationItem(
            quotation_id=quotation.id,
            rfq_item_id=item_data.rfq_item_id,
            unit_price=item_data.unit_price,
            quantity=rfq_item.quantity,
            total_price=total_price,
        ))

    quotation.subtotal = subtotal
    log_activity(db, current_user.id, "CREATE", "quotation", quotation.id,
                 f"Quotation submitted for RFQ {data.rfq_id}")
    db.commit()
    db.refresh(quotation)
    return quotation


def edit_quotation(db: Session, quotation_id: int, data, current_user):
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if quotation.vendor_id != current_user.vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if quotation.status != "submitted":
        raise HTTPException(status_code=400, detail="Cannot edit at this stage")

    for old_item in quotation.items:
        db.delete(old_item)
    db.flush()

    subtotal = Decimal("0")
    for item_data in data.items:
        rfq_item = db.query(RFQItem).filter(RFQItem.id == item_data.rfq_item_id).first()
        total_price = Decimal(str(item_data.unit_price)) * rfq_item.quantity
        subtotal += total_price
        db.add(QuotationItem(
            quotation_id=quotation.id,
            rfq_item_id=item_data.rfq_item_id,
            unit_price=item_data.unit_price,
            quantity=rfq_item.quantity,
            total_price=total_price,
        ))

    quotation.subtotal = subtotal
    quotation.delivery_days = data.delivery_days
    quotation.notes = data.notes
    quotation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(quotation)
    return quotation


def compare_quotations(db: Session, rfq_id: int):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    quotations = (
        db.query(Quotation)
        .filter(Quotation.rfq_id == rfq_id)
        .all()
    )

    lowest_prices = {}
    for q in quotations:
        for item in q.items:
            rid = item.rfq_item_id
            up = float(item.unit_price)
            if rid not in lowest_prices or up < lowest_prices[rid]:
                lowest_prices[rid] = up

    return {
        "rfq": {
            "id": rfq.id,
            "title": rfq.title,
            "items": [
                {
                    "id": i.id,
                    "product_name": i.product_name,
                    "quantity": float(i.quantity),
                    "unit": i.unit,
                }
                for i in rfq.items
            ],
        },
        "quotations": [
            {
                "id": q.id,
                "vendor_name": q.vendor.company_name if q.vendor else "Unknown",
                "delivery_days": q.delivery_days,
                "subtotal": float(q.subtotal) if q.subtotal else 0,
                "status": q.status,
                "items": [
                    {
                        "rfq_item_id": qi.rfq_item_id,
                        "product_name": qi.rfq_item.product_name if qi.rfq_item else "",
                        "unit_price": float(qi.unit_price),
                        "quantity": float(qi.quantity),
                        "total_price": float(qi.total_price) if qi.total_price else 0,
                    }
                    for qi in q.items
                ],
            }
            for q in quotations
        ],
        "lowest_prices": {str(k): v for k, v in lowest_prices.items()},
    }
