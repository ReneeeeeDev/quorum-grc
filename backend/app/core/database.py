from collections.abc import Generator
from pathlib import Path
from urllib.parse import quote

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


settings = get_settings()
database_url = normalize_database_url(settings.database_url)
if database_url.startswith("sqlite"):
    sqlite_url = database_url
    if sqlite_url not in {"sqlite://", "sqlite:///:memory:"}:
        database_path = Path(sqlite_url.removeprefix("sqlite:///")).expanduser()
        if not database_path.is_absolute():
            database_path = database_path.resolve()
        sqlite_url = f"sqlite:///{quote(database_path.as_posix(), safe='/:')}"
    sqlite_engine_options: dict[str, object] = {"connect_args": {"check_same_thread": False}}
    if database_url in {"sqlite://", "sqlite:///:memory:"}:
        sqlite_engine_options["poolclass"] = StaticPool
    engine = create_engine(sqlite_url, **sqlite_engine_options)
else:
    engine = create_engine(database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
