import { expect, test } from "@playwright/test";

const token = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "eyJzdWIiOiJhZG1pbkBxdW9ydW0ubG9jYWwiLCJleHAiOjQxMDI0NDQ4MDB9",
  "playwright-signature",
].join(".");

const users = [
  { id: 1, tenant_id: 1, name: "Admin User", email: "admin@quorum.local", role: "Admin", department_id: 1 },
  { id: 2, tenant_id: 1, name: "Governance Officer", email: "governance@quorum.local", role: "Governance Officer", department_id: 1 },
];

const tenants = [{ id: 1, name: "Acme Enterprise", domain: "acme.example", is_active: true, created_at: "2026-01-01T00:00:00Z" }];
const departments = [{ id: 1, tenant_id: 1, name: "Governance", head_id: 1, created_at: "2026-01-01T00:00:00Z" }];
const policies = [
  { id: 1, tenant_id: 1, title: "Enterprise Governance Charter", version: "2.1", status: "published", owner_id: 1, effective_date: "2026-01-01", summary: "Board approved governance charter.", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: 2, tenant_id: 1, title: "Delegation of Authority", version: "1.4", status: "approval", owner_id: 2, effective_date: "2026-02-01", summary: "Approval authority matrix.", created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
];
const meetings = [{ id: 1, tenant_id: 1, title: "Board Governance Committee", meeting_date: "2026-06-20", committee_id: 1, agenda: "Policy approvals", minutes: null, created_at: "2026-01-01T00:00:00Z" }];
const decisions = [{ id: 1, tenant_id: 1, meeting_id: 1, description: "Approve revised charter", decision_date: "2026-06-20", owner_id: 1, created_at: "2026-01-01T00:00:00Z" }];
const actionItems = [
  { id: 1, tenant_id: 1, decision_id: 1, title: "Collect SOX evidence", assigned_to: 2, due_date: "2026-06-30", status: "open", created_at: "2026-01-01T00:00:00Z" },
  { id: 2, tenant_id: 1, decision_id: 1, title: "Publish charter update", assigned_to: 1, due_date: "2026-07-10", status: "in_progress", created_at: "2026-01-01T00:00:00Z" },
];
const auditLogs = [
  { id: 1, actor_id: 1, action: "policy.published", entity_type: "policy", entity_id: 1, details: "Published", created_at: "2026-01-01T00:00:00Z" },
  { id: 2, actor_id: 2, action: "action.updated", entity_type: "action_item", entity_id: 1, details: "Updated", created_at: "2026-01-02T00:00:00Z" },
];
const reportSummary = { open_actions: 2, overdue_items: 0, published_policies: 1, pending_approvals: 1, upcoming_meetings: 1, unread_notifications: 1, documents: 1, active_integrations: 1 };
const reportBreakdown = {
  policy_status: [{ label: "published", value: 1 }, { label: "approval", value: 1 }],
  action_status: [{ label: "open", value: 1 }, { label: "in_progress", value: 1 }],
  risk_severity: [{ label: "high", value: 1 }, { label: "medium", value: 1 }],
  compliance_status: [{ label: "in_progress", value: 1 }, { label: "compliant", value: 1 }],
  upcoming_meetings_by_month: [{ label: "2026-06", value: 1 }],
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/login**", async (route) => {
    await route.fulfill({ json: { access_token: token, token_type: "bearer" } });
  });
  await page.route("**/api/auth/me**", async (route) => {
    await route.fulfill({ json: users[0] });
  });
  await page.route("**/api/reports", async (route) => route.fulfill({ json: reportSummary }));
  await page.route("**/api/reports/breakdown", async (route) => route.fulfill({ json: reportBreakdown }));
  await page.route("**/api/users**", async (route) => route.fulfill({ json: users, headers: totalHeader(users) }));
  await page.route("**/api/departments**", async (route) => route.fulfill({ json: departments, headers: totalHeader(departments) }));
  await page.route("**/api/policies**", async (route) => route.fulfill({ json: policies, headers: totalHeader(policies) }));
  await page.route("**/api/meetings**", async (route) => route.fulfill({ json: meetings, headers: totalHeader(meetings) }));
  await page.route("**/api/decisions**", async (route) => route.fulfill({ json: decisions, headers: totalHeader(decisions) }));
  await page.route("**/api/action-items**", async (route) => route.fulfill({ json: actionItems, headers: totalHeader(actionItems) }));
  await page.route("**/api/audit-logs**", async (route) => route.fulfill({ json: auditLogs.filter((row) => !route.request().url().includes("entity_type=policy") || row.entity_type === "policy") }));
  await page.route("**/api/tenants**", async (route) => route.fulfill({ json: tenants, headers: totalHeader(tenants) }));
  await page.route("**/api/documents**", async (route) => route.fulfill({ json: [{ id: 1, tenant_id: 1, title: "Evidence Pack", filename: "evidence.pdf", content_type: "application/pdf", file_size: 1024, storage_path: "storage/evidence.pdf", linked_entity_type: "policy", linked_entity_id: 1, uploaded_by: 1, created_at: "2026-01-01T00:00:00Z" }], headers: totalHeader([1]) }));
  await page.route("**/api/notifications**", async (route) => route.fulfill({ json: [{ id: 1, tenant_id: 1, user_id: 1, title: "Approval due", message: "Review policy", status: "unread", due_date: "2026-06-30", created_at: "2026-01-01T00:00:00Z" }], headers: totalHeader([1]) }));
  await page.route("**/api/calendar-events**", async (route) => route.fulfill({ json: [], headers: totalHeader([]) }));
  await page.route("**/api/workflow-steps**", async (route) => route.fulfill({ json: [], headers: totalHeader([]) }));
  await page.route("**/api/integrations**", async (route) => route.fulfill({ json: [{ id: 1, tenant_id: 1, name: "GRC Export", integration_type: "compliance", endpoint_url: null, status: "configured", created_at: "2026-01-01T00:00:00Z" }], headers: totalHeader([1]) }));
  await page.route("**/api/sso-providers**", async (route) => route.fulfill({ json: [{ id: 1, tenant_id: 1, name: "Corporate SSO", provider_type: "saml", metadata_url: "https://idp.example/metadata", status: "enabled", created_at: "2026-01-01T00:00:00Z" }], headers: totalHeader([1]) }));
  await page.route("**/api/sso-providers/1/login", async (route) => route.fulfill({ json: { provider_id: 1, status: "ready", redirect_url: "https://idp.example/login", message: "Redirect URL placeholder returned for MVP SSO handoff." } }));
  await page.route("**/api/sso-providers/callback", async (route) => route.fulfill({ json: { provider_id: 1, status: "authenticated", email: "admin@quorum.local", access_token: token, token_type: "bearer", message: "SSO identity mapped to portal user." } }));
  await page.route("**/api/compliance-obligations**", async (route) => route.fulfill({ json: [{ id: 1, tenant_id: 1, title: "SOX evidence", source: "SOX", owner_id: 2, due_date: "2026-07-01", status: "in_progress", evidence_document_id: 1, description: "Collect evidence", created_at: "2026-01-01T00:00:00Z" }], headers: totalHeader([1]) }));
  await page.route("**/api/risks**", async (route) => route.fulfill({ json: [{ id: 1, tenant_id: 1, title: "Evidence gap", category: "audit", severity: "high", status: "open", owner_id: 2, mitigation_plan: "Weekly review", created_at: "2026-01-01T00:00:00Z" }], headers: totalHeader([1]) }));
});

function totalHeader(rows: unknown[]) {
  return { "X-Total-Count": String(rows.length) };
}

test("login, dashboard charts, language switch, and mobile navigation render", async ({ page, isMobile }) => {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").fill("admin@quorum.local");
  await page.getByLabel("Password").fill("Admin@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Executive Dashboard" })).toBeVisible();
  await expect(page.getByText("Policy lifecycle")).toBeVisible();
  await expect(page.getByText("Risk severity")).toBeVisible();

  await page.getByRole("button", { name: "ES", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Panel ejecutivo" })).toBeVisible();
  await expect(page.getByText("Ciclo de vida de políticas")).toBeVisible();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Executive Dashboard" })).toBeVisible();

  if (isMobile) {
    await page.getByLabel("Open navigation").click();
    await page.getByRole("link", { name: "Reports" }).click();
    await expect(page.getByRole("heading", { name: "Governance Reports" })).toBeVisible();
  }
});

test("audit filters and SSO callback controls work", async ({ page }) => {
  await page.goto("/audit-logs");
  await page.evaluate((value) => window.localStorage.setItem("quorum_token", value), token);
  await page.reload();
  await page.getByPlaceholder("Entity type").fill("policy");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("policy.published")).toBeVisible();

  await page.goto("/sso");
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByText(/Corporate SSO: ready/)).toBeVisible();
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText(/Corporate SSO: authenticated/)).toBeVisible();
});
