# Architecture

## Overview

```mermaid
flowchart LR
  Browser["Next.js Frontend"] --> API["FastAPI Backend"]
  API --> Postgres["PostgreSQL"]
  API --> Redis["Redis"]
  API --> Audit["Audit Log"]
```

## Frontend

- App Router based Next.js application in `frontend/`.
- Client-side auth stores the JWT in local storage for the MVP.
- The app shell provides sidebar navigation, top-bar identity display, and protected route behavior.
- Portal screens call backend APIs through `frontend/lib/api.ts`.

## Backend

- FastAPI application in `backend/app`.
- SQLAlchemy models define users, departments, policies, policy reviews, meetings, decisions, action items, and audit logs.
- Startup creates tables and seeds demo users when the database is empty.
- JWT auth and RBAC dependencies protect API routes.
- Local document storage is configured by `FILE_STORAGE_PATH`.
- Dockerfiles package the backend and frontend for full-stack Compose deployment.

## Data Model

- `User` belongs to an optional `Department` and has a role.
- `Policy` has an owner, version, lifecycle status, and optional effective date.
- `Meeting` can belong to a committee/department.
- `Decision` can belong to a meeting and can create follow-up `ActionItem` records.
- `AuditLog` records mutating backend actions with actor, entity, and timestamp.
- `Tenant` represents companies, subsidiaries, and governance entities.
- `Document` stores uploaded document metadata and local storage paths.
- `Notification` stores due-date reminders, approval alerts, and read state.
- `CalendarEvent` stores governance meetings, reviews, audits, and renewals.
- `WorkflowStep` stores ordered policy approval steps.
- `IntegrationConnection` stores risk/compliance/vendor integration configuration.
- `SSOProvider` stores enterprise identity provider configuration.
- `ComplianceObligation` stores obligation ownership, due dates, status, and evidence references.
- `Risk` stores register entries, severity, owner, status, and mitigation plans.
- `PasswordResetToken` stores expiring password-reset token hashes.
- `IntegrationSyncRun` stores integration sync job history.
- `NotificationDelivery` stores notification dispatch attempts.
