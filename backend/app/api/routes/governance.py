from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin_user, require_write_user
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models import ActionItem, ActionStatus, AuditLog, Decision, Department, Meeting, Policy, PolicyStatus, User
from app.schemas import (
    ActionItemCreate,
    ActionItemRead,
    ActionItemUpdate,
    AuditLogRead,
    DecisionCreate,
    DecisionRead,
    DepartmentCreate,
    DepartmentRead,
    MeetingCreate,
    MeetingRead,
    PolicyCreate,
    PolicyRead,
    PolicyUpdate,
    ReportSummary,
    UserCreate,
    UserRead,
)
from app.services.audit import record_audit_log


router = APIRouter(prefix="/api", tags=["governance"])


def get_or_404(db: Session, model: type, entity_id: int):
    entity = db.get(model, entity_id)
    if entity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{model.__name__} not found")
    return entity


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
    return ReportSummary(
        open_actions=open_actions,
        overdue_items=overdue_items,
        published_policies=published_policies,
        pending_approvals=pending_approvals,
        upcoming_meetings=upcoming_meetings,
    )


@router.get("/audit-logs", response_model=list[AuditLogRead])
def list_audit_logs(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[AuditLog]:
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()

