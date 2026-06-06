from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
import re


class VendorCreate(BaseModel):
    company_name: str
    category: str
    gst_number: Optional[str] = None
    contact_person: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None

    @field_validator("gst_number")
    @classmethod
    def validate_gst(cls, v):
        if v and not re.match(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$", v):
            raise ValueError("Invalid GST number format. Expected: 22AAAAA0000A1Z5")
        return v


class VendorUpdate(BaseModel):
    company_name: Optional[str] = None
    category: Optional[str] = None
    gst_number: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None


class VendorOut(BaseModel):
    id: int
    company_name: str
    category: Optional[str] = None
    gst_number: Optional[str] = None
    contact_person: Optional[str] = None
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    status: str
    created_by: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VendorListResponse(BaseModel):
    vendors: List[VendorOut]
    total: int
