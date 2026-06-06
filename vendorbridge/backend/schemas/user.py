from pydantic import BaseModel, EmailStr, ConfigDict, model_validator
from typing import Literal, Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["admin", "procurement_officer", "vendor", "manager"]
    vendor_id: Optional[int] = None

    @model_validator(mode="after")
    def validate_vendor_link(self):
        if self.role == "vendor" and not self.vendor_id:
            raise ValueError("vendor_id is required when role is vendor")
        if self.role != "vendor":
            self.vendor_id = None
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    vendor_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserUpdateRole(BaseModel):
    role: Literal["admin", "procurement_officer", "vendor", "manager"]
    vendor_id: Optional[int] = None

    @model_validator(mode="after")
    def validate_vendor_link(self):
        if self.role == "vendor" and not self.vendor_id:
            raise ValueError("vendor_id is required when role is vendor")
        return self


class UserUpdateStatus(BaseModel):
    is_active: bool

