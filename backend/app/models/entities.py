from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ActionStatus, PolicyStatus, ReviewStatus, Role


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    head_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    head: Mapped["User | None"] = relationship("User", foreign_keys=[head_id])
    users: Mapped[list["User"]] = relationship("User", back_populates="department", foreign_keys="User.department_id")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.MANAGER)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    department: Mapped[Department | None] = relationship("Department", back_populates="users", foreign_keys=[department_id])
    policies_owned: Mapped[list["Policy"]] = relationship("Policy", back_populates="owner")


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    version: Mapped[str] = mapped_column(String(40), default="1.0")
    status: Mapped[PolicyStatus] = mapped_column(Enum(PolicyStatus), default=PolicyStatus.DRAFT, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    effective_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    owner: Mapped[User] = relationship("User", back_populates="policies_owned")
    reviews: Mapped[list["PolicyReview"]] = relationship("PolicyReview", back_populates="policy", cascade="all, delete-orphan")


class PolicyReview(Base):
    __tablename__ = "policy_reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    policy_id: Mapped[int] = mapped_column(ForeignKey("policies.id"))
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[ReviewStatus] = mapped_column(Enum(ReviewStatus), default=ReviewStatus.PENDING)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    policy: Mapped[Policy] = relationship("Policy", back_populates="reviews")
    reviewer: Mapped[User] = relationship("User")


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    meeting_date: Mapped[date] = mapped_column(Date)
    committee_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    agenda: Mapped[str | None] = mapped_column(Text, nullable=True)
    minutes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    committee: Mapped[Department | None] = relationship("Department")
    decisions: Mapped[list["Decision"]] = relationship("Decision", back_populates="meeting")


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int | None] = mapped_column(ForeignKey("meetings.id"), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    decision_date: Mapped[date] = mapped_column(Date)
    owner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    meeting: Mapped[Meeting | None] = relationship("Meeting", back_populates="decisions")
    owner: Mapped[User | None] = relationship("User")
    action_items: Mapped[list["ActionItem"]] = relationship("ActionItem", back_populates="decision")


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    decision_id: Mapped[int | None] = mapped_column(ForeignKey("decisions.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(200))
    assigned_to: Mapped[int] = mapped_column(ForeignKey("users.id"))
    due_date: Mapped[date] = mapped_column(Date)
    status: Mapped[ActionStatus] = mapped_column(Enum(ActionStatus), default=ActionStatus.OPEN)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    decision: Mapped[Decision | None] = relationship("Decision", back_populates="action_items")
    assignee: Mapped[User] = relationship("User")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(120), index=True)
    entity_type: Mapped[str] = mapped_column(String(80), index=True)
    entity_id: Mapped[int | None] = mapped_column(nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    actor: Mapped[User | None] = relationship("User")

