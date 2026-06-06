from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)
    vendor_id = Column(
        Integer,
        ForeignKey("vendors.id", use_alter=True),
        nullable=True,
    )
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'procurement_officer', 'vendor', 'manager')",
            name="check_user_role",
        ),
    )

    vendor = relationship("Vendor", foreign_keys=[vendor_id], back_populates="linked_user")
    created_vendors = relationship("Vendor", foreign_keys="[Vendor.created_by]", back_populates="created_by_user")
    activity_logs = relationship("ActivityLog", back_populates="user")
