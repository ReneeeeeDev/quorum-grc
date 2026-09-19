const backendUrl = normalizeUrl(process.env.ROLE_QA_BACKEND_URL ?? process.env.PRODUCTION_BACKEND_URL ?? "http://127.0.0.1:8000");

const demoRoles = [
  {
    label: "Admin",
    email: process.env.ROLE_QA_ADMIN_EMAIL ?? "admin@quorum.local",
    password: process.env.ROLE_QA_ADMIN_PASSWORD ?? "Admin@123",
    expectedRole: "Admin",
    checks: ["adminBaseline"],
  },
  {
    label: "Governance Officer",
    email: process.env.ROLE_QA_GOVERNANCE_EMAIL ?? "governance@quorum.local",
    password: process.env.ROLE_QA_GOVERNANCE_PASSWORD ?? "Governance@123",
    expectedRole: "Governance Officer",
    checks: ["governanceBaseline"],
  },
  {
    label: "Manager",
    email: process.env.ROLE_QA_MANAGER_EMAIL ?? "manager@quorum.local",
    password: process.env.ROLE_QA_MANAGER_PASSWORD ?? "Manager@123",
    expectedRole: "Manager",
    checks: ["managerScope"],
  },
  {
    label: "Auditor",
    email: process.env.ROLE_QA_AUDITOR_EMAIL ?? "auditor@quorum.local",
    password: process.env.ROLE_QA_AUDITOR_PASSWORD ?? "Auditor@123",
    expectedRole: "Auditor",
    checks: ["auditorReadOnly"],
  },
  {
    label: "Board Member",
    email: process.env.ROLE_QA_BOARD_EMAIL ?? "board@quorum.local",
    password: process.env.ROLE_QA_BOARD_PASSWORD ?? "Board@123",
    expectedRole: "Board Member",
    checks: ["boardReadOnly"],
  },
  {
    label: "Public Auditor",
    email: process.env.ROLE_QA_PUBLIC_AUDITOR_EMAIL ?? "public-auditor@quorum.local",
    password: process.env.ROLE_QA_PUBLIC_AUDITOR_PASSWORD ?? "PublicAudit@123",
    expectedRole: "Auditor",
    checks: ["publicAuditorTenant"],
  },
];

const results = [];

if (!backendUrl) {
  console.error("Set ROLE_QA_BACKEND_URL or PRODUCTION_BACKEND_URL before running role QA.");
  process.exit(1);
}

try {
  await checkHealth();
  for (const role of demoRoles) {
    await checkRole(role);
  }
} catch (error) {
  record("role qa runner", false, error.message);
}

for (const result of results) {
  console.log(`${result.ok ? "PASS" : "FAIL"} ${result.name}${result.detail ? ` - ${result.detail}` : ""}`);
}

if (results.some((result) => !result.ok)) {
  process.exit(1);
}

console.log("Role QA passed");

async function checkHealth() {
  const response = await request("/health/ready");
  record("backend readiness", response.ok, `${response.status}`);
}

async function checkRole(role) {
  const token = await login(role);
  if (!token) return;
  const me = await getJson("/api/auth/me", token);
  const user = me.body;
  record(`${role.label} /me role`, me.ok && user.role === role.expectedRole, user.role ?? "missing role");

  const report = await getJson("/api/reports", token);
  record(`${role.label} reports readable`, report.ok, `${report.status}`);

  for (const check of role.checks) {
    if (check === "adminBaseline") await checkAdminBaseline(role, token);
    if (check === "governanceBaseline") await checkGovernanceBaseline(role, token);
    if (check === "managerScope") await checkManagerScope(role, token, user);
    if (check === "auditorReadOnly") await checkAuditorReadOnly(role, token);
    if (check === "boardReadOnly") await checkBoardReadOnly(role, token);
    if (check === "publicAuditorTenant") await checkPublicAuditorTenant(role, token, report.body);
  }
}

async function login(role) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: role.email, password: role.password }),
  });
  record(`${role.label} login`, response.ok, `${response.status}`);
  if (!response.ok) return null;
  const body = await response.json();
  return body.access_token;
}

async function checkAdminBaseline(role, token) {
  const users = await getJson("/api/users?limit=1&offset=0", token);
  const total = Number(users.response.headers.get("x-total-count") ?? 0);
  record(`${role.label} users total count`, users.ok && total >= 5, `total ${total}`);
  const auditLogs = await getJson("/api/audit-logs?limit=1&offset=0", token);
  record(`${role.label} audit logs visible`, auditLogs.ok && auditLogs.body.length >= 1, `rows ${auditLogs.body.length}`);
}

async function checkGovernanceBaseline(role, token) {
  const policies = await getJson("/api/policies?limit=5&offset=0", token);
  record(`${role.label} tenant policies visible`, policies.ok && policies.body.length >= 1, `rows ${policies.body.length}`);
  const actions = await getJson("/api/action-items?limit=5&offset=0", token);
  record(`${role.label} action register visible`, actions.ok, `${actions.status}`);
}

async function checkManagerScope(role, token, user) {
  const actions = await getJson("/api/action-items", token);
  const allAssigned = actions.body.every((action) => action.assigned_to === user.id);
  record(`${role.label} actions assigned only`, actions.ok && allAssigned, `rows ${actions.body.length}`);
  const auditLogs = await getJson("/api/audit-logs", token);
  const ownAuditOnly = auditLogs.body.every((row) => row.actor_id === user.id);
  record(`${role.label} audit own activity only`, auditLogs.ok && ownAuditOnly, `rows ${auditLogs.body.length}`);
}

async function checkAuditorReadOnly(role, token) {
  const actions = await getJson("/api/action-items", token);
  record(`${role.label} action items hidden`, actions.ok && actions.body.length === 0, `rows ${actions.body.length}`);
  const forbidden = await request("/api/policies", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "Role QA Forbidden Policy", version: "1.0", owner_id: 1 }),
  });
  record(`${role.label} policy write forbidden`, forbidden.status === 403, `${forbidden.status}`);
}

async function checkBoardReadOnly(role, token) {
  const policies = await getJson("/api/policies", token);
  const publishedOnly = policies.body.every((policy) => policy.status === "published");
  record(`${role.label} published policies only`, policies.ok && publishedOnly, `rows ${policies.body.length}`);
  const auditLogs = await getJson("/api/audit-logs", token);
  record(`${role.label} audit logs hidden`, auditLogs.ok && auditLogs.body.length === 0, `rows ${auditLogs.body.length}`);
  const forbidden = await request("/api/action-items", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "Role QA Forbidden Action", assigned_to: 1, due_date: "2026-12-31", status: "open" }),
  });
  record(`${role.label} action write forbidden`, forbidden.status === 403, `${forbidden.status}`);
}

async function checkPublicAuditorTenant(role, token, report) {
  const policies = await getJson("/api/policies", token);
  record(`${role.label} tenant policy scope`, policies.ok && policies.body.length === 1, `rows ${policies.body.length}`);
  const notifications = await getJson("/api/notifications", token);
  const unread = notifications.body.filter((notification) => notification.status === "unread").length;
  record(`${role.label} unread count matches visible notifications`, report.unread_notifications === unread, `report ${report.unread_notifications}, visible ${unread}`);
}

async function getJson(path, token) {
  const response = await request(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { ok: response.ok, status: response.status, response, body: body ?? [] };
}

async function request(path, options = {}) {
  try {
    return await fetch(`${backendUrl}${path}`, options);
  } catch (error) {
    record(path, false, error.message);
    return new Response(null, { status: 599 });
  }
}

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
}

function normalizeUrl(value) {
  if (!value) return "";
  return value.replace(/\/+$/, "");
}
