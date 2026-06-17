import { useEffect } from "react";

import { useAppContext } from "@/lib/app-context";
import { computeBrandTokens } from "@/lib/brand-tokens";

const MANAGED_ICON_ID = "tenant-brand-favicon";
const MANAGED_APPLE_ICON_ID = "tenant-brand-apple-touch-icon";
const BRAND_CACHE_KEY = "tenant-brand-cache";

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function upsertIcon(id: string, rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`#${id}`);

  if (!element) {
    element = document.createElement("link");
    element.id = id;
    document.head.appendChild(element);
  }

  element.rel = rel;
  element.href = href;
}

function applyBrandTokens(brandColor: string, secondaryColor: string, accentColor: string) {
  const tokens = computeBrandTokens({ primary: brandColor, secondary: secondaryColor, accent: accentColor });
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--tenant-primary-source", tokens.primary);
  rootStyle.setProperty("--tenant-secondary-source", tokens.secondary);
  rootStyle.setProperty("--tenant-accent-source", tokens.accent);
  rootStyle.setProperty("--tenant-primary-rgb", tokens.primaryRgb);
  rootStyle.setProperty("--tenant-secondary-rgb", tokens.secondaryRgb);
  rootStyle.setProperty("--tenant-accent-rgb", tokens.accentRgb);

  // Cache with a timestamp so the early-brand script can skip a stale entry.
  try {
    localStorage.setItem(BRAND_CACHE_KEY, JSON.stringify({
      h: window.location.hostname,
      p: tokens.primary, s: tokens.secondary, a: tokens.accent,
      pr: tokens.primaryRgb, sr: tokens.secondaryRgb, ar: tokens.accentRgb,
      t: Date.now(),
    }));
  } catch (_) {}
}

function createFallbackIconUrl({ logoText, brandColor }: { logoText: string; brandColor: string }) {
  const initials = (logoText || "ED").slice(0, 3).toUpperCase();
  const { primary: bg } = computeBrandTokens({ primary: brandColor, secondary: brandColor, accent: brandColor });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="900" fill="#ffffff">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function BrandingHeadSync() {
  const { context, isLoading } = useAppContext();
  const tenant = context.activeTenant;

  useEffect(() => {
    if (typeof document === "undefined") return;
    // Skip all branding updates while the real context is still loading.
    // The CSS defaults hold during that window so there's no flash between
    // prototype fallback values and the actual tenant brand.
    if (isLoading) return;

    const tenantName = tenant.name?.trim() || "Tenant workspace";
    const description = `${tenantName} workspace for courses, live learning, progress, and student support.`;
    const iconHref =
      tenant.logoUrl ||
      createFallbackIconUrl({
        logoText: tenant.logoText,
        brandColor: tenant.brandColor,
      });

    document.title = tenantName;

    upsertMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });
    upsertMeta('meta[name="author"]', {
      name: "author",
      content: tenantName,
    });
    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: tenantName,
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: tenantName,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });

    upsertIcon(MANAGED_ICON_ID, "icon", iconHref);
    upsertIcon(MANAGED_APPLE_ICON_ID, "apple-touch-icon", iconHref);
    applyBrandTokens(tenant.brandColor, tenant.secondaryColor, tenant.accentColor);
  }, [isLoading, tenant.brandColor, tenant.secondaryColor, tenant.accentColor, tenant.logoText, tenant.logoUrl, tenant.name]);

  return null;
}
