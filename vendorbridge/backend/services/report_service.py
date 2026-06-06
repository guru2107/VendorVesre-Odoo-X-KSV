import csv
import io
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models.rfq import RFQ
from ..models.quotation import Quotation
from ..models.purchase_order import PurchaseOrder
from ..models.invoice import Invoice
from ..models.vendor import Vendor
from ..models.approval import Approval


def get_procurement_stats(db: Session):
    total_rfqs = db.query(func.count(RFQ.id)).scalar() or 0
    total_quotations = db.query(func.count(Quotation.id)).scalar() or 0
    total_pos = db.query(func.count(PurchaseOrder.id)).scalar() or 0
    total_invoices = db.query(func.count(Invoice.id)).scalar() or 0
    total_spend = db.query(func.coalesce(func.sum(Invoice.total), 0)).scalar()
    avg_quotations = (total_quotations / total_rfqs) if total_rfqs > 0 else 0

    total_approvals = db.query(func.count(Approval.id)).scalar() or 0
    approved = db.query(func.count(Approval.id)).filter(Approval.status == "approved").scalar() or 0
    approval_rate = (approved / total_approvals * 100) if total_approvals > 0 else 0

    return {
        "total_rfqs": total_rfqs,
        "total_quotations": total_quotations,
        "total_purchase_orders": total_pos,
        "total_invoices": total_invoices,
        "total_spend": float(total_spend),
        "avg_quotations_per_rfq": round(avg_quotations, 2),
        "approval_rate": round(approval_rate, 2),
    }


def get_monthly_spend(db: Session, months: int = 12):
    from sqlalchemy import text
    result = db.execute(text(f"""
        SELECT TO_CHAR(DATE_TRUNC('month', generated_at), 'Mon YYYY') as month,
               SUM(total)::float as total
        FROM invoices
        WHERE generated_at >= NOW() - INTERVAL '{months} months'
        GROUP BY DATE_TRUNC('month', generated_at)
        ORDER BY DATE_TRUNC('month', generated_at) ASC
    """)).fetchall()
    return [{"month": r[0], "total": r[1]} for r in result]


def get_vendor_performance(db: Session):
    vendors = db.query(Vendor).filter(Vendor.status == "active").all()
    results = []
    for v in vendors:
        total_q = db.query(func.count(Quotation.id)).filter(
            Quotation.vendor_id == v.id
        ).scalar() or 0
        won = db.query(func.count(Quotation.id)).filter(
            Quotation.vendor_id == v.id, Quotation.status == "accepted"
        ).scalar() or 0
        win_rate = (won / total_q * 100) if total_q > 0 else 0

        avg_delivery = db.query(func.coalesce(func.avg(Quotation.delivery_days), 0)).filter(
            Quotation.vendor_id == v.id
        ).scalar()

        total_po_value = db.query(func.coalesce(func.sum(Quotation.subtotal), 0)).join(
            PurchaseOrder, PurchaseOrder.quotation_id == Quotation.id
        ).filter(Quotation.vendor_id == v.id).scalar()

        results.append({
            "vendor_id": v.id,
            "company_name": v.company_name,
            "category": v.category,
            "total_quotations_submitted": total_q,
            "quotations_won": won,
            "win_rate": round(win_rate, 2),
            "avg_delivery_days": round(float(avg_delivery), 1),
            "total_po_value": float(total_po_value),
        })
    results.sort(key=lambda x: x["total_po_value"], reverse=True)
    return results


def get_spending_by_category(db: Session):
    from sqlalchemy import text
    result = db.execute(text("""
        SELECT v.category, SUM(q.subtotal)::float as total
        FROM quotations q
        JOIN vendors v ON q.vendor_id = v.id
        JOIN purchase_orders po ON po.quotation_id = q.id
        WHERE q.status = 'accepted'
        GROUP BY v.category
        ORDER BY total DESC
    """)).fetchall()
    return [{"category": r[0] or "Other", "total": r[1] or 0} for r in result]


def export_csv(db: Session, entity: str, start_date=None, end_date=None):
    output = io.StringIO()
    writer = csv.writer(output)

    if entity == "vendors":
        writer.writerow(["ID", "Company Name", "Category", "GST", "Email", "Phone", "Status", "Created At"])
        query = db.query(Vendor)
        if start_date:
            query = query.filter(Vendor.created_at >= start_date)
        if end_date:
            query = query.filter(Vendor.created_at <= end_date)
        for v in query.all():
            writer.writerow([v.id, v.company_name, v.category, v.gst_number,
                             v.email, v.phone, v.status, v.created_at])

    elif entity == "rfqs":
        writer.writerow(["ID", "Title", "Status", "Deadline", "Created At"])
        query = db.query(RFQ)
        if start_date:
            query = query.filter(RFQ.created_at >= start_date)
        if end_date:
            query = query.filter(RFQ.created_at <= end_date)
        for r in query.all():
            writer.writerow([r.id, r.title, r.status, r.deadline, r.created_at])

    elif entity == "pos":
        writer.writerow(["ID", "PO Number", "Vendor ID", "Status", "Issued At"])
        query = db.query(PurchaseOrder)
        if start_date:
            query = query.filter(PurchaseOrder.issued_at >= start_date)
        if end_date:
            query = query.filter(PurchaseOrder.issued_at <= end_date)
        for po in query.all():
            writer.writerow([po.id, po.po_number, po.vendor_id, po.status, po.issued_at])

    elif entity == "invoices":
        writer.writerow(["ID", "Invoice Number", "PO ID", "Subtotal", "Tax", "Total", "Status", "Generated At"])
        query = db.query(Invoice)
        if start_date:
            query = query.filter(Invoice.generated_at >= start_date)
        if end_date:
            query = query.filter(Invoice.generated_at <= end_date)
        for inv in query.all():
            writer.writerow([inv.id, inv.invoice_number, inv.po_id,
                             inv.subtotal, inv.tax_amount, inv.total, inv.status, inv.generated_at])

    output.seek(0)
    return output.getvalue()
