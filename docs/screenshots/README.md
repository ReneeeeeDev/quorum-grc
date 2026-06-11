# README Screenshots

This folder contains the smaller screenshot set embedded in the root README.

The complete LinkedIn/portfolio screenshot pack is stored in the top-level `screenshots/` folder.

Recommended files:

- `01-dashboard.png`
- `02-policies-pagination.png`
- `03-action-items.png`
- `04-notifications.png`
- `05-audit-logs.png`
- `06-auditor-read-only.png`
- `07-board-member-view.png`

Use the flow in [Demo Script](../demo-script.md) so the screenshots tell the same story as the walkthrough.

Refresh all screenshots with:

```bash
SCREENSHOT_FRONTEND_URL=https://governance-management-portal-4g7p.vercel.app node scripts/capture-screenshots.mjs
```

Refresh the complete portfolio screenshot pack with:

```bash
SCREENSHOT_FRONTEND_URL=https://governance-management-portal-4g7p.vercel.app node scripts/capture-linkedin-screenshots.mjs
```
