from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_number = Column(String(30), unique=True, nullable=False)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    tax_rate = Column(Numeric(5, 2), default=18.00)
    subtotal = Column(Numeric(14, 2))
    tax_amount = Column(Numeric(14, 2))
    total = Column(Numeric(14, 2))
    status = Column(String(20), default="generated")
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    sent_at = Column(DateTime, nullable=True)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('generated', 'sent', 'paid')",
            name="check_invoice_status",
        ),
    )

    purchase_order = relationship("PurchaseOrder", back_populates="invoices")
    generator = relationship("User")
