from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Governance Management Portal"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://governance:governance@localhost:5432/governance_portal"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    frontend_origin: str = "http://localhost:3000"
    file_storage_path: str = "storage/documents"
    storage_backend: str = "local"
    s3_bucket: str | None = None
    s3_region: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    notification_from_email: str = "governance@example.com"
    sso_enabled: bool = False
    demo_seed_enabled: bool = True
    rate_limit_per_minute: int = 120

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
