from sqlalchemy.orm import Session

from app.models import AuditLog


def record_audit_log(
    db: Session,
    *,
    action: str,
    entity_type: str,
    actor_id: int | None = None,
    entity_id: int | None = None,
    details: str | None = None,
) -> AuditLog:
    log = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(log)
    return log

