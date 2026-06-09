from datetime import date, datetime

from pydantic import BaseModel

from app.models import (
    ActionStatus,
    CalendarEventType,
    IntegrationStatus,
    NotificationStatus,
    PolicyStatus,
    Role,
    SSOProviderStatus,
    WorkflowStepStatus,
)
from app.schemas.common import OrmModel


class DepartmentCreate(BaseModel):
    name: str
    head_id: int | None = None
    tenant_id: int | None = None


class DepartmentRead(OrmModel):
    id: int
    tenant_id: int | None
    name: str
    head_id: int | None
    created_at: datetime


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Role
    department_id: int | None = None
    tenant_id: int | None = None


class PolicyCreate(BaseModel):
    tenant_id: int | None = None
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
    tenant_id: int | None
    title: str
    version: str
    status: PolicyStatus
    owner_id: int
    effective_date: date | None
    summary: str | None
    created_at: datetime
    updated_at: datetime


class MeetingCreate(BaseModel):
    tenant_id: int | None = None
    title: str
    meeting_date: date
    committee_id: int | None = None
    agenda: str | None = None
    minutes: str | None = None


class MeetingRead(OrmModel):
    id: int
    tenant_id: int | None
    title: str
    meeting_date: date
    committee_id: int | None
    agenda: str | None
    minutes: str | None
    created_at: datetime


class DecisionCreate(BaseModel):
    tenant_id: int | None = None
    meeting_id: int | None = None
    description: str
    decision_date: date
    owner_id: int | None = None


class DecisionRead(OrmModel):
    id: int
    tenant_id: int | None
    meeting_id: int | None
    description: str
    decision_date: date
    owner_id: int | None
    created_at: datetime


class ActionItemCreate(BaseModel):
    tenant_id: int | None = None
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
    tenant_id: int | None
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
    unread_notifications: int = 0
    documents: int = 0
    active_integrations: int = 0


class TenantCreate(BaseModel):
    name: str
    domain: str | None = None
    is_active: bool = True


class TenantRead(OrmModel):
    id: int
    name: str
    domain: str | None
    is_active: bool
    created_at: datetime


class DocumentCreate(BaseModel):
    tenant_id: int | None = None
    title: str
    filename: str
    content_type: str = "application/octet-stream"
    file_size: int = 0
    storage_path: str
    linked_entity_type: str | None = None
    linked_entity_id: int | None = None


class DocumentRead(OrmModel):
    id: int
    tenant_id: int | None
    title: str
    filename: str
    content_type: str
    file_size: int
    storage_path: str
    linked_entity_type: str | None
    linked_entity_id: int | None
    uploaded_by: int | None
    created_at: datetime


class NotificationCreate(BaseModel):
    tenant_id: int | None = None
    user_id: int | None = None
    title: str
    message: str
    status: NotificationStatus = NotificationStatus.UNREAD
    due_date: date | None = None


class NotificationUpdate(BaseModel):
    status: NotificationStatus | None = None


class NotificationRead(OrmModel):
    id: int
    tenant_id: int | None
    user_id: int | None
    title: str
    message: str
    status: NotificationStatus
    due_date: date | None
    created_at: datetime


class CalendarEventCreate(BaseModel):
    tenant_id: int | None = None
    title: str
    event_type: CalendarEventType = CalendarEventType.MEETING
    event_date: date
    owner_id: int | None = None
    description: str | None = None


class CalendarEventRead(OrmModel):
    id: int
    tenant_id: int | None
    title: str
    event_type: CalendarEventType
    event_date: date
    owner_id: int | None
    description: str | None
    created_at: datetime


class WorkflowStepCreate(BaseModel):
    tenant_id: int | None = None
    policy_id: int
    step_name: str
    approver_id: int
    sequence: int = 1
    status: WorkflowStepStatus = WorkflowStepStatus.PENDING
    comments: str | None = None


class WorkflowStepUpdate(BaseModel):
    status: WorkflowStepStatus | None = None
    comments: str | None = None


class WorkflowStepRead(OrmModel):
    id: int
    tenant_id: int | None
    policy_id: int
    step_name: str
    approver_id: int
    sequence: int
    status: WorkflowStepStatus
    comments: str | None
    created_at: datetime


class IntegrationConnectionCreate(BaseModel):
    tenant_id: int | None = None
    name: str
    integration_type: str
    endpoint_url: str | None = None
    status: IntegrationStatus = IntegrationStatus.CONFIGURED


class IntegrationConnectionRead(OrmModel):
    id: int
    tenant_id: int | None
    name: str
    integration_type: str
    endpoint_url: str | None
    status: IntegrationStatus
    created_at: datetime


class SSOProviderCreate(BaseModel):
    tenant_id: int | None = None
    name: str
    provider_type: str = "saml"
    metadata_url: str | None = None
    status: SSOProviderStatus = SSOProviderStatus.DISABLED


class SSOProviderRead(OrmModel):
    id: int
    tenant_id: int | None
    name: str
    provider_type: str
    metadata_url: str | None
    status: SSOProviderStatus
    created_at: datetime


class SSOLoginResponse(BaseModel):
    provider_id: int
    status: str
    redirect_url: str | None = None
    message: str
