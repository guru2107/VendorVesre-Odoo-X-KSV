from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal


class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    po_id: int
    tax_rate: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    total: Optional[Decimal] = None
    status: str
    generated_by: Optional[int] = None
    generated_at: datetime
    sent_at: Optional[datetime] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvoiceStatusUpdate(BaseModel):
    status: str
