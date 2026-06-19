import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";

import {
  ApiError,
  apiRequest,
  isBackendApiEnabled,
  tenantStore,
  tokenStore,
  usesCookieAuthSession,
} from "@/lib/api/client";
import type { Role } from "@/lib/roles";
import { PLATFORM_FALLBACK } from "@/lib/brand-tokens";

// TypeScript-enforced completeness: adding a new Role without updating this object is a compile error.
const KNOWN_TENANT_ROLES: Record<Role, true> = {
  owner: true,
  company_admin: true,
  assistant: true,
  instructor: true,
  student: true,
  parent: true,
};
import type { TenantPlan } from "@/hooks/use-tenant";

export type AppContextUser = {
  id: number | string;
  email?: string;
  fullName?: string;
  avatar?: string | null;
  platformRole?: string | null;
};

export type TenantModel = "course_center" | "academic";

export type AppContextTenant = {
  id: number | string;
  slug: string;
  name: string;
  role: Role;
  plan: TenantPlan;
  status?: string;
  locale: "ky" | "ru" | "en";
  timezone: string;
  brandColor: string;
  secondaryColor: string;
  accentColor: string;
  logoText: string;
  logoUrl?: string | null;
  seats?: { used: number; limit: number };
  storageGb?: { used: number; limit: number };
  aiCredits?: { used: number; limit: number };
  tenantModel?: TenantModel;
};

export type AppPermission =
  | "tenant.manage"
  | "tenant.reports.view"
  | "members.manage"
  | "courses.manage"
  | "groups.manage"
  | "sessions.manage"
  | "attendance.manage"
  | "student.portal"
  | "parent.portal"
  | "assistant.support"
  | "platform.manage";

export type AppWorkspace = {
  id: number | string;
  type: "platform" | "tenant";
  name: string;
  role: Role | "admin" | "superadmin";
  companyId?: number | string | null;
  slug?: string;
};

type WorkspaceListItem = {
  id?: number | string;
  type: "platform" | "tenant";
  name: string;
  role: string;
  roles?: string[];
  companyId?: number | string | null;
  slug?: string;
  status?: string;
  plan?: TenantPlan;
  timezone?: string;
  locale?: "ky" | "ru" | "en";
  permissions?: Record<string, boolean>;
  featureFlags?: Record<string, boolean>;
  branding?: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
    displayName?: string | null;
    logoText?: string | null;
  } | null;
  logoUrl?: string | null;
  tenantModel?: TenantModel;
  settings?: { tenantModel?: TenantModel | null } | null;
};

type WorkspaceListResponse = {
  items?: WorkspaceListItem[];
  active?: WorkspaceListItem;
};

export type AppContext = {
  mode: "prototype" | "backend";
  user: AppContextUser | null;
  activeTenant: AppContextTenant;
  activeRole: Role;
  hasTenantWorkspace: boolean;
  workspaces: AppWorkspace[];
  permissions: AppPermission[];
  featureFlags: Record<string, boolean>;
  unreadNotifications: number;
};

type AppContextValue = {
  context: AppContext;
  isBackendEnabled: boolean;
  hasResolvedContext: boolean;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<AppContext | undefined>;
};

const PROTOTYPE_CONTEXT: AppContext = {
  mode: "prototype",
  user: {
    id: "prototype-user",
    email: "instructor@demo.local",
    fullName: "Prototype Instructor",
    platformRole: "instructor",
  },
  activeTenant: {
    id: "demo",
    slug: "demo",
    name: "Demo Academy",
    role: "instructor",
    plan: "growth",
    status: "active",
    locale: "ky",
    timezone: "Asia/Bishkek",
    brandColor: "#7c3aed",
    secondaryColor: PLATFORM_FALLBACK.secondary,
    accentColor: PLATFORM_FALLBACK.accent,
    logoText: "DA",
    seats: { used: 128, limit: 250 },
    storageGb: { used: 24, limit: 100 },
    aiCredits: { used: 9420, limit: 50000 },
    tenantModel: "course_center",
  },
  activeRole: "instructor",
  hasTenantWorkspace: true,
  workspaces: [
    {
      id: "demo",
      type: "tenant",
      name: "Demo Academy",
      role: "instructor",
      companyId: "demo",
      slug: "demo",
    },
  ],
  permissions: [
    "courses.manage",
    "groups.manage",
    "sessions.manage",
    "attendance.manage",
  ],
  featureFlags: {
    ai: true,
    gamification: true,
    parentPortal: true,
    liveQuiz: true,
  },
  unreadNotifications: 0,
};

const NO_WORKSPACE_TENANT: AppContextTenant = {
  id: "none",
  slug: "none",
  name: "No workspace",
  role: "student",
  plan: "starter",
  status: "unassigned",
  locale: "ky",
  timezone: "Asia/Bishkek",
  brandColor: "#475569",
  secondaryColor: PLATFORM_FALLBACK.secondary,
  accentColor: PLATFORM_FALLBACK.accent,
  logoText: "ED",
  tenantModel: "course_center",
};

// Neutral backend context used before the real app-context query resolves. This keeps
// the app out of prototype mode during boot so protected routes never flash demo data.
const BACKEND_BOOT_CONTEXT: AppContext = {
  mode: "backend",
  user: null,
  activeTenant: NO_WORKSPACE_TENANT,
  activeRole: "student",
  hasTenantWorkspace: false,
  workspaces: [],
  permissions: [],
  featureFlags: {},
  unreadNotifications: 0,
};

const AppContextState = createContext<AppContextValue | null>(null);

const neutralHostnames = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "lms.edubot.it.com",
  "staging.lms.edubot.it.com",
  "api.lms.edubot.it.com",
  "staging-api.lms.edubot.it.com",
  "lovableproject.com",
  "lovable.app",
  ...(import.meta.env.VITE_TENANT_NEUTRAL_HOSTS || "")
    .split(",")
    .map((host: string) => host.trim().toLowerCase())
    .filter(Boolean),
]);

async function fetchAppContext() {
  if (!tokenStore.get()) {
    if (usesCookieAuthSession()) {
      try {
        return await fetchCompatibilityAppContext();
      } catch (error) {
        // 401 → not authenticated, fall through to public tenant context (login page).
        // Other errors (503, network failure) → also fall through so the user sees
        // a login page instead of a permanently blank screen.
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.warn("[app-context] Non-401 error during cookie-auth boot, falling back to public context:", error);
        }
      }
    }
    return fetchPublicTenantContext();
  }

  if (import.meta.env.VITE_USE_APP_CONTEXT_ENDPOINT !== "true") {
    return fetchCompatibilityAppContext();
  }

  try {
    // Keep tenant header enabled so /me/context can honor the saved active company.
    return await apiRequest<AppContext>("/me/context");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return fetchCompatibilityAppContext();
    }
    throw error;
  }
}

export function isNeutralTenantHostname(hostname: string | null | undefined) {
  const normalized = String(hostname ?? "").toLowerCase().replace(/\.$/, "");
  return !normalized || neutralHostnames.has(normalized);
}

export function resolveTenantLookupHostname(hostname: string | null | undefined) {
  const normalized = String(hostname ?? "").toLowerCase().replace(/\.$/, "");
  if (isNeutralTenantHostname(normalized)) return null;
  if (normalized.startsWith("id-preview")) return null;
  return normalized;
}

function getTenantLookupHost() {
  if (typeof window === "undefined") return null;
  return resolveTenantLookupHostname(window.location.hostname);
}

function getQueryTenantOverride() {
  if (typeof window === "undefined") return { tenantSlug: null, tenantId: null };
  const params = new URLSearchParams(window.location.search);
  const tenantSlug = params.get("tenant")?.trim().toLowerCase() || null;
  const tenantIdValue = Number(params.get("tenantId"));
  const tenantId = Number.isFinite(tenantIdValue) && tenantIdValue > 0 ? tenantIdValue : null;
  return { tenantSlug, tenantId };
}

function getQueryTenantHost(tenantSlug: string | null) {
  if (!tenantSlug) return null;
  const baseDomain = (import.meta.env.VITE_TENANT_QUERY_BASE_DOMAIN || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
  if (!baseDomain) return tenantSlug;
  return `${tenantSlug}.${baseDomain}`;
}

async function resolveTenantByHost(host: string) {
  return apiRequest<WorkspaceListItem & { resolvedHost?: string }>("/tenant-context/resolve", {
    method: "GET",
    skipTenantHeader: true,
    params: { host },
  });
}

function isRole(value: string | undefined): value is Role {
  return Boolean(value && value in KNOWN_TENANT_ROLES);
}

function normalizeRole(value: string | undefined): Role {
  if (isRole(value)) return value;
  // Main-platform roles (superadmin, admin) are not tenant roles.
  // Tenant access requires explicit company membership with an assigned tenant role,
  // so these should never appear in a tenant workspace record. Warn and fall back.
  if (value) console.warn(`[app-context] unrecognised role "${value}" from backend, defaulting to "student"`);
  return "student";
}

function permissionKeys(permissions?: Record<string, boolean>): AppPermission[] {
  const p = permissions ?? {};
  const out: AppPermission[] = [];
  if (p.canManageTenant || p.canManageSettings) out.push("tenant.manage");
  if (p.canViewReports || p.canViewOperationalReports) out.push("tenant.reports.view");
  if (p.canManageMembers) out.push("members.manage");
  if (p.canManageCourses || p.canCoordinateGroups) out.push("courses.manage", "groups.manage");
  if (p.canTeachAssignedSessions || p.canViewOperationalSessions) out.push("sessions.manage");
  if (p.canManageAssignedAttendance) out.push("attendance.manage");
  if (p.canSupportOperations || p.canViewStudentSupportContext) out.push("assistant.support");
  if (p.canViewGuardianContext) out.push("parent.portal");
  return Array.from(new Set(out));
}

function workspaceToTenant(workspace: WorkspaceListItem): AppContextTenant {
  const role = normalizeRole(workspace.role ?? workspace.roles?.[0]);
  const name = workspace.branding?.displayName ?? workspace.name;
  const logoText =
    workspace.branding?.logoText ||
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ||
    "ED";

  return {
    id: workspace.companyId ?? workspace.id ?? "tenant",
    slug: workspace.slug ?? String(workspace.companyId ?? workspace.id ?? "tenant"),
    name,
    role,
    plan: workspace.plan ?? "growth",
    status: workspace.status,
    locale: workspace.locale ?? "ky",
    timezone: workspace.timezone ?? "Asia/Bishkek",
    brandColor: workspace.branding?.primaryColor ?? PLATFORM_FALLBACK.primary,
    secondaryColor: workspace.branding?.secondaryColor ?? PLATFORM_FALLBACK.secondary,
    accentColor: workspace.branding?.accentColor ?? PLATFORM_FALLBACK.accent,
    logoText,
    logoUrl: workspace.logoUrl,
    tenantModel: workspace.tenantModel ?? workspace.settings?.tenantModel ?? "course_center",
  };
}

async function fetchPublicTenantContext(): Promise<AppContext> {
  const queryOverride = getQueryTenantOverride();
  const lookupHost = getTenantLookupHost() || getQueryTenantHost(queryOverride.tenantSlug);
  const resolvedTenant = lookupHost ? await resolveTenantByHost(lookupHost).catch(() => null) : null;

  if (!resolvedTenant) {
    // No tenant could be resolved (neutral hostname with no override, or backend
    // unreachable). Return a minimal backend context so the auth gate shows the
    // login page rather than leaking PROTOTYPE_CONTEXT (fake demo data) in production.
    return {
      mode: "backend",
      user: null,
      activeTenant: NO_WORKSPACE_TENANT,
      activeRole: "student",
      hasTenantWorkspace: false,
      workspaces: [],
      permissions: [],
      featureFlags: {},
      unreadNotifications: 0,
    };
  }

  const activeTenant = workspaceToTenant({
    ...resolvedTenant,
    type: "tenant",
    role: resolvedTenant.role ?? "student",
    name: resolvedTenant.name ?? queryOverride.tenantSlug ?? lookupHost ?? "Tenant",
  });
  // Do not write tenantStore here — the user is unauthenticated. fetchCompatibilityAppContext
  // will set the correct tenant after login using the hostname or saved preference.

  // Build context from scratch — do not spread PROTOTYPE_CONTEXT to avoid
  // silently leaking new demo fields added there into the pre-login context.
  return {
    mode: "backend",
    user: null,
    activeTenant,
    activeRole: activeTenant.role,
    hasTenantWorkspace: true,
    workspaces: [
      {
        id: activeTenant.id,
        type: "tenant",
        name: activeTenant.name,
        role: activeTenant.role,
        companyId: activeTenant.id,
        slug: activeTenant.slug,
      },
    ],
    permissions: [],
    // Use flags returned by the backend so pre-login UI (e.g. "Parent login" tab)
    // respects the tenant's feature configuration.
    featureFlags: resolvedTenant.featureFlags ?? {},
    unreadNotifications: 0,
  };
}

function matchesNumericId(a: number | string | null | undefined, b: number | null): boolean {
  if (b === null || a === null || a === undefined) return false;
  const n = Number(a);
  return Number.isFinite(n) && n === b;
}

async function fetchCompatibilityAppContext(): Promise<AppContext> {
  const queryOverride = getQueryTenantOverride();
  const lookupHost = getTenantLookupHost() || getQueryTenantHost(queryOverride.tenantSlug);
  const [user, workspaceState, resolvedTenant] = await Promise.all([
    apiRequest<AppContextUser>("/auth/profile", { skipTenantHeader: true }),
    apiRequest<WorkspaceListResponse>("/companies/workspaces", { skipTenantHeader: true }),
    lookupHost ? resolveTenantByHost(lookupHost).catch(() => null) : Promise.resolve(null),
  ]);
  const workspaces = workspaceState.items ?? [];
  // Only accept workspaces with a recognised tenant role. Platform-level roles
  // (admin, superadmin) are not tenant roles and must not grant tenant access.
  const tenantWorkspaces = workspaces.filter(
    (workspace) => workspace.type === "tenant" && isRole(workspace.role ?? workspace.roles?.[0]),
  );
  const resolvedTenantId = Number(resolvedTenant?.companyId ?? resolvedTenant?.id);
  const requestedTenantId =
    queryOverride.tenantId ??
    (Number.isFinite(resolvedTenantId) && resolvedTenantId > 0 ? resolvedTenantId : null);
  const savedTenantId = tenantStore.get();
  const activeWorkspace =
    tenantWorkspaces.find((workspace) => matchesNumericId(workspace.companyId, requestedTenantId)) ??
    tenantWorkspaces.find((workspace) => matchesNumericId(workspace.companyId, savedTenantId)) ??
    (workspaceState.active?.type === "tenant" ? workspaceState.active : undefined) ??
    tenantWorkspaces[0];

  if (!activeWorkspace) {
    tenantStore.clear();
    // No tenant membership — platform-level roles (admin, superadmin) do not
    // grant tenant access. activeRole is irrelevant here because RouteAccessGate
    // shows NoWorkspaceAccess when hasTenantWorkspace is false.
    return {
      mode: "backend",
      user,
      activeTenant: NO_WORKSPACE_TENANT,
      activeRole: "student",
      hasTenantWorkspace: false,
      workspaces: workspaces.map((workspace) => ({
        id: workspace.id ?? workspace.companyId ?? "unknown",
        type: workspace.type,
        name: workspace.name,
        role: workspace.role as AppWorkspace["role"],
        companyId: workspace.companyId,
        slug: workspace.slug,
      })),
      permissions: [],
      featureFlags: {},
      unreadNotifications: 0,
    };
  }

  const companyId = Number(activeWorkspace.companyId);
  if (Number.isFinite(companyId) && companyId > 0) {
    tenantStore.set(companyId);
  }

  const activeTenant = workspaceToTenant(activeWorkspace);
  return {
    mode: "backend",
    user,
    activeTenant,
    activeRole: activeTenant.role,
    hasTenantWorkspace: true,
    workspaces: workspaces.map((workspace) => ({
      id: workspace.id ?? workspace.companyId ?? "unknown",
      type: workspace.type,
      name: workspace.name,
      role: workspace.role as AppWorkspace["role"],
      companyId: workspace.companyId,
      slug: workspace.slug,
    })),
    permissions: permissionKeys(activeWorkspace.permissions),
    featureFlags: activeWorkspace.featureFlags ?? {},
    unreadNotifications: 0,
  };
}

export function AppContextProvider({ children }: { children: ReactNode }) {
  const isBackendEnabled = isBackendApiEnabled();
  const query = useQuery({
    queryKey: ["app-context"],
    queryFn: fetchAppContext,
    enabled: isBackendEnabled,
    staleTime: 60_000,
    // Never retry on 401 — dispatchAuthExpired already cleared the token;
    // a second attempt just fires the auth-expired event twice.
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 1,
  });

  const value = useMemo<AppContextValue>(
    () => ({
      context: isBackendEnabled ? (query.data ?? BACKEND_BOOT_CONTEXT) : (query.data ?? PROTOTYPE_CONTEXT),
      isBackendEnabled,
      hasResolvedContext: !isBackendEnabled || query.data !== undefined,
      isLoading: isBackendEnabled && query.isLoading,
      isError: isBackendEnabled && query.isError,
      error: query.error,
      refetch: async () => {
        const result = await query.refetch();
        return result.data;
      },
    }),
    [
      isBackendEnabled,
      query.data,
      query.error,
      query.isError,
      query.isLoading,
      query.refetch,
    ],
  );

  return <AppContextState.Provider value={value}>{children}</AppContextState.Provider>;
}

export function useAppContext() {
  const value = useContext(AppContextState);
  if (!value) throw new Error("useAppContext must be used inside AppContextProvider");
  return value;
}

export function useActiveTenant() {
  return useAppContext().context.activeTenant;
}

export function useTenantModel() {
  return useActiveTenant().tenantModel ?? "course_center";
}

export function useAppPermissions() {
  const { context } = useAppContext();
  return useMemo(
    () => ({
      permissions: context.permissions,
      has: (permission: AppPermission) => context.permissions.includes(permission),
    }),
    [context.permissions],
  );
}

export function useFeatureFlag(flag: string): boolean {
  const { context } = useAppContext();
  return Boolean(context.featureFlags[flag]);
}
