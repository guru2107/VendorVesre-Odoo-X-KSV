from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..dependencies.auth import get_current_user
from ..models.user import User
from ..models.rfq import RFQ, RFQVendor
from ..models.quotation import Quotation
from ..models.approval import Approval
from ..models.purchase_order import PurchaseOrder
from ..models.invoice import Invoice

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "vendor":
        vendor_id = current_user.vendor_id
        active_rfqs = (
            db.query(func.count(RFQ.id))
            .join(RFQVendor)
            .filter(RFQVendor.vendor_id == vendor_id, RFQ.status == "published")
            .scalar()
        ) or 0
        my_quotations = (
            db.query(func.count(Quotation.id))
            .filter(Quotation.vendor_id == vendor_id)
            .scalar()
        ) or 0
        recent_pos = (
            db.query(PurchaseOrder)
            .filter(PurchaseOrder.vendor_id == vendor_id)
            .order_by(PurchaseOrder.issued_at.desc())
            .limit(5)
            .all()
        )
        return {
            "active_rfqs": active_rfqs,
            "my_quotations": my_quotations,
            "recent_pos": [
                {
                    "po_number": po.po_number,
                    "status": po.status,
                    "issued_at": po.issued_at.isoformat() if po.issued_at else None,
                }
                for po in recent_pos
            ],
            "monthly_spend": [],
        }

    pending_approvals = (
        db.query(func.count(Approval.id))
        .filter(Approval.status == "pending")
        .scalar()
    ) or 0
    active_rfqs = (
        db.query(func.count(RFQ.id))
        .filter(RFQ.status == "published")
        .scalar()
    ) or 0
    total_pos = db.query(func.count(PurchaseOrder.id)).scalar() or 0
    total_invoices = db.query(func.count(Invoice.id)).scalar() or 0

    recent_pos = (
        db.query(PurchaseOrder)
        .order_by(PurchaseOrder.issued_at.desc())
        .limit(5)
        .all()
    )
    recent_invoices = (
        db.query(Invoice)
        .order_by(Invoice.generated_at.desc())
        .limit(5)
        .all()
    )

    monthly_spend = db.execute(
        db.query(
            func.to_char(func.date_trunc("month", Invoice.generated_at), "Mon YYYY").label("month"),
            func.cast(func.sum(Invoice.total), ).label("total"),
        )
        .filter(
            Invoice.generated_at >= func.now() - func.cast("6 months", )
        )
        .group_by(func.date_trunc("month", Invoice.generated_at))
        .order_by(func.date_trunc("month", Invoice.generated_at))
    ).all() if False else []

    # Use raw SQL for monthly spend to avoid SQLAlchemy complexity
    from sqlalchemy import text
    monthly_result = db.execute(text("""
        SELECT TO_CHAR(DATE_TRUNC('month', generated_at), 'Mon YYYY') as month,
               SUM(total)::float as total
        FROM invoices
        WHERE generated_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', generated_at)
        ORDER BY DATE_TRUNC('month', generated_at) ASC
    """)).fetchall()

    monthly_spend = [{"month": r[0], "total": r[1]} for r in monthly_result]

    return {
        "pending_approvals": pending_approvals,
        "active_rfqs": active_rfqs,
        "total_pos": total_pos,
        "total_invoices": total_invoices,
        "recent_pos": [
            {
                "po_number": po.po_number,
                "vendor_id": po.vendor_id,
                "status": po.status,
                "issued_at": po.issued_at.isoformat() if po.issued_at else None,
            }
            for po in recent_pos
        ],
        "recent_invoices": [
            {
                "invoice_number": inv.invoice_number,
                "total": float(inv.total) if inv.total else 0,
                "status": inv.status,
                "generated_at": inv.generated_at.isoformat() if inv.generated_at else None,
            }
            for inv in recent_invoices
        ],
        "monthly_spend": monthly_spend,
    }
