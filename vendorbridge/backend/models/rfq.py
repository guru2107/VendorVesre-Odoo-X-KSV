from sqlalchemy import (
    Column, Integer, String, Text, Numeric, DateTime, ForeignKey,
    CheckConstraint, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class RFQ(Base):
    __tablename__ = "rfqs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    deadline = Column(DateTime, nullable=False)
    status = Column(String(20), default="draft")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        CheckConstraint("status IN ('draft', 'published', 'closed')", name="check_rfq_status"),
    )

    creator = relationship("User", foreign_keys=[created_by])
    items = relationship("RFQItem", back_populates="rfq", cascade="all, delete-orphan")
    attachments = relationship("RFQAttachment", back_populates="rfq", cascade="all, delete-orphan")
    vendor_assignments = relationship("RFQVendor", back_populates="rfq", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="rfq")


class RFQItem(Base):
    __tablename__ = "rfq_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String(200), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)
    unit = Column(String(50))
    specifications = Column(Text)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_rfq_item_quantity"),
    )

    rfq = relationship("RFQ", back_populates="items")


class RFQAttachment(Base):
    __tablename__ = "rfq_attachments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255))
    file_path = Column(String(500))
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    rfq = relationship("RFQ", back_populates="attachments")


class RFQVendor(Base):
    __tablename__ = "rfq_vendors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    invited_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("rfq_id", "vendor_id", name="uq_rfq_vendor"),
    )

    rfq = relationship("RFQ", back_populates="vendor_assignments")
    vendor = relationship("Vendor", back_populates="rfq_assignments")
