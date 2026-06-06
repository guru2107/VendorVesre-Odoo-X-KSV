from datetime import datetime
from sqlalchemy import extract
from ..models.purchase_order import PurchaseOrder
from ..models.invoice import Invoice


def generate_po_number(db) -> str:
    year = datetime.utcnow().year
    count = db.query(PurchaseOrder).filter(
        extract("year", PurchaseOrder.issued_at) == year
    ).count()
    return f"PO-{year}-{str(count + 1).zfill(4)}"


def generate_invoice_number(db) -> str:
    year = datetime.utcnow().year
    count = db.query(Invoice).filter(
        extract("year", Invoice.generated_at) == year
    ).count()
    return f"INV{str(count + 1).zfill(4)}{year}"
