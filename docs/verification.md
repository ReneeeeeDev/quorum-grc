# Verification

## Backend

```bash
cd backend
python -m compileall app
python scripts/smoke_check.py
uvicorn app.main:app --reload
```

Smoke flow:

1. Start PostgreSQL and Redis with `docker compose up -d postgres redis`.
2. Start the backend.
3. Log in with `admin@gmp.local` / `Admin@123`.
4. Create a policy, meeting, decision, and action item.
5. Confirm `/api/reports` updates and `/api/audit-logs` records mutating actions.
6. Upload a document through `/api/documents/upload`.
7. Create a calendar event, workflow step, integration, tenant, SSO provider, compliance obligation, and risk from the frontend.
8. Export audit logs as CSV and calendar events as ICS.

## Frontend

```bash
cd frontend
npm install
npm run typecheck
npm run build
npm run e2e:smoke
```

Smoke flow:

1. Start the frontend with `npm run dev`.
2. Sign in using the admin demo account.
3. Navigate through Dashboard, Policies, Committees, Meetings, Decisions, Actions, Reports, Audit Logs, and Settings.
4. Create records through each form and confirm tables update.

## Full Stack Docker

```bash
docker-compose up --build
```

Then open `http://localhost:3000/login`.

## Production Smoke

After Vercel, Render, and Supabase are configured:

```bash
node scripts/production-smoke.mjs
```

See [production-smoke-check.md](production-smoke-check.md) for required environment variables and the complete checklist.
