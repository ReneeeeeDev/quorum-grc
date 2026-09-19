# Production Smoke Check

Use this after Vercel, Render, and Supabase are connected. It validates the deployed frontend, deployed backend, authentication, CORS, key governance APIs, security headers, database readiness, and production readiness metadata.

## Required Variables

```bash
PRODUCTION_FRONTEND_URL=https://your-vercel-app.vercel.app
PRODUCTION_BACKEND_URL=https://your-render-api.onrender.com
SMOKE_EMAIL=admin@quorum.local
SMOKE_PASSWORD=Admin@123
```

Use a dedicated smoke-test user in real production. The demo credentials only work when demo seeding is enabled.

## Run

From the repository root:

```bash
node scripts/production-smoke.mjs
```

PowerShell example:

```powershell
$env:PRODUCTION_FRONTEND_URL="https://your-vercel-app.vercel.app"
$env:PRODUCTION_BACKEND_URL="https://your-render-api.onrender.com"
$env:SMOKE_EMAIL="admin@quorum.local"
$env:SMOKE_PASSWORD="Admin@123"
node scripts/production-smoke.mjs
```

## Checks Covered

- Backend liveness: `GET /health`
- Backend database readiness: `GET /health/ready`
- Backend security headers:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
- Frontend route availability:
  - `/login`
  - `/dashboard`
  - `/policies`
  - `/meetings`
  - `/decisions`
  - `/actions`
  - `/reports`
  - `/audit-logs`
  - `/settings`
- Auth login: `POST /api/auth/login`
- Auth logout: `POST /api/auth/logout`
- Admin production readiness: `GET /api/ops/production-readiness`
- Pagination behavior: `GET /api/policies?limit=1&offset=0`
- Authenticated API access:
  - `/api/auth/me`
  - `/api/reports`
  - `/api/policies`
  - `/api/meetings`
  - `/api/decisions`
  - `/api/action-items`
  - `/api/audit-logs`
- Browser CORS preflight from the production frontend origin.

## Manual Role Checks

After the automated smoke script passes, manually sign in as each active role and confirm:

- Dashboard counts match visible rows for that role.
- Auditor and Board Member do not see mutating controls.
- Manager only sees assigned/owned work.
- Audit Logs are visible only to Admin, Governance Officer, and Auditor.
- Notifications show the same unread count as visible unread messages.

For seeded demo deployments, run automated role QA:

```bash
ROLE_QA_BACKEND_URL=https://<your-backend>.onrender.com node scripts/role-qa.mjs
```

This script logs in as the seeded Admin, Governance Officer, Manager, Auditor, Board Member, and Public Auditor users. It validates role-scoped reads, read-only write blocking, notification count alignment, and pagination metadata.

## Expected Result

Every line should print `PASS`, followed by:

```text
Production smoke check passed
```

Any `FAIL` should block production handoff until the failed URL, status code, CORS origin, or credential issue is fixed.
