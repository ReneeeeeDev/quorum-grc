# Monitoring Runbook

Use this runbook after every Render and Vercel deployment.

## Render Backend

- Open the Render service logs immediately after deploy.
- Confirm startup reaches the Uvicorn listening line without migration, database, or seed failures.
- Check these URLs:

```text
GET https://governance-management-portal.onrender.com/health
GET https://governance-management-portal.onrender.com/health/ready
```

Expected:

- `/health` returns `200`.
- `/health/ready` returns `200` and `database: ok`.
- Security headers are present:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
- `X-Request-ID` is present and can be used to correlate support reports with backend logs.

## Error Tracking

- Set `SENTRY_DSN` in Render to enable backend exception capture.
- Keep `ENVIRONMENT=production` so Sentry events are tagged correctly.
- Use the `X-Request-ID` response header in user bug reports and support notes.

## Vercel Frontend

- Confirm the latest Git commit is deployed.
- Confirm `/login` loads without a framework error.
- Confirm Vercel build output has no TypeScript or Next.js build failures.

## Operational Alerts

Create uptime checks for:

```text
https://governance-management-portal.onrender.com/health
https://governance-management-portal.onrender.com/health/ready
https://governance-management-portal-4g7p.vercel.app/login
```

Alert if any check fails two times in a row.

## Weekly Review

- Review Render logs for repeated `401`, `403`, `429`, and `500` responses.
- Review audit logs for:
  - `auth.login_failed`
  - unexpected `user.created`
  - unexpected `policy.deleted`
  - repeated admin activity outside expected demo/test windows
- Confirm Supabase backups are enabled.
- Confirm the Render service is not repeatedly cold-starting during demo hours.

## Incident Triage

1. Check Render `/health/ready`.
2. Check Render logs for database connection errors.
3. Check Vercel environment variable `NEXT_BACKEND_URL`.
4. Check Render environment variable `FRONTEND_ORIGIN`.
5. Run `node scripts/production-smoke.mjs`.
6. Review `/api/ops/production-readiness` as an Admin user.
