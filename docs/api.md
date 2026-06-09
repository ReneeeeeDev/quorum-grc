# API Reference

Base URL: `http://localhost:8000`

## Authentication

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/confirm`

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
- `GET /api/documents/{document_id}/download`
- `GET /api/notifications`
- `POST /api/notifications`
- `PUT /api/notifications/{notification_id}`
- `POST /api/notifications/{notification_id}/dispatch`
- `GET /api/calendar-events`
- `POST /api/calendar-events`
- `GET /api/calendar-events/export.ics`
- `GET /api/workflow-steps`
- `POST /api/workflow-steps`
- `PUT /api/workflow-steps/{step_id}`
- `GET /api/integrations`
- `POST /api/integrations`
- `POST /api/integrations/{integration_id}/sync`
- `GET /api/sso-providers`
- `POST /api/sso-providers`
- `GET /api/sso-providers/{provider_id}/login`
- `GET /api/compliance-obligations`
- `POST /api/compliance-obligations`
- `PUT /api/compliance-obligations/{obligation_id}`
- `GET /api/risks`
- `POST /api/risks`
- `PUT /api/risks/{risk_id}`

## RBAC Defaults

- Admin: full access, including user and department creation.
- Governance Officer: governance write access.
- Manager: governance write access for MVP workflows.
- Auditor: read-only access.
- Board Member: read-only access.

## MVP Integration Boundaries

- Document upload supports local storage and S3/MinIO-compatible storage through `STORAGE_BACKEND`.
- SSO provider records support SAML/OIDC configuration metadata and return a handoff response; live assertion validation requires real IdP metadata and credentials.
- Integration records store risk/compliance/vendor endpoints and sync-run history.
- Audit logs support query filtering and CSV export.
- Calendar events support ICS export.
