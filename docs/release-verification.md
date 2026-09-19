# MVP Release Verification

Use this checklist before marking the project complete and moving to another project.

## Release Target

- Repository: `ReneeeeeDev/quorum-grc`
- Branch: `main`
- Release tag: `v1.0.0-mvp`
- Frontend: `https://<your-frontend>.vercel.app`
- Backend: `https://<your-backend>.onrender.com`

## Required Checks

1. GitHub Actions CI is green for the release commit.
2. Vercel deployment points to the release commit.
3. Render backend responds at:
   - `GET /health`
   - `GET /health/ready`
4. Supabase database readiness returns `database: ok`.
5. Production smoke passes:

```bash
PRODUCTION_FRONTEND_URL=https://<your-frontend>.vercel.app \
PRODUCTION_BACKEND_URL=https://<your-backend>.onrender.com \
SMOKE_EMAIL=admin@quorum.local \
SMOKE_PASSWORD=Admin@123 \
node scripts/production-smoke.mjs
```

6. Admin production readiness endpoint is reviewed:

```text
GET /api/ops/production-readiness
```

For a public demo, `status: action_required` is acceptable when demo seed data is intentionally enabled. For real production data, required checks must be ready.

## Production Hardening Controls

- User onboarding: `POST /api/users` for admins and `backend/scripts/create_admin.py` for first-admin bootstrap.
- Email notifications: `POST /api/notifications/{id}/dispatch` with SMTP environment variables.
- File storage: local development storage or S3-compatible production storage.
- SSO: tenant-scoped SSO provider configuration and callback identity mapping.
- Monitoring: `X-Request-ID` response headers, health endpoints, optional Sentry via `SENTRY_DSN`.
- Backups: Supabase backups tracked through `BACKUP_POLICY_URL`.
- Security: rate limits, security headers, CORS origin locking, JWT secret rotation, demo seed off for real production.

## First Admin Bootstrap

When `DEMO_SEED_ENABLED=false`, create the first named admin after migrations:

```bash
cd backend
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=replace-with-a-temporary-strong-password \
ADMIN_NAME="Production Admin" \
ADMIN_TENANT_NAME="Production Organization" \
python scripts/create_admin.py
```

Immediately rotate the temporary password through the normal password-reset process or replace it in the database using a secure operational procedure.

## Completion Decision

The MVP can be marked complete when:

- CI is green.
- Frontend and backend deployments are healthy.
- Production smoke passes.
- `v1.0.0-mvp` is tagged and pushed.
- This checklist is reviewed.
