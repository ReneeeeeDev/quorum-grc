from pydantic import BaseModel

from app.models import Role
from app.schemas.common import OrmModel


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class UserRead(OrmModel):
    id: int
    tenant_id: int | None
    name: str
    email: str
    role: Role
    department_id: int | None
