from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
from time import monotonic

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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


@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    client_host = request.client.host if request.client else "unknown"
    now = monotonic()
    window_start, request_count = rate_limit_buckets.get(client_host, (now, 0))
    if now - window_start >= rate_limit_window_seconds:
        window_start, request_count = now, 0
    request_count += 1
    rate_limit_buckets[client_host] = (window_start, request_count)

    if request_count > settings.rate_limit_per_minute:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Too many requests"},
            headers={"Retry-After": str(rate_limit_window_seconds)},
        )

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
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
