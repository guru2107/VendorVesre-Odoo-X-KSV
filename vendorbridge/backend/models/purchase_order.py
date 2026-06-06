from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    po_number = Column(String(30), unique=True, nullable=False)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    approval_id = Column(Integer, ForeignKey("approvals.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    issued_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default="issued")
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('issued', 'fulfilled', 'cancelled')",
            name="check_po_status",
        ),
    )

    quotation = relationship("Quotation")
    approval = relationship("Approval")
    vendor = relationship("Vendor")
    issuer = relationship("User")
    invoices = relationship("Invoice", back_populates="purchase_order")
