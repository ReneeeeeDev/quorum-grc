from datetime import date

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models import (
    CalendarEvent,
    CalendarEventType,
    Department,
    IntegrationConnection,
    Notification,
    Policy,
    Role,
    SSOProvider,
    Tenant,
    User,
)


def seed_database(db: Session) -> None:
    if db.query(User).first():
        return

    tenant = Tenant(name="Acme Enterprise", domain="acme.example")
    db.add(tenant)
    db.flush()

    governance = Department(name="Governance Office", tenant_id=tenant.id)
    compliance = Department(name="Compliance", tenant_id=tenant.id)
    audit = Department(name="Internal Audit", tenant_id=tenant.id)
    board = Department(name="Board Secretariat", tenant_id=tenant.id)
    db.add_all([governance, compliance, audit, board])
    db.flush()

    users = [
        User(
            name="Platform Admin",
            email="admin@gmp.local",
            hashed_password=get_password_hash("Admin@123"),
            role=Role.ADMIN,
            tenant_id=tenant.id,
            department_id=governance.id,
        ),
        User(
            name="Governance Officer",
            email="governance@gmp.local",
            hashed_password=get_password_hash("Governance@123"),
            role=Role.GOVERNANCE_OFFICER,
            tenant_id=tenant.id,
            department_id=governance.id,
        ),
        User(
            name="Internal Auditor",
            email="auditor@gmp.local",
            hashed_password=get_password_hash("Auditor@123"),
            role=Role.AUDITOR,
            tenant_id=tenant.id,
            department_id=audit.id,
        ),
        User(
            name="Board Member",
            email="board@gmp.local",
            hashed_password=get_password_hash("Board@123"),
            role=Role.BOARD_MEMBER,
            tenant_id=tenant.id,
            department_id=board.id,
        ),
    ]
    db.add_all(users)
    db.flush()
    governance.head_id = users[1].id
    audit.head_id = users[2].id

    db.add(
        Policy(
            tenant_id=tenant.id,
            title="Enterprise Governance Charter",
            version="1.0",
            owner_id=users[1].id,
            summary="Defines governance committee responsibilities, approval paths, and accountability rules.",
        )
    )
    db.add(
        CalendarEvent(
            tenant_id=tenant.id,
            title="Quarterly Governance Committee",
            event_type=CalendarEventType.MEETING,
            event_date=date(2026, 7, 1),
            owner_id=users[1].id,
            description="Review policy lifecycle, action items, and governance KPIs.",
        )
    )
    db.add(
        Notification(
            tenant_id=tenant.id,
            user_id=users[1].id,
            title="Policy review due",
            message="Enterprise Governance Charter should be reviewed before publication.",
        )
    )
    db.add(
        IntegrationConnection(
            tenant_id=tenant.id,
            name="Compliance Portal",
            integration_type="compliance",
            endpoint_url="https://compliance.example/api",
        )
    )
    db.add(
        SSOProvider(
            tenant_id=tenant.id,
            name="Corporate Identity Provider",
            provider_type="saml",
            metadata_url="https://idp.example/metadata",
        )
    )
    db.commit()
