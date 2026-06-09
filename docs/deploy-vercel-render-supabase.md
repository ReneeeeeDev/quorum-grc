# Deploy: Vercel + Render + Supabase

This is the recommended managed deployment path for the MVP:

- Frontend: Vercel, using `frontend/`.
- Backend: Render web service, using `backend/`.
- Database: Supabase Postgres.

## 1. Supabase

Create a Supabase project and copy a Postgres connection string from **Connect** in the Supabase dashboard.

Recommended connection mode for this app:

- Use the **session pooler** if Render cannot reach the direct IPv6 database endpoint.
- Use the **direct connection** only if the Render service can reach the database endpoint.
- Avoid transaction pooler mode for this SQLAlchemy backend unless prepared statements are explicitly disabled.

Use the connection string as `DATABASE_URL` in Render. The backend accepts Supabase URLs beginning with `postgres://` or `postgresql://` and normalizes them to the installed `psycopg` driver.

Do not expose Supabase service keys in the frontend. This app does not require `NEXT_PUBLIC_SUPABASE_*` variables because the FastAPI backend talks to Postgres directly.

## 2. Render Backend

Use `render.yaml` from the repository root.

Dashboard path:

```text
Render Dashboard -> New -> Blueprint -> connect this GitHub repo
```

Blueprint URL:

```text
https://dashboard.render.com/blueprint/new?repo=https://github.com/Sankrityayana/Governance-Management-Portal
```

Required Render environment variables:

```env
DATABASE_URL=<Supabase Postgres or session-pooler connection string>
JWT_SECRET_KEY=<strong random secret>
FRONTEND_ORIGIN=https://<your-vercel-domain>
REDIS_URL=<optional Redis URL; use Upstash/Render Key Value if enabled later>
```

Recommended Render settings:

- Service: `governance-management-backend`
- Runtime: Docker
- Root directory: `backend`
- Health check path: `/health`
- `DEMO_SEED_ENABLED=false` for production
- `DEMO_SEED_ENABLED=true` only for portfolio/demo data

After deployment, verify:

```bash
curl https://<your-render-backend>/health
```

## 3. Vercel Frontend

Create a Vercel project from the same GitHub repository.

Vercel settings:

```text
Root Directory: frontend
Framework Preset: Next.js
Install Command: npm ci
Build Command: npm run build
```

Required Vercel environment variable:

```env
NEXT_BACKEND_URL=https://<your-render-backend>
```

Do not set `NEXT_PUBLIC_API_URL` unless you intentionally want browser-side cross-origin API calls. Leaving it unset keeps API calls same-origin through `/api/*`, and Next.js rewrites those requests to `NEXT_BACKEND_URL`.

After deployment, verify:

```bash
curl https://<your-vercel-domain>/login
```

Then sign in with seeded credentials only if `DEMO_SEED_ENABLED=true` on Render:

```text
admin@gmp.local / Admin@123
```

## 4. Recommended Order

1. Create Supabase project.
2. Deploy backend on Render with Supabase `DATABASE_URL`.
3. Confirm Render `/health` returns `200`.
4. Deploy frontend on Vercel with `NEXT_BACKEND_URL` set to the Render backend URL.
5. Update Render `FRONTEND_ORIGIN` to the final Vercel URL.
6. Redeploy Render backend so CORS uses the final frontend origin.
7. Test login and dashboard.

## 5. Production Checklist

- `DEMO_SEED_ENABLED=false` unless this is a demo deployment.
- Strong `JWT_SECRET_KEY`.
- Supabase backups enabled according to the project tier.
- Render health check path set to `/health`.
- Vercel `NEXT_BACKEND_URL` points to Render.
- Render `FRONTEND_ORIGIN` points to Vercel.
- Do not commit live secrets.
