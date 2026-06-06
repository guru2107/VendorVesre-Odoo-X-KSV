from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas.user import UserCreate, UserOut, UserUpdateRole, UserUpdateStatus
from ..services.auth_service import create_user, validate_vendor_link
from ..dependencies.auth import get_current_user, require_role
from ..models.user import User
from ..utils.logger import log_activity

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """List all users. Admin only."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users


@router.post("/", response_model=UserOut, status_code=201)
def admin_create_user(
    body: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Create a new user. Admin only (replaces public signup)."""
    user = create_user(
        db, body,
        created_by_id=current_user.id,
        ip_address=request.client.host if request.client else None,
    )
    return user


@router.patch("/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    body: UserUpdateRole,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Update a user's role. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    old_role = user.role
    validate_vendor_link(db, body.role, body.vendor_id, exclude_user_id=user.id)
    user.role = body.role
    user.vendor_id = body.vendor_id if body.role == "vendor" else None
    log_activity(
        db, current_user.id, "UPDATE", "user", user.id,
        f"Role changed from {old_role} to {body.role} for {user.email}",
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/status", response_model=UserOut)
def update_user_status(
    user_id: int,
    body: UserUpdateStatus,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Activate or deactivate a user. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own status")

    user.is_active = body.is_active
    action = "activated" if body.is_active else "deactivated"
    log_activity(
        db, current_user.id, "UPDATE", "user", user.id,
        f"User {user.email} {action}",
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(user)
    return user
