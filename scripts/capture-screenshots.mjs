import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromFrontend = createRequire(path.join(root, "frontend", "package.json"));
const { chromium } = requireFromFrontend("playwright");
const outDir = path.join(root, "docs", "screenshots");
const baseUrl = normalizeUrl(process.env.SCREENSHOT_FRONTEND_URL ?? "https://governance-management-portal-4g7p.vercel.app");

const users = {
  admin: {
    email: process.env.SCREENSHOT_ADMIN_EMAIL ?? "admin@gmp.local",
    password: process.env.SCREENSHOT_ADMIN_PASSWORD ?? "Admin@123",
  },
  auditor: {
    email: process.env.SCREENSHOT_AUDITOR_EMAIL ?? "auditor@gmp.local",
    password: process.env.SCREENSHOT_AUDITOR_PASSWORD ?? "Auditor@123",
  },
  board: {
    email: process.env.SCREENSHOT_BOARD_EMAIL ?? "board@gmp.local",
    password: process.env.SCREENSHOT_BOARD_PASSWORD ?? "Board@123",
  },
};

if (!baseUrl) {
  console.error("Set SCREENSHOT_FRONTEND_URL before running screenshot capture.");
  process.exit(1);
}

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(45000);

const captured = [];

try {
  await login(users.admin);
  await screenshot("/dashboard", "01-dashboard.png");
  await screenshot("/policies", "02-policies-pagination.png");
  await screenshot("/actions", "03-action-items.png");
  await screenshot("/notifications", "04-notifications.png");
  await screenshot("/audit-logs", "05-audit-logs.png");

  await clearSession();
  await login(users.auditor);
  await screenshot("/policies", "06-auditor-read-only.png");

  await clearSession();
  await login(users.board);
  await screenshot("/policies", "07-board-member-view.png");
} finally {
  await browser.close();
}

console.log(`Captured ${captured.length} screenshots:`);
for (const file of captured) {
  console.log(`- docs/screenshots/${file}`);
}

async function login(user) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await Promise.all([
    page.waitForURL(/dashboard/, { timeout: 45000 }).catch(() => page.waitForLoadState("networkidle")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState("networkidle");
}

async function screenshot(route, file) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
  captured.push(file);
}

async function clearSession() {
  await page.evaluate(() => window.localStorage.removeItem("gmp_token")).catch(() => undefined);
}

function normalizeUrl(value) {
  if (!value) return "";
  return value.replace(/\/+$/, "");
}
