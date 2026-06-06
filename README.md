# Governance Management Portal

A full-stack enterprise governance, risk, and compliance portal for managing policy lifecycles, committees, meetings, decisions, action items, audit logs, and executive reporting.

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

Default API URL: `http://localhost:8000`

