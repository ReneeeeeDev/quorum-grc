from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
from time import monotonic

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.routes.auth import router as auth_router
from app.api.routes.governance import router as governance_router
from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.services.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    Base.metadata.create_all(bind=engine)
    if settings.demo_seed_enabled:
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
    yield


settings = get_settings()

app = FastAPI(title=settings.app_name, lifespan=lifespan)

rate_limit_window_seconds = 60
rate_limit_buckets: dict[str, tuple[float, int]] = {}


def security_headers() -> dict[str, str]:
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    }


@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    client_host = request.client.host if request.client else "unknown"
    bucket_key = f"{client_host}:{request.url.path}"
    request_limit = settings.auth_rate_limit_per_minute if request.url.path == "/api/auth/login" else settings.rate_limit_per_minute
    now = monotonic()
    window_start, request_count = rate_limit_buckets.get(bucket_key, (now, 0))
    if now - window_start >= rate_limit_window_seconds:
        window_start, request_count = now, 0
    request_count += 1
    rate_limit_buckets[bucket_key] = (window_start, request_count)

    if request_count > request_limit:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Too many requests"},
            headers={"Retry-After": str(rate_limit_window_seconds), **security_headers()},
        )

    response = await call_next(request)
    response.headers.update(security_headers())
    return response

allowed_origins = sorted({settings.frontend_origin, "http://localhost:3000", "http://127.0.0.1:3000"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(governance_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.get("/health/ready")
def readiness() -> dict[str, str]:
    db = SessionLocal()
    try:
        db.execute(text("select 1"))
    finally:
        db.close()
    return {"status": "ready", "database": "ok"}
