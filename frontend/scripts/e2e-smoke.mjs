const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

const routes = [
  "/login",
  "/dashboard",
  "/policies",
  "/documents",
  "/notifications",
  "/calendar",
  "/workflows",
  "/compliance",
  "/risks",
  "/integrations",
  "/sso",
];

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`);
  if (!response.ok) {
    throw new Error(`${route} returned ${response.status}`);
  }
}

console.log(`E2E smoke check passed for ${routes.length} routes`);

