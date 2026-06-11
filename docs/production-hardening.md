# Production Hardening

These items are prepared for the later deployment pass. They do not require live Vercel, Render, or Supabase access to keep in the repository.

## Monitoring

- Use Render service logs for backend request and exception visibility.
- Add an uptime monitor against:
  - `GET /health`
  - `GET /health/ready`
- Alert if either endpoint fails for more than two consecutive checks.
- Review failed auth attempts and repeated `429` responses during weekly operations review.
- Use [Monitoring Runbook](monitoring.md) as the recurring operations checklist.

## Backups

- Enable Supabase daily backups before production use.
- Take a manual Supabase backup before schema changes.
- Keep migration files in `backend/alembic/versions` as the source of truth.
- Restore-test a backup before treating the system as production-ready.

## Secrets

- Store secrets only in platform secret managers.
- Rotate `JWT_SECRET_KEY` before public launch.
- Do not use demo credentials in real production.
- Required production secrets are listed in `backend/.env.production.example`.

## Security

- Keep `DEMO_SEED_ENABLED=false` for production.
- Set `FRONTEND_ORIGIN` to the exact Vercel URL.
- Keep API rate limiting enabled with `RATE_LIMIT_PER_MINUTE`.
- Keep auth-specific rate limiting enabled with `AUTH_RATE_LIMIT_PER_MINUTE`.
- Keep security headers enabled through backend middleware.
- Restrict admin accounts to named users only.

## Email

- Configure SMTP only after selecting a sender provider.
- Use a verified sender address for `NOTIFICATION_FROM_EMAIL`.
- Test notification dispatch from `/api/notifications/{notification_id}/dispatch`.
- Monitor failed rows in notification delivery records.

## Storage

- Use S3 or a compatible object store for production documents.
- Set:
  - `STORAGE_BACKEND=s3`
  - `S3_BUCKET`
  - `S3_REGION`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
- Confirm document upload and download through the production smoke process.

## Redis

- Redis is configured as a production-ready service dependency, but the MVP does not require it for core CRUD flows.
- Keep `REDIS_URL` available for later caching, queues, or session enhancements.

## Release Gate

Before calling the deployed app production-ready:

1. Deploy frontend and backend.
2. Apply database migrations.
3. Set production environment variables.
4. Run `node scripts/production-smoke.mjs`.
5. Confirm backup policy and uptime monitors are active.
6. Confirm [Production Data Policy](data-policy.md) is followed for demo vs real data.
