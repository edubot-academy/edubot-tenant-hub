import i18n from "@/lib/i18n";

export const CSRF_COOKIE_NAME = "edubot_csrf_token";
export const AUTH_EXPIRED_EVENT = "edubot_tenant_auth_expired";

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
  if (/^https?:\/\//i.test(path)) return withSearchParams(path, params);
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
  const message = backendErrorMessage(payload, status);
  return status === 403 && (code === CSRF_ERROR_CODE || message.includes(CSRF_ERROR_TEXT));
}

function dispatchAuthExpired() {
  tokenStore.clear();
  tenantStore.clear();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
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
    const csrf = readCookie(CSRF_COOKIE_NAME);
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

  if (response.status === 204) return undefined as T;

  const payload = await readJsonSafe(response);

  if (!response.ok) {
    if (isCsrfError(response.status, payload) && !options.csrfRetry) {
      await apiRequest("/auth/profile", {
        method: "GET",
        skipTenantHeader: true,
        csrfRetry: true,
      });
      return apiRequest<T>(path, { ...options, csrfRetry: true });
    }

    if (response.status === 401) dispatchAuthExpired();

    const message = backendErrorMessage(payload, response.status);
    const code = backendErrorCode(payload);
    throw new ApiError(message, response.status, code, payload);
  }

  return payload as T;
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
