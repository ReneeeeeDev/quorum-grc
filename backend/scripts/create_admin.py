import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import Base, SessionLocal, engine
from app.core.security import get_password_hash
from app.models import Role, Tenant, User


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Set {name} before running this script.")
    return value


def main() -> None:
    email = required_env("ADMIN_EMAIL").lower()
    password = required_env("ADMIN_PASSWORD")
    name = os.getenv("ADMIN_NAME", "Production Admin").strip() or "Production Admin"
    tenant_name = os.getenv("ADMIN_TENANT_NAME", "Production Organization").strip() or "Production Organization"
    tenant_domain = os.getenv("ADMIN_TENANT_DOMAIN", "").strip() or None

    if len(password.encode("utf-8")) > 72:
        raise RuntimeError("ADMIN_PASSWORD must be 72 bytes or fewer for bcrypt.")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"Admin user already exists: {email}")
            return

        tenant = db.query(Tenant).filter(Tenant.name == tenant_name).first()
        if tenant is None:
            tenant = Tenant(name=tenant_name, domain=tenant_domain, is_active=True)
            db.add(tenant)
            db.flush()

        user = User(
            tenant_id=tenant.id,
            name=name,
            email=email,
            hashed_password=get_password_hash(password),
            role=Role.ADMIN,
        )
        db.add(user)
        db.commit()
        print(f"Created admin user: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
