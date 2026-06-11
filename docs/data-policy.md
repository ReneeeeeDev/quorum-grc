# Production Data Policy

## Demo Mode

Use demo mode only for portfolio walkthroughs, interviews, or temporary stakeholder review.

```env
DEMO_SEED_ENABLED=true
```

Demo mode creates predictable accounts and mock governance records. Do not use it for real organizational data.

## Production Mode

Use production mode for real users or client-facing environments.

```env
DEMO_SEED_ENABLED=false
```

Production mode must start with an intentional admin user creation process. Do not rely on seeded demo credentials.

## Credentials

- Rotate `JWT_SECRET_KEY` before any public production use.
- Replace all demo passwords before a long-running demo environment is shared.
- Use named admin accounts only.
- Remove or disable unused demo users before client handoff.

## Data Retention

Recommended MVP retention:

- Audit logs: keep at least 180 days.
- Policies, meetings, decisions, and action items: retain indefinitely unless the organization defines a retention schedule.
- Uploaded documents: retain according to policy/evidence requirements.
- Notification delivery logs: retain at least 90 days.

## Sensitive Data

Do not store these in mock/demo fields:

- Real customer personal data.
- Government identifiers.
- Payment data.
- Authentication secrets.
- Private legal documents.

## Backups

- Enable Supabase daily backups before production use.
- Take a manual backup before migrations.
- Restore-test a backup before declaring the environment production-ready.

## Public Demo Guidance

For a public portfolio deployment:

- Keep only synthetic mock data.
- Keep demo passwords separate from personal passwords.
- Avoid uploading private files.
- Periodically reset demo data if public users can mutate records.
