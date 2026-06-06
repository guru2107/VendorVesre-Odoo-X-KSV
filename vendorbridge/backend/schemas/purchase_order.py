from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal


class PurchaseOrderOut(BaseModel):
    id: int
    po_number: str
    quotation_id: int
    approval_id: int
    vendor_id: int
    issued_by: Optional[int] = None
    status: str
    issued_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class POStatusUpdate(BaseModel):
    status: str
