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
- `GET /api/tenants`
- `POST /api/tenants`
- `GET /api/documents`
- `POST /api/documents`
- `POST /api/documents/upload`
- `GET /api/notifications`
- `POST /api/notifications`
- `PUT /api/notifications/{notification_id}`
- `GET /api/calendar-events`
- `POST /api/calendar-events`
- `GET /api/workflow-steps`
- `POST /api/workflow-steps`
- `PUT /api/workflow-steps/{step_id}`
- `GET /api/integrations`
- `POST /api/integrations`
- `GET /api/sso-providers`
- `POST /api/sso-providers`
- `GET /api/sso-providers/{provider_id}/login`

## RBAC Defaults

- Admin: full access, including user and department creation.
- Governance Officer: governance write access.
- Manager: governance write access for MVP workflows.
- Auditor: read-only access.
- Board Member: read-only access.

## MVP Integration Boundaries

- Document upload uses local backend storage. S3/MinIO can replace this behind `FILE_STORAGE_PATH` later.
- SSO provider records support SAML/OIDC configuration metadata and return a handoff response; full IdP assertion validation is intentionally outside this MVP.
- Integration records store risk/compliance/vendor endpoints and status; connector-specific sync jobs can build on these records.
