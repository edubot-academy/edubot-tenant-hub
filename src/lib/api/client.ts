import i18n from "@/lib/i18n";

export const CSRF_COOKIE_NAME = "edubot_csrf_token";
export const AUTH_EXPIRED_EVENT = "edubot_tenant_auth_expired";

// In-memory fallback for CSRF tokens sent in the response body rather than Set-Cookie.
let csrfTokenMemory: string | null = null;

function readCsrfToken() {
  // Prefer in-memory token: after a CSRF refresh the memory holds the fresh value
  // while the stale cookie is still present, so memory must take priority.
  return csrfTokenMemory ?? readCookie(CSRF_COOKIE_NAME);
}

const TOKEN_KEY = "edubot_tenant_token";
const TENANT_KEY = "edubot_active_tenant_id";
const CSRF_ERROR_CODE = "CSRF_TOKEN_INVALID";
const CSRF_ERROR_TEXT = "CSRF token missing or invalid";

export type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  companyId?: number | string | null;
  params?: Record<string, string | number | boolean | null | undefined>;
  skipTenantHeader?: boolean;
  csrfRetry?: boolean;
  headers?: HeadersInit;
};

export const tokenStore = {
  get: () => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  },
  clear: () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },
};

export const tenantStore = {
  get: () => {
    if (typeof window === "undefined") return null;
    const id = Number(localStorage.getItem(TENANT_KEY));
    return Number.isFinite(id) && id > 0 ? id : null;
  },
  set: (tenantId: number) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TENANT_KEY, String(tenantId));
  },
  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TENANT_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isBackendApiEnabled() {
  return Boolean(
    import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_ENABLE_BACKEND_API === "true",
  );
}

export function usesCookieAuthSession() {
  return (
    import.meta.env.VITE_AUTH_SESSION_MODE === "cookie" ||
    import.meta.env.VITE_USE_COOKIE_AUTH === "true"
  );
}

function apiBaseUrl() {
  return String(import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
}

function withSearchParams(url: string, params?: ApiRequestOptions["params"]) {
  if (!params) return url;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  if (!query) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${query}`;
}

function apiUrl(path: string, params?: ApiRequestOptions["params"]) {
  if (/^https?:\/\//i.test(path)) {
    const base = apiBaseUrl();
    if (!base) {
      throw new Error(`apiRequest: absolute URL "${path}" is not allowed without VITE_API_BASE_URL configured`);
    }
    const allowedOrigin = new URL(base).origin;
    const requestedOrigin = new URL(path).origin;
    if (requestedOrigin !== allowedOrigin) {
      throw new Error(`apiRequest: refusing cross-origin request to "${requestedOrigin}" (allowed: "${allowedOrigin}")`);
    }
    return withSearchParams(path, params);
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return withSearchParams(`${apiBaseUrl()}${normalizedPath}`, params);
}

export function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const raw = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return raw ? decodeURIComponent(raw.slice(prefix.length)) : null;
}

function isUnsafeMethod(method?: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(String(method ?? "GET").toUpperCase());
}

async function readJsonSafe(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function backendErrorCode(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const data = payload as {
    code?: unknown;
    errorCode?: unknown;
    error?: { code?: unknown };
  };
  const code = data.error?.code ?? data.code ?? data.errorCode;
  return typeof code === "string" && code.trim() ? code.trim() : undefined;
}

function backendErrorMessage(payload: unknown, status: number) {
  if (!payload || typeof payload !== "object") return `Request failed with status ${status}`;
  const data = payload as { message?: unknown; error?: { message?: unknown } };
  const message = data.error?.message ?? data.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.filter(Boolean).join(", ");
  return `Request failed with status ${status}`;
}

function isCsrfError(status: number, payload: unknown) {
  const code = backendErrorCode(payload);
  // Require code match if a code is present — avoids false positives on legitimate
  // auth/role 403s whose message happens to contain the CSRF substring.
  if (status !== 403) return false;
  if (code) return code === CSRF_ERROR_CODE;
  return backendErrorMessage(payload, status).includes(CSRF_ERROR_TEXT);
}

// Guard so concurrent 401s fire AUTH_EXPIRED_EVENT only once per expiry.
let authExpiredFiring = false;

function dispatchAuthExpired() {
  if (authExpiredFiring) return;
  authExpiredFiring = true;
  tokenStore.clear();
  tenantStore.clear();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
  // Reset after 5 s so a future legitimate expiry (after re-login) still fires.
  setTimeout(() => { authExpiredFiring = false; }, 5_000);
}

export async function apiRequest(path: string, options: ApiRequestOptions & { _void: true }): Promise<void>;
export async function apiRequest<T>(path: string, options?: ApiRequestOptions): Promise<T>;
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T | void> {
  const headers = new Headers(options.headers);
  const method = options.method ?? (options.body === undefined ? "GET" : "POST");

  headers.set("Accept", "application/json");
  headers.set("Accept-Language", i18n.language || "ky");

  const token = tokenStore.get();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const companyId = options.companyId ?? tenantStore.get();
  if (!options.skipTenantHeader && companyId) {
    headers.set("x-company-id", String(companyId));
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      body = options.body;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
  }

  if (isUnsafeMethod(method) && !headers.has("x-csrf-token")) {
    const csrf = readCsrfToken();
    if (csrf) headers.set("x-csrf-token", csrf);
  }

  const {
    body: _body,
    companyId: _companyId,
    params,
    skipTenantHeader: _skipTenantHeader,
    csrfRetry: _csrfRetry,
    ...fetchOptions
  } = options;

  const response = await fetch(apiUrl(path, params), {
    ...fetchOptions,
    method,
    headers,
    body,
    credentials: "include",
  });

  // 204 No Content: no body. Callers that expect void are safe; callers typed
  // as returning a body must not map to a 204-returning endpoint.
  if (response.status === 204) return undefined as unknown as T;

  const payload = await readJsonSafe(response);

  if (!response.ok) {
    if (isCsrfError(response.status, payload) && !options.csrfRetry) {
      // Refresh the CSRF token. Backends that send it in the response body (not
      // Set-Cookie) are handled by extracting it here and storing it in memory.
      const profileData = await apiRequest<{ csrfToken?: string; csrf_token?: string }>("/auth/profile", {
        method: "GET",
        skipTenantHeader: true,
        csrfRetry: true,
      });
      const bodyToken = profileData?.csrfToken ?? profileData?.csrf_token;
      if (bodyToken) csrfTokenMemory = bodyToken;
      return apiRequest<T>(path, { ...options, csrfRetry: true });
    }

    if (response.status === 401) dispatchAuthExpired();

    const message = backendErrorMessage(payload, response.status);
    const code = backendErrorCode(payload);
    throw new ApiError(message, response.status, code, payload);
  }

  return payload as T;
}

export async function apiFetchRaw(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  const method = options.method ?? "GET";

  headers.set("Accept-Language", i18n.language || "ky");

  const token = tokenStore.get();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const companyId = options.companyId ?? tenantStore.get();
  if (!options.skipTenantHeader && companyId) {
    headers.set("x-company-id", String(companyId));
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      body = options.body;
    } else {
      if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
  }

  if (isUnsafeMethod(method) && !headers.has("x-csrf-token")) {
    const csrf = readCsrfToken();
    if (csrf) headers.set("x-csrf-token", csrf);
  }

  const { params, body: _body, companyId: _companyId, skipTenantHeader: _skipTenantHeader, csrfRetry: _csrfRetry, ...fetchOptions } = options;
  const response = await fetch(apiUrl(path, params), {
    ...fetchOptions,
    method,
    headers,
    body,
    credentials: "include",
  });
  if (response.status === 401) dispatchAuthExpired();
  return response;
}

export type LoginInput = {
  email: string;
  password: string;
};

export function login(input: LoginInput) {
  return apiRequest<{ token?: string; access_token?: string; user: unknown }>("/auth/login", {
    method: "POST",
    body: input,
    skipTenantHeader: true,
  }).then((data) => {
    const token = data.token ?? data.access_token;
    if (token) tokenStore.set(token);
    return data;
  });
}

export function logout() {
  return apiRequest<{ success?: boolean; messageKey?: string }>("/auth/logout", {
    method: "POST",
    skipTenantHeader: true,
  }).finally(() => {
    tokenStore.clear();
    tenantStore.clear();
  });
}

export function getProfile<T>() {
  return apiRequest<T>("/auth/profile", { skipTenantHeader: true });
}
