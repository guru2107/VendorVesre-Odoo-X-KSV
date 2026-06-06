from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class RFQItemCreate(BaseModel):
    product_name: str
    quantity: float
    unit: Optional[str] = None
    specifications: Optional[str] = None


class RFQItemOut(BaseModel):
    id: int
    product_name: str
    quantity: Decimal
    unit: Optional[str] = None
    specifications: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RFQCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: datetime
    items: List[RFQItemCreate]
    vendor_ids: List[int]


class RFQOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    deadline: datetime
    status: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    items: List[RFQItemOut] = []
    vendor_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)


class RFQVendorOut(BaseModel):
    id: int
    rfq_id: int
    vendor_id: int
    invited_at: datetime

    model_config = ConfigDict(from_attributes=True)
