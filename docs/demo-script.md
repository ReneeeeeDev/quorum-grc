# Demo Script

Use this flow for portfolio walkthroughs, interviews, and stakeholder demos.

## Setup

Open the deployed frontend:

```text
https://<your-frontend>.vercel.app
```

Use demo mode only when `DEMO_SEED_ENABLED=true`.

## 5-Minute Walkthrough

1. Sign in as Admin:

   ```text
   admin@quorum.local / Admin@123
   ```

2. Dashboard:
   - Show KPI cards for actions, policies, meetings, documents, alerts, and integrations.
   - Point out that counts are role-scoped and match visible records.

3. Policies:
   - Show lifecycle states: draft, review, approval, published, archived.
   - Show exact server pagination: `Page X of Y`.

4. Action Items:
   - Show ownership, due dates, overdue status, and status updates.
   - Explain Manager users only see assigned/owned work.

5. Notifications:
   - Show alert messages and read tracking.
   - Explain that dashboard unread counts match visible unread alerts.

6. Audit Logs:
   - Show immutable activity history, filters, CSV export, and pagination.
   - Explain login success/failure and logout events are audited.

7. Role switch:
   - Sign out and sign in as Auditor:

     ```text
     auditor@quorum.local / Auditor@123
     ```

   - Show read-only access and hidden mutation controls.

8. Board Member:

   ```text
   board@quorum.local / Board@123
   ```

   - Show published-policy-only access and no audit log access.

## Screenshot Checklist

Capture these screenshots after the latest Render and Vercel deploys:

- `docs/screenshots/01-dashboard.png`
- `docs/screenshots/02-policies-pagination.png`
- `docs/screenshots/03-action-items.png`
- `docs/screenshots/04-notifications.png`
- `docs/screenshots/05-audit-logs.png`
- `docs/screenshots/06-auditor-read-only.png`
- `docs/screenshots/07-board-member-view.png`

## Talking Points

- Full-stack MVP: Next.js, FastAPI, SQLAlchemy, PostgreSQL.
- Role-based data visibility is enforced in both backend queries and frontend controls.
- Audit trail records auth events and mutating governance actions.
- Production deployment supports Vercel, Render, and Supabase.
- Server-side pagination returns total counts through `X-Total-Count`.
