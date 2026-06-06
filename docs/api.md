# API Reference

Base URL: `http://localhost:8000`

## Authentication

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Governance

- `GET /api/departments`
- `POST /api/departments`
- `GET /api/users`
- `POST /api/users`
- `GET /api/policies`
- `POST /api/policies`
- `PUT /api/policies/{policy_id}`
- `DELETE /api/policies/{policy_id}`
- `GET /api/meetings`
- `POST /api/meetings`
- `GET /api/decisions`
- `POST /api/decisions`
- `GET /api/action-items`
- `POST /api/action-items`
- `PUT /api/action-items/{action_item_id}`
- `GET /api/reports`
- `GET /api/audit-logs`

## RBAC Defaults

- Admin: full access, including user and department creation.
- Governance Officer: governance write access.
- Manager: governance write access for MVP workflows.
- Auditor: read-only access.
- Board Member: read-only access.

