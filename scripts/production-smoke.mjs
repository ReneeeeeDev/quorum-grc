const frontendUrl = normalizeUrl(process.env.PRODUCTION_FRONTEND_URL);
const backendUrl = normalizeUrl(process.env.PRODUCTION_BACKEND_URL);
const smokeEmail = process.env.SMOKE_EMAIL ?? "admin@gmp.local";
const smokePassword = process.env.SMOKE_PASSWORD ?? "Admin@123";

const frontendRoutes = [
  "/login",
  "/dashboard",
  "/policies",
  "/meetings",
  "/decisions",
  "/actions",
  "/reports",
  "/audit-logs",
  "/settings",
];

const apiRoutes = [
  "/api/auth/me",
  "/api/reports",
  "/api/policies",
  "/api/meetings",
  "/api/decisions",
  "/api/action-items",
  "/api/audit-logs",
];

if (!frontendUrl || !backendUrl) {
  console.error("Set PRODUCTION_FRONTEND_URL and PRODUCTION_BACKEND_URL before running this smoke check.");
  process.exit(1);
}

const results = [];

try {
  await checkBackendHealth();
  await checkFrontendRoutes();
  const token = await checkLogin();
  await checkAuthenticatedApis(token);
  await checkCorsPreflight();
} catch (error) {
  record("production smoke runner", false, error.message);
}

for (const result of results) {
  console.log(`${result.ok ? "PASS" : "FAIL"} ${result.name}${result.detail ? ` - ${result.detail}` : ""}`);
}

if (results.some((result) => !result.ok)) {
  process.exit(1);
}

console.log("Production smoke check passed");

async function checkBackendHealth() {
  const health = await request(`${backendUrl}/health`);
  record("backend /health", health.ok, `${health.status}`);
  assertSecurityHeaders("backend /health headers", health);

  const readiness = await request(`${backendUrl}/health/ready`);
  record("backend /health/ready", readiness.ok, `${readiness.status}`);
}

async function checkFrontendRoutes() {
  for (const route of frontendRoutes) {
    const response = await request(`${frontendUrl}${route}`);
    record(`frontend ${route}`, response.ok, `${response.status}`);
  }
}

async function checkLogin() {
  const response = await request(`${backendUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: smokeEmail, password: smokePassword }),
  });
  record("auth login", response.ok, `${response.status}`);
  if (!response.ok) {
    throw new Error("Cannot continue production smoke check without an access token.");
  }
  const body = await response.json();
  if (!body.access_token) {
    throw new Error("Login response did not include access_token.");
  }
  return body.access_token;
}

async function checkAuthenticatedApis(token) {
  for (const route of apiRoutes) {
    const response = await request(`${backendUrl}${route}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    record(`api ${route}`, response.ok, `${response.status}`);
  }
}

async function checkCorsPreflight() {
  const response = await request(`${backendUrl}/api/auth/me`, {
    method: "OPTIONS",
    headers: {
      Origin: frontendUrl,
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "authorization",
    },
  });
  const allowedOrigin = response.headers.get("access-control-allow-origin");
  record("cors preflight", response.ok && allowedOrigin === frontendUrl, `status ${response.status}, origin ${allowedOrigin ?? "missing"}`);
}

function assertSecurityHeaders(name, response) {
  const requiredHeaders = ["x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy"];
  const missing = requiredHeaders.filter((header) => !response.headers.get(header));
  record(name, missing.length === 0, missing.length ? `missing ${missing.join(", ")}` : "present");
}

async function request(url, options = {}) {
  try {
    return await fetch(url, options);
  } catch (error) {
    record(url, false, error.message);
    return new Response(null, { status: 599 });
  }
}

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
}

function normalizeUrl(value) {
  if (!value) {
    return "";
  }
  return value.replace(/\/+$/, "");
}
