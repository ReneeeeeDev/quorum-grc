from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models import Department, Policy, Role, User


def seed_database(db: Session) -> None:
    if db.query(User).first():
        return

    governance = Department(name="Governance Office")
    compliance = Department(name="Compliance")
    audit = Department(name="Internal Audit")
    board = Department(name="Board Secretariat")
    db.add_all([governance, compliance, audit, board])
    db.flush()

    users = [
        User(
            name="Platform Admin",
            email="admin@gmp.local",
            hashed_password=get_password_hash("Admin@123"),
            role=Role.ADMIN,
            department_id=governance.id,
        ),
        User(
            name="Governance Officer",
            email="governance@gmp.local",
            hashed_password=get_password_hash("Governance@123"),
            role=Role.GOVERNANCE_OFFICER,
            department_id=governance.id,
        ),
        User(
            name="Internal Auditor",
            email="auditor@gmp.local",
            hashed_password=get_password_hash("Auditor@123"),
            role=Role.AUDITOR,
            department_id=audit.id,
        ),
        User(
            name="Board Member",
            email="board@gmp.local",
            hashed_password=get_password_hash("Board@123"),
            role=Role.BOARD_MEMBER,
            department_id=board.id,
        ),
    ]
    db.add_all(users)
    db.flush()
    governance.head_id = users[1].id
    audit.head_id = users[2].id

    db.add(
        Policy(
            title="Enterprise Governance Charter",
            version="1.0",
            owner_id=users[1].id,
            summary="Defines governance committee responsibilities, approval paths, and accountability rules.",
        )
    )
    db.commit()

