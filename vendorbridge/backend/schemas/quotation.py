from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class QuotationItemSubmit(BaseModel):
    rfq_item_id: int
    unit_price: float


class QuotationSubmit(BaseModel):
    rfq_id: int
    delivery_days: int
    notes: Optional[str] = None
    items: List[QuotationItemSubmit]


class QuotationItemOut(BaseModel):
    id: int
    rfq_item_id: int
    unit_price: Decimal
    quantity: Decimal
    total_price: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)


class QuotationOut(BaseModel):
    id: int
    rfq_id: int
    vendor_id: int
    status: str
    delivery_days: int
    notes: Optional[str] = None
    subtotal: Optional[Decimal] = None
    submitted_at: datetime
    items: List[QuotationItemOut] = []

    model_config = ConfigDict(from_attributes=True)


class CompareItemOut(BaseModel):
    rfq_item_id: int
    product_name: str
    unit_price: Decimal
    quantity: Decimal
    total_price: Optional[Decimal] = None


class CompareQuotationOut(BaseModel):
    id: int
    vendor_name: str
    delivery_days: int
    subtotal: Optional[Decimal] = None
    items: List[CompareItemOut] = []


class CompareResponse(BaseModel):
    rfq: dict
    quotations: List[CompareQuotationOut]
    lowest_prices: dict
