from datetime import date, timedelta
from email.message import EmailMessage
from pathlib import Path
import smtplib
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse, RedirectResponse, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin_user, require_write_user
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash
from app.models import (
    ActionItem,
    ActionStatus,
    AuditLog,
    CalendarEvent,
    ComplianceObligation,
    ComplianceStatus,
    Decision,
    Department,
    Document,
    DeliveryStatus,
    IntegrationConnection,
    IntegrationSyncRun,
    IntegrationStatus,
    Meeting,
    Notification,
    NotificationDelivery,
    NotificationStatus,
    Policy,
    PolicyStatus,
    Role,
    Risk,
    RiskSeverity,
    SSOProvider,
    SSOProviderStatus,
    SyncStatus,
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
    ComplianceObligationCreate,
    ComplianceObligationRead,
    ComplianceObligationUpdate,
    DecisionCreate,
    DecisionRead,
    DepartmentCreate,
    DepartmentRead,
    DocumentCreate,
    DocumentRead,
    IntegrationConnectionCreate,
    IntegrationConnectionRead,
    IntegrationSyncRunRead,
    MeetingCreate,
    MeetingRead,
    NotificationCreate,
    NotificationDeliveryRead,
    NotificationRead,
    NotificationUpdate,
    PolicyCreate,
    PolicyRead,
    PolicyUpdate,
    ReportSummary,
    RiskCreate,
    RiskRead,
    RiskUpdate,
    ReportBreakdown,
    ReportBreakdownItem,
    SSOCallbackRequest,
    SSOCallbackResponse,
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


def scoped_query(db: Session, model: type, current_user: User):
    query = db.query(model)
    if current_user.role != Role.ADMIN and hasattr(model, "tenant_id"):
        query = query.filter(model.tenant_id == current_user.tenant_id)
    return query


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
def list_departments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Department]:
    return scoped_query(db, Department, current_user).order_by(Department.name).all()


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
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[User]:
    return scoped_query(db, User, current_user).order_by(User.name).all()


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
def list_policies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Policy]:
    return scoped_query(db, Policy, current_user).order_by(Policy.updated_at.desc()).all()


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
def list_meetings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Meeting]:
    return scoped_query(db, Meeting, current_user).order_by(Meeting.meeting_date.desc()).all()


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
def list_decisions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Decision]:
    return scoped_query(db, Decision, current_user).order_by(Decision.decision_date.desc()).all()


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
def list_action_items(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[ActionItem]:
    return scoped_query(db, ActionItem, current_user).order_by(ActionItem.due_date.asc()).all()


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
def report_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> ReportSummary:
    today = date.today()
    actions_query = scoped_query(db, ActionItem, current_user)
    policies_query = scoped_query(db, Policy, current_user)
    meetings_query = scoped_query(db, Meeting, current_user)
    notifications_query = scoped_query(db, Notification, current_user)
    documents_query = scoped_query(db, Document, current_user)
    integrations_query = scoped_query(db, IntegrationConnection, current_user)
    open_actions = actions_query.filter(ActionItem.status != ActionStatus.COMPLETE).with_entities(func.count(ActionItem.id)).scalar() or 0
    overdue_items = (
        actions_query
        .filter(ActionItem.due_date < today, ActionItem.status != ActionStatus.COMPLETE)
        .with_entities(func.count(ActionItem.id))
        .scalar()
        or 0
    )
    published_policies = policies_query.filter(Policy.status == PolicyStatus.PUBLISHED).with_entities(func.count(Policy.id)).scalar() or 0
    pending_approvals = policies_query.filter(Policy.status.in_([PolicyStatus.REVIEW, PolicyStatus.APPROVAL])).with_entities(func.count(Policy.id)).scalar() or 0
    upcoming_meetings = meetings_query.filter(Meeting.meeting_date >= today).with_entities(func.count(Meeting.id)).scalar() or 0
    unread_notifications = notifications_query.filter(Notification.status == NotificationStatus.UNREAD).with_entities(func.count(Notification.id)).scalar() or 0
    documents = documents_query.with_entities(func.count(Document.id)).scalar() or 0
    active_integrations = integrations_query.filter(IntegrationConnection.status == IntegrationStatus.CONFIGURED).with_entities(func.count(IntegrationConnection.id)).scalar() or 0
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


def enum_breakdown(query, model_field, values: list[str]) -> list[ReportBreakdownItem]:
    rows = dict(query.with_entities(model_field, func.count()).group_by(model_field).all())
    return [ReportBreakdownItem(label=value, value=rows.get(value, 0)) for value in values]


@router.get("/reports/breakdown", response_model=ReportBreakdown)
def report_breakdown(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> ReportBreakdown:
    today = date.today()
    next_quarter = today + timedelta(days=90)
    meetings = scoped_query(db, Meeting, current_user).filter(Meeting.meeting_date >= today, Meeting.meeting_date <= next_quarter).all()
    meeting_months: dict[str, int] = {}
    for meeting in meetings:
        label = meeting.meeting_date.strftime("%Y-%m")
        meeting_months[label] = meeting_months.get(label, 0) + 1

    return ReportBreakdown(
        policy_status=enum_breakdown(scoped_query(db, Policy, current_user), Policy.status, [status.value for status in PolicyStatus]),
        action_status=enum_breakdown(scoped_query(db, ActionItem, current_user), ActionItem.status, [status.value for status in ActionStatus]),
        risk_severity=enum_breakdown(scoped_query(db, Risk, current_user), Risk.severity, [severity.value for severity in RiskSeverity]),
        compliance_status=enum_breakdown(scoped_query(db, ComplianceObligation, current_user), ComplianceObligation.status, [status.value for status in ComplianceStatus]),
        upcoming_meetings_by_month=[
            ReportBreakdownItem(label=label, value=meeting_months[label])
            for label in sorted(meeting_months)
        ],
    )


@router.get("/reports/export")
def export_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Response:
    summary = report_summary(db, current_user)
    breakdown = report_breakdown(db, current_user)
    lines = ["section,label,value"]
    for key, value in summary.model_dump().items():
        lines.append(f"summary,{key},{value}")
    for section, values in breakdown.model_dump().items():
        for item in values:
            lines.append(f"{section},{item['label']},{item['value']}")
    return Response("\n".join(lines), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=governance-report.csv"})


def audit_query(
    db: Session,
    action: str | None,
    entity_type: str | None,
    actor_id: int | None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if actor_id:
        query = query.filter(AuditLog.actor_id == actor_id)
    if date_from:
        query = query.filter(func.date(AuditLog.created_at) >= date_from)
    if date_to:
        query = query.filter(func.date(AuditLog.created_at) <= date_to)
    return query.order_by(AuditLog.created_at.desc())


@router.get("/audit-logs", response_model=list[AuditLogRead])
def list_audit_logs(
    action: str | None = Query(None),
    entity_type: str | None = Query(None),
    actor_id: int | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[AuditLog]:
    return audit_query(db, action, entity_type, actor_id, date_from, date_to).limit(100).all()


@router.get("/audit-logs/export")
def export_audit_logs(
    action: str | None = Query(None),
    entity_type: str | None = Query(None),
    actor_id: int | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Response:
    rows = audit_query(db, action, entity_type, actor_id, date_from, date_to).limit(1000).all()
    lines = ["id,actor_id,action,entity_type,entity_id,created_at"]
    lines.extend(f"{row.id},{row.actor_id or ''},{row.action},{row.entity_type},{row.entity_id or ''},{row.created_at.isoformat()}" for row in rows)
    return Response("\n".join(lines), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=audit-logs.csv"})


@router.get("/documents", response_model=list[DocumentRead])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Document]:
    return scoped_query(db, Document, current_user).order_by(Document.created_at.desc()).all()


@router.get("/documents/{document_id}/download", response_model=None)
def download_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Response:
    document = get_or_404(db, Document, document_id)
    if current_user.role != Role.ADMIN and document.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access this document")
    if document.storage_path.startswith("s3://"):
        settings = get_settings()
        if not settings.s3_bucket:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="S3 bucket not configured")
        try:
            import boto3

            key = document.storage_path.removeprefix(f"s3://{settings.s3_bucket}/")
            client = boto3.client("s3", region_name=settings.s3_region)
            url = client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.s3_bucket, "Key": key},
                ExpiresIn=300,
            )
            return RedirectResponse(url)
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"S3 download failed: {exc}") from exc
    path = Path(document.storage_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored file not found")
    return FileResponse(path, media_type=document.content_type, filename=document.filename)


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
    safe_name = Path(file.filename or "document").name
    stored_name = f"{uuid4().hex}-{safe_name}"
    content = await file.read()
    if settings.storage_backend == "s3":
        if not settings.s3_bucket:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="S3 bucket not configured")
        try:
            import boto3

            key = f"documents/{stored_name}"
            client = boto3.client("s3", region_name=settings.s3_region)
            client.put_object(Bucket=settings.s3_bucket, Key=key, Body=content, ContentType=file.content_type or "application/octet-stream")
            storage_path = f"s3://{settings.s3_bucket}/{key}"
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"S3 upload failed: {exc}") from exc
    else:
        storage_root = Path(settings.file_storage_path)
        storage_root.mkdir(parents=True, exist_ok=True)
        target = storage_root / stored_name
        target.write_bytes(content)
        storage_path = str(target)
    document = Document(
        tenant_id=tenant_id,
        title=title,
        filename=safe_name,
        content_type=file.content_type or "application/octet-stream",
        file_size=len(content),
        storage_path=storage_path,
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
    query = scoped_query(db, Notification, current_user)
    return (
        query
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


@router.post("/notifications/{notification_id}/dispatch", response_model=NotificationDeliveryRead)
def dispatch_notification(
    notification_id: int,
    channel: str = "email",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> NotificationDelivery:
    notification = get_or_404(db, Notification, notification_id)
    recipient = None
    if notification.user_id:
        recipient_user = db.get(User, notification.user_id)
        recipient = recipient_user.email if recipient_user else None
    delivery = NotificationDelivery(notification_id=notification.id, channel=channel, recipient=recipient, status=DeliveryStatus.SENT)
    settings = get_settings()
    if channel == "email" and settings.smtp_host and recipient:
        try:
            message = EmailMessage()
            message["From"] = settings.notification_from_email
            message["To"] = recipient
            message["Subject"] = notification.title
            message.set_content(notification.message)
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
                smtp.starttls()
                if settings.smtp_username and settings.smtp_password:
                    smtp.login(settings.smtp_username, settings.smtp_password)
                smtp.send_message(message)
        except Exception as exc:
            delivery.status = DeliveryStatus.FAILED
            delivery.error = str(exc)
    db.add(delivery)
    db.flush()
    record_audit_log(db, action="notification.dispatched", entity_type="notification", entity_id=notification.id, actor_id=current_user.id)
    db.commit()
    db.refresh(delivery)
    return delivery


@router.get("/calendar-events", response_model=list[CalendarEventRead])
def list_calendar_events(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[CalendarEvent]:
    return scoped_query(db, CalendarEvent, current_user).order_by(CalendarEvent.event_date.asc()).all()


@router.get("/calendar-events/export.ics")
def export_calendar_ics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Response:
    events = scoped_query(db, CalendarEvent, current_user).order_by(CalendarEvent.event_date.asc()).all()
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Governance Management Portal//EN"]
    for event in events:
        event_date = event.event_date.strftime("%Y%m%d")
        lines.extend(
            [
                "BEGIN:VEVENT",
                f"UID:gmp-event-{event.id}",
                f"DTSTAMP:{date.today().strftime('%Y%m%d')}T000000Z",
                f"DTSTART;VALUE=DATE:{event_date}",
                f"SUMMARY:{event.title}",
                f"DESCRIPTION:{event.description or event.event_type}",
                "END:VEVENT",
            ]
        )
    lines.append("END:VCALENDAR")
    return Response("\r\n".join(lines), media_type="text/calendar", headers={"Content-Disposition": "attachment; filename=governance-calendar.ics"})


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
def list_workflow_steps(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[WorkflowStep]:
    return scoped_query(db, WorkflowStep, current_user).order_by(WorkflowStep.policy_id, WorkflowStep.sequence).all()


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
def list_integrations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[IntegrationConnection]:
    return scoped_query(db, IntegrationConnection, current_user).order_by(IntegrationConnection.name).all()


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


@router.post("/integrations/{integration_id}/sync", response_model=IntegrationSyncRunRead)
def sync_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> IntegrationSyncRun:
    integration = get_or_404(db, IntegrationConnection, integration_id)
    sync_run = IntegrationSyncRun(
        integration_id=integration.id,
        status=SyncStatus.SUCCESS if integration.endpoint_url else SyncStatus.SKIPPED,
        records_processed=0,
        message="Sync job recorded. Add provider credentials to enable live data exchange." if integration.endpoint_url else "Manual integration has no endpoint.",
    )
    db.add(sync_run)
    db.flush()
    record_audit_log(db, action="integration.synced", entity_type="integration", entity_id=integration.id, actor_id=current_user.id)
    db.commit()
    db.refresh(sync_run)
    return sync_run


@router.get("/sso-providers", response_model=list[SSOProviderRead])
def list_sso_providers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[SSOProvider]:
    return scoped_query(db, SSOProvider, current_user).order_by(SSOProvider.name).all()


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


@router.post("/sso-providers/callback", response_model=SSOCallbackResponse)
def sso_callback(payload: SSOCallbackRequest, db: Session = Depends(get_db)) -> SSOCallbackResponse:
    provider = get_or_404(db, SSOProvider, payload.provider_id)
    if provider.status != SSOProviderStatus.ENABLED:
        return SSOCallbackResponse(
            provider_id=provider.id,
            status="disabled",
            email=payload.email,
            access_token=None,
            message="SSO provider is disabled.",
        )

    user = db.query(User).filter(User.email == payload.email).first()
    if user is None:
        return SSOCallbackResponse(
            provider_id=provider.id,
            status="unmapped_user",
            email=payload.email,
            access_token=None,
            message="No portal user is mapped to this identity provider email.",
        )

    access_token = create_access_token(subject=user.email)
    record_audit_log(db, action="sso.login", entity_type="user", entity_id=user.id, actor_id=user.id)
    db.commit()
    return SSOCallbackResponse(
        provider_id=provider.id,
        status="authenticated",
        email=user.email,
        access_token=access_token,
        message="SSO identity mapped to portal user.",
    )


@router.get("/compliance-obligations", response_model=list[ComplianceObligationRead])
def list_compliance_obligations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[ComplianceObligation]:
    return scoped_query(db, ComplianceObligation, current_user).order_by(ComplianceObligation.due_date.asc()).all()


@router.post("/compliance-obligations", response_model=ComplianceObligationRead, status_code=status.HTTP_201_CREATED)
def create_compliance_obligation(
    payload: ComplianceObligationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> ComplianceObligation:
    obligation = ComplianceObligation(**payload.model_dump())
    db.add(obligation)
    db.flush()
    record_audit_log(db, action="compliance_obligation.created", entity_type="compliance_obligation", entity_id=obligation.id, actor_id=current_user.id)
    db.commit()
    db.refresh(obligation)
    return obligation


@router.put("/compliance-obligations/{obligation_id}", response_model=ComplianceObligationRead)
def update_compliance_obligation(
    obligation_id: int,
    payload: ComplianceObligationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> ComplianceObligation:
    obligation = get_or_404(db, ComplianceObligation, obligation_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obligation, key, value)
    record_audit_log(db, action="compliance_obligation.updated", entity_type="compliance_obligation", entity_id=obligation.id, actor_id=current_user.id)
    db.commit()
    db.refresh(obligation)
    return obligation


@router.get("/risks", response_model=list[RiskRead])
def list_risks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Risk]:
    return scoped_query(db, Risk, current_user).order_by(Risk.created_at.desc()).all()


@router.post("/risks", response_model=RiskRead, status_code=status.HTTP_201_CREATED)
def create_risk(
    payload: RiskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> Risk:
    risk = Risk(**payload.model_dump())
    db.add(risk)
    db.flush()
    record_audit_log(db, action="risk.created", entity_type="risk", entity_id=risk.id, actor_id=current_user.id)
    db.commit()
    db.refresh(risk)
    return risk


@router.put("/risks/{risk_id}", response_model=RiskRead)
def update_risk(
    risk_id: int,
    payload: RiskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_user),
) -> Risk:
    risk = get_or_404(db, Risk, risk_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(risk, key, value)
    record_audit_log(db, action="risk.updated", entity_type="risk", entity_id=risk.id, actor_id=current_user.id)
    db.commit()
    db.refresh(risk)
    return risk
