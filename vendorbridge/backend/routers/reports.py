from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from sqlalchemy.orm import Session
import io

from ..database import get_db
from ..dependencies.auth import require_role
from ..services.report_service import (
    get_procurement_stats, get_monthly_spend,
    get_vendor_performance, get_spending_by_category, export_csv,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/procurement-stats")
def procurement_stats(
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "manager")),
):
    return get_procurement_stats(db)


@router.get("/monthly-spend")
def monthly_spend(
    months: int = Query(12),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "manager")),
):
    return get_monthly_spend(db, months)


@router.get("/vendor-performance")
def vendor_performance(
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "manager")),
):
    return get_vendor_performance(db)


@router.get("/spending-by-category")
def spending_by_category(
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "manager")),
):
    return get_spending_by_category(db)


@router.get("/export")
def export(
    entity: str = Query("vendors"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "manager")),
):
    csv_data = export_csv(db, entity, start_date, end_date)
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="vendorbridge_{entity}.csv"'},
    )
