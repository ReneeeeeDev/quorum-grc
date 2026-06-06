from datetime import date, datetime

from pydantic import BaseModel

from app.models import ActionStatus, PolicyStatus, Role
from app.schemas.common import OrmModel


class DepartmentCreate(BaseModel):
    name: str
    head_id: int | None = None


class DepartmentRead(OrmModel):
    id: int
    name: str
    head_id: int | None
    created_at: datetime


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Role
    department_id: int | None = None


class PolicyCreate(BaseModel):
    title: str
    version: str = "1.0"
    status: PolicyStatus = PolicyStatus.DRAFT
    owner_id: int
    effective_date: date | None = None
    summary: str | None = None


class PolicyUpdate(BaseModel):
    title: str | None = None
    version: str | None = None
    status: PolicyStatus | None = None
    owner_id: int | None = None
    effective_date: date | None = None
    summary: str | None = None


class PolicyRead(OrmModel):
    id: int
    title: str
    version: str
    status: PolicyStatus
    owner_id: int
    effective_date: date | None
    summary: str | None
    created_at: datetime
    updated_at: datetime


class MeetingCreate(BaseModel):
    title: str
    meeting_date: date
    committee_id: int | None = None
    agenda: str | None = None
    minutes: str | None = None


class MeetingRead(OrmModel):
    id: int
    title: str
    meeting_date: date
    committee_id: int | None
    agenda: str | None
    minutes: str | None
    created_at: datetime


class DecisionCreate(BaseModel):
    meeting_id: int | None = None
    description: str
    decision_date: date
    owner_id: int | None = None


class DecisionRead(OrmModel):
    id: int
    meeting_id: int | None
    description: str
    decision_date: date
    owner_id: int | None
    created_at: datetime


class ActionItemCreate(BaseModel):
    decision_id: int | None = None
    title: str
    assigned_to: int
    due_date: date
    status: ActionStatus = ActionStatus.OPEN


class ActionItemUpdate(BaseModel):
    title: str | None = None
    assigned_to: int | None = None
    due_date: date | None = None
    status: ActionStatus | None = None


class ActionItemRead(OrmModel):
    id: int
    decision_id: int | None
    title: str
    assigned_to: int
    due_date: date
    status: ActionStatus
    created_at: datetime


class ReportSummary(BaseModel):
    open_actions: int
    overdue_items: int
    published_policies: int
    pending_approvals: int
    upcoming_meetings: int

