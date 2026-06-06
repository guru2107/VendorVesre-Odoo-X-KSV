from sqlalchemy import (
    Column, Integer, String, Text, Numeric, DateTime, ForeignKey,
    CheckConstraint, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    status = Column(String(20), default="submitted")
    delivery_days = Column(Integer, nullable=False)
    notes = Column(Text)
    subtotal = Column(Numeric(14, 2))
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        UniqueConstraint("rfq_id", "vendor_id", name="uq_quotation_rfq_vendor"),
        CheckConstraint("delivery_days > 0", name="check_quotation_delivery"),
        CheckConstraint(
            "status IN ('submitted', 'under_review', 'accepted', 'rejected')",
            name="check_quotation_status",
        ),
    )

    rfq = relationship("RFQ", back_populates="quotations")
    vendor = relationship("Vendor", back_populates="quotations")
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")


class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    rfq_item_id = Column(Integer, ForeignKey("rfq_items.id"), nullable=False)
    unit_price = Column(Numeric(14, 2), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(14, 2))

    __table_args__ = (
        CheckConstraint("unit_price > 0", name="check_qi_unit_price"),
    )

    quotation = relationship("Quotation", back_populates="items")
    rfq_item = relationship("RFQItem")
