from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ApprovalRequest(BaseModel):
    quotation_id: int


class ApprovalReview(BaseModel):
    remarks: Optional[str] = None


class ApprovalOut(BaseModel):
    id: int
    quotation_id: int
    rfq_id: int
    requested_by: int
    reviewed_by: Optional[int] = None
    status: str
    remarks: Optional[str] = None
    requested_at: datetime
    reviewed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
