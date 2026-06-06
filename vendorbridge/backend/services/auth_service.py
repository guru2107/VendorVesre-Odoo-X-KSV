import logging
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models.user import User
from ..models.vendor import Vendor
from ..schemas.user import UserCreate
from ..utils.logger import log_activity

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Default admin credentials
ADMIN_EMAIL = "admin@vendorbridge.com"
ADMIN_PASSWORD = "Admin@123"
ADMIN_NAME = "System Admin"


def seed_admin(db: Session) -> None:
    """Create default admin user if no admin exists."""
    existing_admin = db.query(User).filter(User.role == "admin").first()
    if existing_admin:
        logger.info(f"Admin user already exists: {existing_admin.email}")
        return

    admin = User(
        name=ADMIN_NAME,
        email=ADMIN_EMAIL,
        hashed_password=pwd_context.hash(ADMIN_PASSWORD),
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    logger.info(f"Default admin created: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")


def validate_vendor_link(db: Session, role: str, vendor_id: int | None, exclude_user_id: int | None = None) -> None:
    if role != "vendor":
        return
    if not vendor_id:
        raise HTTPException(status_code=400, detail="vendor_id is required when role is vendor")

    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=400, detail="Vendor not found")
    if vendor.status != "active":
        raise HTTPException(status_code=400, detail="Vendor must be active")

    query = db.query(User).filter(User.vendor_id == vendor_id)
    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)
    if query.first():
        raise HTTPException(status_code=400, detail="Vendor already linked to another user")


def create_user(db: Session, data: UserCreate, created_by_id: int = None, ip_address: str = None) -> User:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    vendor_id = data.vendor_id if data.role == "vendor" else None
    validate_vendor_link(db, data.role, vendor_id)

    user = User(
        name=data.name,
        email=data.email,
        hashed_password=pwd_context.hash(data.password),
        role=data.role,
        vendor_id=vendor_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_activity(db, created_by_id, "CREATE", "user", user.id,
                 f"User {data.email} created with role {data.role}", ip_address)
    db.commit()
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not pwd_context.verify(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user


def create_access_token(data: dict) -> str:
    payload = {**data, "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
