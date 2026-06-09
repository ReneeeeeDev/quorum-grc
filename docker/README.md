# Docker Notes

The root `docker-compose.yml` can run PostgreSQL, Redis, the FastAPI backend, and the Next.js frontend.

Development services only:

```bash
docker compose up -d postgres redis
```

Full stack:

```bash
docker compose up --build
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:8000`
