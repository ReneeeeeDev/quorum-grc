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

Each file also has a Spanish variant with a `.es.png` suffix (for example `01-dashboard.es.png`), used by the Spanish README. The capture script takes `SCREENSHOT_LANGS` (default `en,es`).

Use the flow in [Demo Script](../demo-script.md) so the screenshots tell the same story as the walkthrough.

Refresh all screenshots with:

```bash
SCREENSHOT_FRONTEND_URL=https://<your-frontend>.vercel.app SCREENSHOT_LANGS=en,es node scripts/capture-screenshots.mjs
```

Refresh the complete portfolio screenshot pack with:

```bash
SCREENSHOT_FRONTEND_URL=https://<your-frontend>.vercel.app node scripts/capture-linkedin-screenshots.mjs
```
