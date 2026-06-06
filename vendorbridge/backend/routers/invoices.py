from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from typing import Optional
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies.auth import get_current_user, require_role
from ..models.user import User
from ..models.invoice import Invoice
from ..schemas.invoice import InvoiceStatusUpdate
from ..services.invoice_service import (
    create_invoice, send_invoice, get_invoices, get_invoice_pdf_data,
)
from ..utils.logger import log_activity
from datetime import datetime, timezone

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.post("/{po_id}", status_code=201)
def create(po_id: int, db: Session = Depends(get_db),
           current_user: User = Depends(require_role("procurement_officer", "admin"))):
    invoice = create_invoice(db, po_id, current_user)
    return _inv_to_dict(invoice)


@router.get("")
def list_invoices(skip: int = 0, limit: int = 20,
                  db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    invoices, total = get_invoices(db, current_user, skip, limit)
    return {"invoices": [_inv_to_dict(i) for i in invoices], "total": total}


@router.get("/{invoice_id}")
def get_invoice(invoice_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return _inv_to_dict(inv, detailed=True)


@router.get("/{invoice_id}/pdf")
def download_pdf(invoice_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    pdf_bytes, invoice_number = get_invoice_pdf_data(db, invoice_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{invoice_number}.pdf"'},
    )


@router.post("/{invoice_id}/send-email")
async def send_email(invoice_id: int, db: Session = Depends(get_db),
                     current_user: User = Depends(require_role("procurement_officer", "admin"))):
    return await send_invoice(db, invoice_id, current_user)


@router.patch("/{invoice_id}/status")
def update_status(invoice_id: int, body: InvoiceStatusUpdate,
                  db: Session = Depends(get_db),
                  current_user: User = Depends(require_role("procurement_officer", "admin"))):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = body.status
    inv.updated_at = datetime.now(timezone.utc)
    log_activity(db, current_user.id, "UPDATE", "invoice", inv.id,
                 f"Invoice {inv.invoice_number} status changed to {body.status}")
    db.commit()
    db.refresh(inv)
    return _inv_to_dict(inv)


def _inv_to_dict(inv, detailed=False):
    result = {
        "id": inv.id, "invoice_number": inv.invoice_number,
        "po_id": inv.po_id, "tax_rate": float(inv.tax_rate) if inv.tax_rate else 18,
        "subtotal": float(inv.subtotal) if inv.subtotal else 0,
        "tax_amount": float(inv.tax_amount) if inv.tax_amount else 0,
        "total": float(inv.total) if inv.total else 0,
        "status": inv.status,
        "generated_by": inv.generated_by,
        "generated_at": inv.generated_at.isoformat() if inv.generated_at else None,
        "sent_at": inv.sent_at.isoformat() if inv.sent_at else None,
        "updated_at": inv.updated_at.isoformat() if inv.updated_at else None,
    }
    if detailed and inv.purchase_order:
        po = inv.purchase_order
        result["po_number"] = po.po_number
        if po.vendor:
            result["vendor"] = {
                "id": po.vendor.id,
                "company_name": po.vendor.company_name,
                "email": po.vendor.email,
                "phone": po.vendor.phone,
                "gst_number": po.vendor.gst_number,
                "address": po.vendor.address,
            }
        if po.quotation:
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
    return result
