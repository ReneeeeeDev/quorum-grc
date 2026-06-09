# Deployment

## Docker Compose

Use the full-stack Compose file for local production-style validation:

```bash
docker-compose up --build
```

The installed CLI on this machine supports `docker-compose`; the newer `docker compose` subcommand is not available here.

## Secrets

Use `backend/.env.production.example` as the production template. Do not commit live secrets.

Required production secrets:

- `JWT_SECRET_KEY`
- `DATABASE_URL`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

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

