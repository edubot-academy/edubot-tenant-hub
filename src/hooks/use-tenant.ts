import { useMemo } from "react";

import { useAppContext } from "@/lib/app-context";
import type { Role } from "@/lib/roles";

export type TenantPlan = "starter" | "growth" | "scale" | "enterprise";

export interface Tenant {
  id?: number | string;
  slug: string;
  name: string;
  role?: Role;
  plan: TenantPlan;
  status?: string;
  locale?: "ky" | "ru" | "en";
  timezone?: string;
  brandColor: string;
  logoText: string;
  logoUrl?: string | null;
  seats: { used: number; limit: number };
  storageGb: { used: number; limit: number };
  aiCredits: { used: number; limit: number };
}

const TENANT_PRESETS: Record<string, Tenant> = {
  acme: {
    slug: "acme",
    name: "Acme Academy",
    plan: "growth",
    brandColor: "#7c3aed",
    logoText: "AA",
    seats: { used: 248, limit: 500 },
    storageGb: { used: 42, limit: 100 },
    aiCredits: { used: 18450, limit: 50000 },
  },
  northwind: {
    slug: "northwind",
    name: "Northwind College",
    plan: "scale",
    brandColor: "#0ea5e9",
    logoText: "NC",
    seats: { used: 1820, limit: 2500 },
    storageGb: { used: 312, limit: 500 },
    aiCredits: { used: 84200, limit: 200000 },
  },
  contoso: {
    slug: "contoso",
    name: "Contoso Institute",
    plan: "enterprise",
    brandColor: "#10b981",
    logoText: "CI",
    seats: { used: 6210, limit: 10000 },
    storageGb: { used: 1240, limit: 2000 },
    aiCredits: { used: 421000, limit: 1000000 },
  },
};

const DEFAULT_TENANT: Tenant = {
  slug: "demo",
  name: "Demo Academy",
  plan: "growth",
  brandColor: "#7c3aed",
  logoText: "DA",
  seats: { used: 128, limit: 250 },
  storageGb: { used: 24, limit: 100 },
  aiCredits: { used: 9420, limit: 50000 },
};

const EMPTY_USAGE = {
  seats: { used: 0, limit: 0 },
  storageGb: { used: 0, limit: 0 },
  aiCredits: { used: 0, limit: 0 },
};

const RESERVED_HOSTS = new Set([
  "www",
  "app",
  "lovable",
  "lovableproject",
  "localhost",
  "id-preview",
]);

function resolveSubdomain(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length < 2) return null;
  const first = parts[0].toLowerCase();
  if (RESERVED_HOSTS.has(first)) return null;
  if (first.startsWith("id-preview")) return null;
  if (/^\d+$/.test(first)) return null;
  return first;
}

export function useTenant(): Tenant {
  const { context, isBackendEnabled } = useAppContext();
  const activeTenant = context.activeTenant;
  const isBackendMode = isBackendEnabled && context.mode === "backend";

  return useMemo(() => {
    if (isBackendMode) {
      return {
        ...activeTenant,
        seats: activeTenant.seats ?? EMPTY_USAGE.seats,
        storageGb: activeTenant.storageGb ?? EMPTY_USAGE.storageGb,
        aiCredits: activeTenant.aiCredits ?? EMPTY_USAGE.aiCredits,
      };
    }

    if (activeTenant) {
      return {
        ...activeTenant,
        seats: activeTenant.seats ?? DEFAULT_TENANT.seats,
        storageGb: activeTenant.storageGb ?? DEFAULT_TENANT.storageGb,
        aiCredits: activeTenant.aiCredits ?? DEFAULT_TENANT.aiCredits,
      };
    }

    const sub = resolveSubdomain();
    if (sub && TENANT_PRESETS[sub]) return TENANT_PRESETS[sub];
    return DEFAULT_TENANT;
  }, [activeTenant, isBackendMode]);
}
