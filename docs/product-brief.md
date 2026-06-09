# Product Brief

## Elevator Pitch

The Governance Management Portal centralizes governance operations for organizations that currently rely on spreadsheets, shared drives, manual approvals, and email threads.

It supports policy lifecycle management, committee governance, decision tracking, action management, compliance obligation monitoring, audit logging, and executive reporting.

## Target Users

- Super Admin: platform and user management.
- Governance Officer: governance framework and policy lifecycle ownership.
- Department Manager: department-level responsibilities and action follow-up.
- Compliance Team: obligation and control monitoring.
- Board Member: governance decisions and reports.
- Auditor: read-only review of governance records and audit logs.

## MVP Features

- Authentication and RBAC.
- User and department management.
- Policy repository and lifecycle states.
- Meeting and decision registers.
- Action item tracker.
- Dashboard KPI reporting.
- Audit logs for mutating backend actions.
- Multi-entity tenant records.
- Document upload and metadata management.
- Notification center with read tracking.
- Governance calendar events.
- Configurable policy approval workflow steps.
- SSO provider configuration and login handoff endpoint.
- Risk/compliance integration connection registry.
- Compliance obligation register.
- Risk register.
- Password reset.
- Audit export and calendar ICS export.

## Seeded Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@gmp.local` | `Admin@123` |
| Governance Officer | `governance@gmp.local` | `Governance@123` |
| Auditor | `auditor@gmp.local` | `Auditor@123` |
| Board Member | `board@gmp.local` | `Board@123` |

## Completed Pending Capabilities

- Production packaging baseline through Dockerfiles and full-stack Docker Compose.
- File upload stores document files under backend storage and tracks metadata in the database.
- Notifications are persisted and generated for new action assignments.
- Calendar events support meetings, reviews, audits, and renewals.
- Multi-tenancy is represented through tenant records and tenant links on core governance objects.
- Workflow approvals are configurable through ordered policy approval steps.
- SSO providers are configurable with an MVP login handoff endpoint.
- Risk and compliance integrations are represented through typed connection records.
- Compliance obligations and risks are first-class modules with create/list/update APIs and frontend pages.
- Audit logs can be filtered/exported as CSV.
- Calendar events can be exported as ICS.
- Notifications can be dispatched through SMTP when configured, or recorded as in-app delivery records.
