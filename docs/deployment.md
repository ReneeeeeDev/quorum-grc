# Deployment

## Current Deployment Readiness

The project is deployable as an MVP with:

- Next.js frontend with server-side `/api` rewrites to the backend.
- FastAPI backend with `/health`.
- PostgreSQL and Redis service definitions.
- Alembic migrations applied by the backend container at startup.
- Production env templates with demo seeding disabled by default.
- Docker health checks for frontend and backend.
- Bounded backend list APIs with `limit` and `offset`.
- Frontend server-side pagination for high-growth tables.

Before production launch, replace all placeholder secrets and test the selected platform with a real PostgreSQL database.

## Recommended Option

For a portfolio/demo deployment, the simplest reliable option is a single Docker host/VPS using `docker-compose` with PostgreSQL and Redis managed by the Compose file.

Why:

- One deployment unit for frontend, backend, database, and Redis.
- The frontend can use same-origin `/api` proxying without CORS complexity.
- Lowest number of platform-specific settings.
- Easy to move later to managed PostgreSQL/S3.

## Docker Compose / VPS

Use the full-stack Compose file for local production-style validation or a small VPS:

```bash
docker-compose up --build
```

The installed CLI on this machine supports `docker-compose`; the newer `docker compose` subcommand is not available here.

Production checklist:

1. Copy `backend/.env.production.example` to a secure platform secret store or `.env` file on the server.
2. Set a strong `JWT_SECRET_KEY`.
3. Set `DEMO_SEED_ENABLED=false` for real production data.
4. Set `FRONTEND_ORIGIN` to the public frontend URL.
5. Set `NEXT_BACKEND_URL=http://backend:8000` for Compose deployments.
6. Run `python backend/scripts/create_admin.py` once with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, and `ADMIN_TENANT_NAME`.
7. Put a reverse proxy such as Caddy, Nginx, or Traefik in front of the frontend container for HTTPS.
8. Back up the `postgres-data` volume.

## Managed Platform Options

For the selected setup, use the dedicated [Vercel + Render + Supabase guide](deploy-vercel-render-supabase.md).

### Render

Good fit for a simple hosted demo:

- Web service: backend Docker image.
- Web service: frontend Docker image.
- Managed PostgreSQL.
- Managed Redis or Redis-compatible service.
- Set frontend `NEXT_BACKEND_URL` to the private backend URL if both services are on the same Render network.
- Set backend `FRONTEND_ORIGIN` to the public frontend URL.

### Vercel + Managed Backend

Good fit when prioritizing Next.js hosting:

- Deploy `frontend/` to Vercel.
- Deploy `backend/` to Render, Railway, Fly.io, or a VPS.
- Use managed PostgreSQL such as Neon, Supabase, Render PostgreSQL, Railway PostgreSQL, or AWS RDS.
- Set `NEXT_BACKEND_URL` on Vercel to the backend public URL.
- Set backend CORS `FRONTEND_ORIGIN` to the Vercel URL.

### Railway

Good fit for fast full-stack demos:

- Deploy frontend and backend as separate services.
- Add PostgreSQL and Redis services.
- Use service-internal URLs for `NEXT_BACKEND_URL`, `DATABASE_URL`, and `REDIS_URL` where available.

### Fly.io

Good fit if you want Docker-first deployment and regional control:

- Deploy backend and frontend as Fly apps.
- Use Fly Postgres or an external managed Postgres.
- Use Upstash/Redis-compatible managed Redis.

### AWS

Good fit for production hardening:

- Frontend: Amplify, ECS, or CloudFront-backed Next.js hosting.
- Backend: ECS Fargate or App Runner.
- Database: RDS PostgreSQL.
- Redis: ElastiCache.
- Documents: S3.
- Secrets: AWS Secrets Manager.

## Secrets

Use `backend/.env.production.example` as the production template. Do not commit live secrets.

Required production secrets:

- `JWT_SECRET_KEY`
- `DATABASE_URL`
- `ADMIN_PASSWORD` for one-time first-admin bootstrap
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SENTRY_DSN` if error monitoring is enabled

## Storage

Default storage is local under `FILE_STORAGE_PATH`.

For S3 or MinIO-compatible storage:

```env
STORAGE_BACKEND=s3
S3_BUCKET=governance-documents
S3_REGION=ap-south-1
```

Uploaded documents are stored as `s3://bucket/documents/<generated-name>` and downloads use short-lived presigned URLs.

## Migrations

Alembic is configured in `backend/alembic.ini`.

Generate a migration:

```bash
cd backend
alembic revision --autogenerate -m "describe change"
```

Apply migrations:

```bash
alembic upgrade head
```

The backend Docker image runs `alembic upgrade head` before starting Uvicorn.

## Smoke Checks

Before deployment:

```bash
cd backend
python scripts/smoke_check.py

cd ../frontend
npm run typecheck
```

After deployment:

```bash
curl https://your-backend.example.com/health
curl https://your-frontend.example.com/login
```

Then sign in with the seeded demo admin only if `DEMO_SEED_ENABLED=true`:

```text
admin@quorum.local / Admin@123
```

For the full deployed smoke flow, set `PRODUCTION_FRONTEND_URL`, `PRODUCTION_BACKEND_URL`, `SMOKE_EMAIL`, and `SMOKE_PASSWORD`, then run:

```bash
node scripts/production-smoke.mjs
```

See [production-smoke-check.md](production-smoke-check.md) and [production-hardening.md](production-hardening.md).
See [monitoring.md](monitoring.md) and [data-policy.md](data-policy.md) for operations and production data rules.
See [MVP Release Verification](release-verification.md) before tagging the final release.
