# Known Limitations and Future Scope

These are intentional MVP boundaries, not blocking defects.

## Authentication

- JWT access tokens are stored client-side for the MVP.
- There is no refresh-token rotation yet.
- Password reset creates a token through the API; email delivery requires SMTP configuration.

Future scope:

- Refresh tokens with rotation and reuse detection.
- Admin-enforced password reset flow.
- Account lockout policy after repeated failed attempts.

## SSO

- SSO provider records can be configured.
- SSO login/callback is an MVP handoff simulation.
- Live SAML/OIDC assertion validation is not implemented.

Future scope:

- Real OIDC authorization code flow.
- SAML metadata parsing and signature validation.
- Just-in-time user provisioning.

## Notifications

- Notifications are persisted and dispatch attempts are recorded.
- Email sending requires SMTP environment variables.
- There is no queue worker yet.

Future scope:

- Background job queue for delivery retries.
- Email templates.
- User notification preferences.

## Documents

- Local storage works for development and small demos.
- S3-compatible storage is supported through environment variables.
- The UI does not include document preview.

Future scope:

- Supabase Storage or S3 production setup.
- Antivirus scanning.
- Document preview and version history.

## Pagination

- Backend list APIs support `limit`, `offset`, and `X-Total-Count`.
- High-growth frontend tables use server-side pagination.
- Search is still local to the currently loaded page.

Future scope:

- Server-side search and filters for every list view.
- Cursor pagination for very large audit logs.
- Sort controls per column.

## Reporting

- Reports are operational KPI summaries.
- There is no custom report builder.

Future scope:

- Saved report filters.
- Scheduled report delivery.
- Export templates for board packs.

## Localization

- The UI ships in English, Spanish, and Portuguese; the language is detected from the browser and can be switched from the header.
- Backend error messages, seeded demo data, and exported CSV/ICS content are English-only.
- Dates use the browser `Intl` formatting for the selected language; there is no per-tenant locale or timezone setting.

Future scope:

- `Accept-Language` aware API error messages.
- Locale-aware number and currency formatting if financial modules are added.
- Right-to-left layout support.

## Multi-Tenancy

- Tenant scoping is enforced in backend queries.
- There is no tenant onboarding wizard.

Future scope:

- Tenant provisioning workflow.
- Tenant-specific branding and settings.
- Tenant admin delegation.
