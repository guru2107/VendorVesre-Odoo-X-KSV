from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_name = Column(String(200), nullable=False)
    category = Column(String(100))
    gst_number = Column(String(20), unique=True)
    contact_person = Column(String(100))
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20))
    address = Column(Text)
    status = Column(String(20), default="active")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'inactive', 'blacklisted')",
            name="check_vendor_status",
        ),
    )

    created_by_user = relationship("User", foreign_keys=[created_by], back_populates="created_vendors")
    linked_user = relationship("User", foreign_keys="[User.vendor_id]", back_populates="vendor")
    rfq_assignments = relationship("RFQVendor", back_populates="vendor")
    quotations = relationship("Quotation", back_populates="vendor")
