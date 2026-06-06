from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..dependencies.auth import get_current_user
from ..models.user import User
from ..models.activity_log import ActivityLog

router = APIRouter(prefix="/activity-logs", tags=["activity-logs"])


@router.get("")
def list_logs(
    entity_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ActivityLog)

    if current_user.role == "vendor":
        query = query.filter(ActivityLog.user_id == current_user.id)
    elif current_user.role == "procurement_officer":
        pass  # sees all procurement entity logs

    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)
    if action:
        query = query.filter(ActivityLog.action == action)
    if start_date:
        query = query.filter(ActivityLog.created_at >= start_date)
    if end_date:
        query = query.filter(ActivityLog.created_at <= end_date)

    total = query.count()
    logs = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "description": log.description,
                "created_at": log.created_at.isoformat() if log.created_at else None,
                "user_name": log.user.name if log.user else None,
            }
            for log in logs
        ],
        "total": total,
    }


@router.get("/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ActivityLog)
    if current_user.role == "vendor":
        query = query.filter(ActivityLog.user_id == current_user.id)

    logs = query.order_by(ActivityLog.created_at.desc()).limit(10).all()
    return [
        {
            "id": log.id,
            "description": log.description,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]
