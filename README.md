# Governance Management Portal

A full-stack enterprise governance, risk, and compliance portal for managing policy lifecycles, committees, meetings, decisions, action items, audit logs, and executive reporting.

A centralized enterprise governance platform that helps organizations manage policies, committees, decisions, compliance obligations, governance frameworks, approvals, documentation, and organizational accountability.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: PostgreSQL
- Cache: Redis
- Deployment baseline: Docker Compose

## Repository Layout

```text
frontend/   Next.js application
backend/    FastAPI application
database/   Database notes and seed guidance
docker/     Deployment and infrastructure notes
docs/       Product, architecture, and implementation docs
```

## Local Development

1. Copy environment files:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

2. Start PostgreSQL and Redis:

   ```bash
   docker compose up -d postgres redis
   ```

3. Run the backend:

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

4. Run the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The frontend calls same-origin `/api/*` by default and proxies those requests to `NEXT_BACKEND_URL`.

Default local URLs:

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:8000`

## Production Notes

- Use `backend/.env.production.example` as the backend secret template.
- Set `DEMO_SEED_ENABLED=false` for real production data.
- Set `NEXT_BACKEND_URL` for the frontend server to reach the backend.
- The backend container runs Alembic migrations before starting.
- See [Deployment](docs/deployment.md) for platform options.

## Verification

```bash
cd backend
python scripts/smoke_check.py

cd ../frontend
npm run typecheck
```

## Documentation

- [Product brief](docs/product-brief.md)
- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Verification](docs/verification.md)
- [Deployment](docs/deployment.md)
- [Resume and interview notes](docs/resume-and-interview.md)

## Completed MVP Modules

- Authentication and RBAC
- Policy, meeting, decision, and action tracking
- Reports and audit logs
- Document upload
- Notifications
- Governance calendar
- Multi-entity tenancy
- Approval workflow steps
- SSO provider configuration
- Risk/compliance integration registry
- Compliance obligations
- Risk register
- Password reset
- Audit CSV export
- Calendar ICS export
- S3/MinIO-compatible document storage
- Alembic migration scaffold
- Full-stack Docker Compose packaging
