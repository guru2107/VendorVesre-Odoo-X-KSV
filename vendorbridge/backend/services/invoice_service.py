import csv
import io
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models.invoice import Invoice
from ..models.purchase_order import PurchaseOrder
from ..models.rfq import RFQ
from ..models.quotation import Quotation
from ..models.vendor import Vendor
from ..models.approval import Approval
from ..utils.number_generator import generate_invoice_number
from ..utils.logger import log_activity
from ..utils.pdf_generator import generate_invoice_pdf
from ..utils.email_sender import send_invoice_email


def create_invoice(db: Session, po_id: int, current_user):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    existing = db.query(Invoice).filter(Invoice.po_id == po_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Invoice already exists for this PO")

    quotation = po.quotation
    subtotal = float(quotation.subtotal) if quotation.subtotal else 0
    tax_rate = Decimal("18.00")
    tax_amount = round(Decimal(str(subtotal)) * tax_rate / Decimal("100"), 2)
    total = round(Decimal(str(subtotal)) + tax_amount, 2)

    invoice_number = generate_invoice_number(db)
    invoice = Invoice(
        invoice_number=invoice_number,
        po_id=po_id,
        tax_rate=tax_rate,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total=total,
        generated_by=current_user.id,
    )
    db.add(invoice)
    log_activity(db, current_user.id, "CREATE", "invoice", None,
                 f"Invoice {invoice_number} created from PO {po.po_number}")
    db.commit()
    db.refresh(invoice)
    return invoice


async def send_invoice(db: Session, invoice_id: int, current_user):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    po = invoice.purchase_order
    if not po:
        raise HTTPException(status_code=400, detail="Purchase order not found for this invoice")
    vendor = po.vendor
    if not vendor or not vendor.email:
        raise HTTPException(status_code=400, detail="Vendor email not configured")
    quotation = po.quotation
    if not quotation or not quotation.items:
        raise HTTPException(status_code=400, detail="Quotation items not found for this invoice")

    pdf_bytes = generate_invoice_pdf(invoice, po, vendor, quotation.items)
    try:
        await send_invoice_email(invoice, vendor.email, vendor.company_name, pdf_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to send email: {exc}",
        ) from exc

    invoice.status = "sent"
    invoice.sent_at = datetime.now(timezone.utc)
    log_activity(db, current_user.id, "SEND", "invoice", invoice.id,
                 f"Invoice {invoice.invoice_number} sent to {vendor.email}")
    db.commit()
    return {"message": f"Invoice sent to {vendor.email}"}


def get_invoices(db: Session, current_user, skip=0, limit=20):
    query = db.query(Invoice)
    if current_user.role == "vendor" and current_user.vendor_id:
        po_ids = [po.id for po in db.query(PurchaseOrder).filter(
            PurchaseOrder.vendor_id == current_user.vendor_id
        ).all()]
        query = query.filter(Invoice.po_id.in_(po_ids))
    total = query.count()
    invoices = query.order_by(Invoice.generated_at.desc()).offset(skip).limit(limit).all()
    return invoices, total


def get_invoice_pdf_data(db: Session, invoice_id: int):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    po = invoice.purchase_order
    vendor = po.vendor
    quotation = po.quotation

    return generate_invoice_pdf(invoice, po, vendor, quotation.items), invoice.invoice_number
