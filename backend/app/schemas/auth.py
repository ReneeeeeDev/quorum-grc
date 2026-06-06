from pydantic import BaseModel

from app.models import Role
from app.schemas.common import OrmModel


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(OrmModel):
    id: int
    name: str
    email: str
    role: Role
    department_id: int | None
