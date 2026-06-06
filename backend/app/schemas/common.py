from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class AuditLogRead(OrmModel):
    id: int
    actor_id: int | None
    action: str
    entity_type: str
    entity_id: int | None
    details: str | None
    created_at: datetime

