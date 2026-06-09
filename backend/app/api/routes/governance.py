from datetime import date
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin_user, require_write_user
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models import (
    ActionItem,
    ActionStatus,
    AuditLog,
    CalendarEvent,
    Decision,
    Department,
    Document,
    IntegrationConnection,
    IntegrationStatus,
    Meeting,
    Notification,
    NotificationStatus,
    Policy,
    PolicyStatus,
    Role,
    SSOProvider,
    SSOProviderStatus,
    Tenant,
    User,
    WorkflowStep,
)
from app.schemas import (
    ActionItemCreate,
    ActionItemRead,
    ActionItemUpdate,
    AuditLogRead,
    CalendarEventCreate,
    CalendarEventRead,
    DecisionCreate,
    DecisionRead,
    DepartmentCreate,
    DepartmentRead,
    DocumentCreate,
    DocumentRead,
    IntegrationConnectionCreate,
    IntegrationConnectionRead,
    MeetingCreate,
    MeetingRead,
    NotificationCreate,
    NotificationRead,
    NotificationUpdate,
    PolicyCreate,
    PolicyRead,
    PolicyUpdate,
    ReportSummary,
    SSOLoginResponse,
    SSOProviderCreate,
    SSOProviderRead,
    TenantCreate,
    TenantRead,
    UserCreate,
    UserRead,
    WorkflowStepCreate,
    WorkflowStepRead,
    WorkflowStepUpdate,
)
from app.services.audit import record_audit_log


router = APIRouter(prefix="/api", tags=["governance"])


def get_or_404(db: Session, model: type, entity_id: int):
    entity = db.get(model, entity_id)
    if entity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{model.__name__} not found")
    return entity


@router.get("/tenants", response_model=list[TenantRead])
def list_tenants(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[Tenant]:
    return db.query(Tenant).order_by(Tenant.name).all()


@router.post("/tenants", response_model=TenantRead, status_code=status.HTTP_201_CREATED)
def create_tenant(
    payload: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> Tenant:
    tenant = Tenant(**payload.model_dump())
    db.add(tenant)
    db.flush()
    record_audit_log(db, action="tenant.created", entity_type="tenant", entity_id=tenant.id, actor_id=current_user.id)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.get("/departments", response_model=list[DepartmentRead])
def list_departments(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[Department]:
    return db.query(Department).order_by(Department.name).all()


@router.post("/departments", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> Department:
    department = Department(**payload.model_dump())
    db.add(department)
    db.flush()
    record_audit_log(db, action="department.created", entity_type="department", entity_id=department.id, actor_id=current_user.id)
    db.commit()
    db.refresh(department)
    return department


@router.get("/users", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[User]:
    return db.query(User).order_by(User.name).all()


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> User:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    data = payload.model_dump(exclude={"password"})
    user = User(**data, hashed_password=get_password_hash(payload.password))
    db.add(user)
    db.flush()
    record_audit_log(db, action="user.created", entity_type="user", entity_id=user.id, actor_id=current_user.id)
    db.commit()
    db.refresh(user)
    return user


@router.get("/policies", response_model=list[PolicyRead])
def list_policies(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[Policy]:
    return db.query(Policy).order_by(Policy.updated_at.desc()).all()


@router.post("/policies", response_model=PolicyRead, status_code=status.HTTP_201_CREATED)
def create_policy(
    payload: PolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> Policy:
    policy = Policy(**payload.model_dump())
    db.add(policy)
    db.flush()
    record_audit_log(db, action="policy.created", entity_type="policy", entity_id=policy.id, actor_id=current_user.id)
    db.commit()
    db.refresh(policy)
    return policy


@router.put("/policies/{policy_id}", response_model=PolicyRead)
def update_policy(
    policy_id: int,
    payload: PolicyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> Policy:
    policy = get_or_404(db, Policy, policy_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(policy, key, value)
    record_audit_log(db, action="policy.updated", entity_type="policy", entity_id=policy.id, actor_id=current_user.id)
    db.commit()
    db.refresh(policy)
    return policy


@router.delete("/policies/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> None:
    policy = get_or_404(db, Policy, policy_id)
    db.delete(policy)
    record_audit_log(db, action="policy.deleted", entity_type="policy", entity_id=policy_id, actor_id=current_user.id)
    db.commit()


@router.get("/meetings", response_model=list[MeetingRead])
def list_meetings(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[Meeting]:
    return db.query(Meeting).order_by(Meeting.meeting_date.desc()).all()


@router.post("/meetings", response_model=MeetingRead, status_code=status.HTTP_201_CREATED)
def create_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> Meeting:
    meeting = Meeting(**payload.model_dump())
    db.add(meeting)
    db.flush()
    record_audit_log(db, action="meeting.created", entity_type="meeting", entity_id=meeting.id, actor_id=current_user.id)
    db.commit()
    db.refresh(meeting)
    return meeting


@router.get("/decisions", response_model=list[DecisionRead])
def list_decisions(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[Decision]:
    return db.query(Decision).order_by(Decision.decision_date.desc()).all()


@router.post("/decisions", response_model=DecisionRead, status_code=status.HTTP_201_CREATED)
def create_decision(
    payload: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> Decision:
    decision = Decision(**payload.model_dump())
    db.add(decision)
    db.flush()
    record_audit_log(db, action="decision.created", entity_type="decision", entity_id=decision.id, actor_id=current_user.id)
    db.commit()
    db.refresh(decision)
    return decision


@router.get("/action-items", response_model=list[ActionItemRead])
def list_action_items(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[ActionItem]:
    return db.query(ActionItem).order_by(ActionItem.due_date.asc()).all()


@router.post("/action-items", response_model=ActionItemRead, status_code=status.HTTP_201_CREATED)
def create_action_item(
    payload: ActionItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> ActionItem:
    item = ActionItem(**payload.model_dump())
    db.add(item)
    db.flush()
    db.add(
        Notification(
            tenant_id=item.tenant_id,
            user_id=item.assigned_to,
            title="New governance action assigned",
            message=item.title,
            due_date=item.due_date,
        )
    )
    record_audit_log(db, action="action_item.created", entity_type="action_item", entity_id=item.id, actor_id=current_user.id)
    db.commit()
    db.refresh(item)
    return item


@router.put("/action-items/{action_item_id}", response_model=ActionItemRead)
def update_action_item(
    action_item_id: int,
    payload: ActionItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> ActionItem:
    item = get_or_404(db, ActionItem, action_item_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    record_audit_log(db, action="action_item.updated", entity_type="action_item", entity_id=item.id, actor_id=current_user.id)
    db.commit()
    db.refresh(item)
    return item


@router.get("/reports", response_model=ReportSummary)
def report_summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> ReportSummary:
    today = date.today()
    open_actions = db.query(func.count(ActionItem.id)).filter(ActionItem.status != ActionStatus.COMPLETE).scalar() or 0
    overdue_items = (
        db.query(func.count(ActionItem.id))
        .filter(ActionItem.due_date < today, ActionItem.status != ActionStatus.COMPLETE)
        .scalar()
        or 0
    )
    published_policies = db.query(func.count(Policy.id)).filter(Policy.status == PolicyStatus.PUBLISHED).scalar() or 0
    pending_approvals = db.query(func.count(Policy.id)).filter(Policy.status.in_([PolicyStatus.REVIEW, PolicyStatus.APPROVAL])).scalar() or 0
    upcoming_meetings = db.query(func.count(Meeting.id)).filter(Meeting.meeting_date >= today).scalar() or 0
    unread_notifications = db.query(func.count(Notification.id)).filter(Notification.status == NotificationStatus.UNREAD).scalar() or 0
    documents = db.query(func.count(Document.id)).scalar() or 0
    active_integrations = db.query(func.count(IntegrationConnection.id)).filter(IntegrationConnection.status == IntegrationStatus.CONFIGURED).scalar() or 0
    return ReportSummary(
        open_actions=open_actions,
        overdue_items=overdue_items,
        published_policies=published_policies,
        pending_approvals=pending_approvals,
        upcoming_meetings=upcoming_meetings,
        unread_notifications=unread_notifications,
        documents=documents,
        active_integrations=active_integrations,
    )


@router.get("/audit-logs", response_model=list[AuditLogRead])
def list_audit_logs(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[AuditLog]:
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()


@router.get("/documents", response_model=list[DocumentRead])
def list_documents(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[Document]:
    return db.query(Document).order_by(Document.created_at.desc()).all()


@router.post("/documents", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def create_document_metadata(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> Document:
    document = Document(**payload.model_dump(), uploaded_by=current_user.id)
    db.add(document)
    db.flush()
    record_audit_log(db, action="document.created", entity_type="document", entity_id=document.id, actor_id=current_user.id)
    db.commit()
    db.refresh(document)
    return document


@router.post("/documents/upload", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_document(
    title: str = Form(...),
    tenant_id: int | None = Form(None),
    linked_entity_type: str | None = Form(None),
    linked_entity_id: int | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> Document:
    settings = get_settings()
    storage_root = Path(settings.file_storage_path)
    storage_root.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file.filename or "document").name
    stored_name = f"{uuid4().hex}-{safe_name}"
    target = storage_root / stored_name
    content = await file.read()
    target.write_bytes(content)
    document = Document(
        tenant_id=tenant_id,
        title=title,
        filename=safe_name,
        content_type=file.content_type or "application/octet-stream",
        file_size=len(content),
        storage_path=str(target),
        linked_entity_type=linked_entity_type,
        linked_entity_id=linked_entity_id,
        uploaded_by=current_user.id,
    )
    db.add(document)
    db.flush()
    record_audit_log(db, action="document.uploaded", entity_type="document", entity_id=document.id, actor_id=current_user.id)
    db.commit()
    db.refresh(document)
    return document


@router.get("/notifications", response_model=list[NotificationRead])
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Notification]:
    return (
        db.query(Notification)
        .filter((Notification.user_id == current_user.id) | (Notification.user_id.is_(None)))
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.post("/notifications", response_model=NotificationRead, status_code=status.HTTP_201_CREATED)
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> Notification:
    notification = Notification(**payload.model_dump())
    db.add(notification)
    db.flush()
    record_audit_log(db, action="notification.created", entity_type="notification", entity_id=notification.id, actor_id=current_user.id)
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/notifications/{notification_id}", response_model=NotificationRead)
def update_notification(
    notification_id: int,
    payload: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Notification:
    notification = get_or_404(db, Notification, notification_id)
    if notification.user_id not in (None, current_user.id) and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot update this notification")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(notification, key, value)
    db.commit()
    db.refresh(notification)
    return notification


@router.get("/calendar-events", response_model=list[CalendarEventRead])
def list_calendar_events(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[CalendarEvent]:
    return db.query(CalendarEvent).order_by(CalendarEvent.event_date.asc()).all()


@router.post("/calendar-events", response_model=CalendarEventRead, status_code=status.HTTP_201_CREATED)
def create_calendar_event(
    payload: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> CalendarEvent:
    event = CalendarEvent(**payload.model_dump())
    db.add(event)
    db.flush()
    record_audit_log(db, action="calendar_event.created", entity_type="calendar_event", entity_id=event.id, actor_id=current_user.id)
    db.commit()
    db.refresh(event)
    return event


@router.get("/workflow-steps", response_model=list[WorkflowStepRead])
def list_workflow_steps(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[WorkflowStep]:
    return db.query(WorkflowStep).order_by(WorkflowStep.policy_id, WorkflowStep.sequence).all()


@router.post("/workflow-steps", response_model=WorkflowStepRead, status_code=status.HTTP_201_CREATED)
def create_workflow_step(
    payload: WorkflowStepCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> WorkflowStep:
    step = WorkflowStep(**payload.model_dump())
    db.add(step)
    db.flush()
    record_audit_log(db, action="workflow_step.created", entity_type="workflow_step", entity_id=step.id, actor_id=current_user.id)
    db.commit()
    db.refresh(step)
    return step


@router.put("/workflow-steps/{step_id}", response_model=WorkflowStepRead)
def update_workflow_step(
    step_id: int,
    payload: WorkflowStepUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> WorkflowStep:
    step = get_or_404(db, WorkflowStep, step_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(step, key, value)
    record_audit_log(db, action="workflow_step.updated", entity_type="workflow_step", entity_id=step.id, actor_id=current_user.id)
    db.commit()
    db.refresh(step)
    return step


@router.get("/integrations", response_model=list[IntegrationConnectionRead])
def list_integrations(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[IntegrationConnection]:
    return db.query(IntegrationConnection).order_by(IntegrationConnection.name).all()


@router.post("/integrations", response_model=IntegrationConnectionRead, status_code=status.HTTP_201_CREATED)
def create_integration(
    payload: IntegrationConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> IntegrationConnection:
    integration = IntegrationConnection(**payload.model_dump())
    db.add(integration)
    db.flush()
    record_audit_log(db, action="integration.created", entity_type="integration", entity_id=integration.id, actor_id=current_user.id)
    db.commit()
    db.refresh(integration)
    return integration


@router.get("/sso-providers", response_model=list[SSOProviderRead])
def list_sso_providers(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[SSOProvider]:
    return db.query(SSOProvider).order_by(SSOProvider.name).all()


@router.post("/sso-providers", response_model=SSOProviderRead, status_code=status.HTTP_201_CREATED)
def create_sso_provider(
    payload: SSOProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> SSOProvider:
    provider = SSOProvider(**payload.model_dump())
    db.add(provider)
    db.flush()
    record_audit_log(db, action="sso_provider.created", entity_type="sso_provider", entity_id=provider.id, actor_id=current_user.id)
    db.commit()
    db.refresh(provider)
    return provider


@router.get("/sso-providers/{provider_id}/login", response_model=SSOLoginResponse)
def sso_login(provider_id: int, db: Session = Depends(get_db)) -> SSOLoginResponse:
    provider = get_or_404(db, SSOProvider, provider_id)
    if provider.status != SSOProviderStatus.ENABLED:
        return SSOLoginResponse(
            provider_id=provider.id,
            status="disabled",
            redirect_url=None,
            message="SSO provider is configured but disabled. Enable it after IdP metadata validation.",
        )
    return SSOLoginResponse(
        provider_id=provider.id,
        status="ready",
        redirect_url=provider.metadata_url,
        message="Redirect URL placeholder returned for MVP SSO handoff.",
    )
