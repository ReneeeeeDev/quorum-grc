import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromFrontend = createRequire(path.join(root, "frontend", "package.json"));
const { chromium } = requireFromFrontend("playwright");
const baseUrl = normalizeUrl(process.env.SCREENSHOT_FRONTEND_URL ?? "http://127.0.0.1:3000");
const outDir = path.join(root, "screenshots");

const users = {
  admin: { label: "Admin", email: "admin@quorum.local", password: "Admin@123" },
  governance: { label: "Governance Officer", email: "governance@quorum.local", password: "Governance@123" },
  manager: { label: "Manager", email: "manager@quorum.local", password: "Manager@123" },
  auditor: { label: "Auditor", email: "auditor@quorum.local", password: "Auditor@123" },
  board: { label: "Board Member", email: "board@quorum.local", password: "Board@123" },
  publicAuditor: { label: "Public Auditor", email: "public-auditor@quorum.local", password: "PublicAudit@123" },
};

const adminPages = [
  ["/login", "00-login"],
  ["/dashboard", "01-dashboard"],
  ["/policies", "02-policies"],
  ["/departments", "03-committees-departments"],
  ["/meetings", "04-meetings"],
  ["/decisions", "05-decisions"],
  ["/actions", "06-action-items"],
  ["/documents", "07-documents"],
  ["/notifications", "08-notifications"],
  ["/calendar", "09-calendar"],
  ["/workflows", "10-workflows"],
  ["/compliance", "11-compliance"],
  ["/risks", "12-risks"],
  ["/reports", "13-reports"],
  ["/audit-logs", "14-audit-logs"],
  ["/tenants", "15-tenants"],
  ["/integrations", "16-integrations"],
  ["/sso", "17-sso"],
  ["/settings", "18-users-settings"],
];

const rolePages = [
  ["admin", "/dashboard", "20-admin-dashboard"],
  ["governance", "/dashboard", "21-governance-dashboard"],
  ["governance", "/policies", "22-governance-policies"],
  ["manager", "/dashboard", "23-manager-dashboard"],
  ["manager", "/actions", "24-manager-actions"],
  ["auditor", "/dashboard", "25-auditor-dashboard"],
  ["auditor", "/policies", "26-auditor-read-only-policies"],
  ["auditor", "/audit-logs", "27-auditor-audit-logs"],
  ["board", "/dashboard", "28-board-dashboard"],
  ["board", "/policies", "29-board-published-policies"],
  ["publicAuditor", "/dashboard", "30-public-auditor-dashboard"],
  ["publicAuditor", "/notifications", "31-public-auditor-notifications"],
];

const featureShots = [
  { route: "/policies", name: "40-feature-policy-form", expectText: "Create policy" },
  { route: "/documents", name: "41-feature-document-upload", expectText: "Upload document" },
  { route: "/notifications", name: "42-feature-notification-alerts", action: clickFirst("Dispatch") },
  { route: "/audit-logs", name: "43-feature-audit-filter", action: filterAuditLogs },
  { route: "/reports", name: "44-feature-reports-export", expectText: "Export report CSV" },
  { route: "/integrations", name: "45-feature-integration-sync", action: clickFirst("Sync") },
  { route: "/sso", name: "46-feature-sso-start", action: clickFirst("Start") },
  { route: "/sso", name: "47-feature-sso-verify", action: clickFirst("Verify") },
  { route: "/settings", name: "48-feature-user-role-management", expectText: "Create user" },
];

if (!baseUrl) {
  console.error("Set SCREENSHOT_FRONTEND_URL before running screenshot capture.");
  process.exit(1);
}

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(45000);

const captured = [];

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await screenshot(page, "00-login");

  await login(page, users.admin);
  for (const [route, name] of adminPages.filter(([route]) => route !== "/login")) {
    await visit(page, route);
    await screenshot(page, name);
  }

  for (const shot of featureShots) {
    await login(page, users.admin);
    await visit(page, shot.route);
    if (shot.expectText) await page.getByText(shot.expectText, { exact: false }).first().waitFor({ state: "visible" }).catch(() => undefined);
    if (shot.action) await shot.action(page);
    await page.waitForTimeout(1200);
    await screenshot(page, shot.name);
  }

  for (const [roleKey, route, name] of rolePages) {
    await login(page, users[roleKey]);
    await visit(page, route);
    await screenshot(page, name);
  }

  await captureMobile(page);
  await captureLanguages(page);
} finally {
  await browser.close();
}

console.log(`Captured ${captured.length} screenshots in screenshots/:`);
for (const file of captured) console.log(`- ${file}`);

async function login(page, user) {
  await clearSession(page);
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await Promise.all([
    page.waitForURL(/dashboard/, { timeout: 45000 }).catch(() => page.waitForLoadState("networkidle")),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState("networkidle");
}

async function visit(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
}

async function screenshot(page, name) {
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
  captured.push(file);
}

async function clearSession(page) {
  await page.evaluate(() => window.localStorage.removeItem("quorum_token")).catch(() => undefined);
}

function clickFirst(label) {
  return async (page) => {
    const button = page.getByRole("button", { name: label }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      await page.waitForLoadState("networkidle").catch(() => undefined);
    }
  };
}

async function filterAuditLogs(page) {
  await page.getByPlaceholder("Entity type").fill("policy");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
}

async function captureMobile(page) {
  await page.setViewportSize({ width: 390, height: 900 });
  await login(page, users.admin);
  await visit(page, "/dashboard");
  await screenshot(page, "50-mobile-dashboard");
  const openNav = page.getByLabel("Open navigation");
  if (await openNav.isVisible().catch(() => false)) {
    await openNav.click();
    await page.waitForTimeout(600);
    await screenshot(page, "51-mobile-sidebar");
  }
  await visit(page, "/policies");
  await screenshot(page, "52-mobile-policies");
}

async function captureLanguages(page) {
  await page.setViewportSize({ width: 1440, height: 1050 });
  for (const [lang, name] of [["es", "60-i18n-dashboard-es"], ["pt", "61-i18n-dashboard-pt"]]) {
    await page.addInitScript((value) => window.localStorage.setItem("quorum_lang", value), lang);
    await login(page, users.admin);
    await visit(page, "/dashboard");
    await screenshot(page, name);
  }
}

function normalizeUrl(value) {
  if (!value) return "";
  return value.replace(/\/+$/, "");
}
