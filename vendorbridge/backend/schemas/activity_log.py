from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ActivityLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    description: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
