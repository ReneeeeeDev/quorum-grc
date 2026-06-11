const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("gmp_token");
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem("gmp_token", token);
  } else {
    window.localStorage.removeItem("gmp_token");
  }
}

function tokenIsExpired(token: string): boolean {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return true;
    const payload = JSON.parse(window.atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function clearExpiredSession(): void {
  setToken(null);
  window.dispatchEvent(new CustomEvent("gmp:unauthorized"));
}

function shouldClearSession(path: string): boolean {
  return path === "/api/auth/me";
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) {
    if (typeof window !== "undefined" && tokenIsExpired(token)) {
      clearExpiredSession();
      throw new ApiError("Session expired", 401);
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "Network request failed", 0);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    if (response.status === 401 && shouldClearSession(path) && typeof window !== "undefined") {
      setToken(null);
      window.dispatchEvent(new CustomEvent("gmp:unauthorized"));
    }
    throw new ApiError(error.detail ?? "Request failed", response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const headers = new Headers();
  const token = getToken();
  if (token) {
    if (typeof window !== "undefined" && tokenIsExpired(token)) {
      clearExpiredSession();
      throw new ApiError("Session expired", 401);
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "Upload failed", 0);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    if (response.status === 401 && shouldClearSession(path) && typeof window !== "undefined") {
      setToken(null);
      window.dispatchEvent(new CustomEvent("gmp:unauthorized"));
    }
    throw new ApiError(error.detail ?? "Upload failed", response.status);
  }

  return response.json() as Promise<T>;
}
