import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  Navigate,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import "@/lib/i18n";
import "@/lib/overview/overview-i18n";
import { useTranslation } from "react-i18next";
import { ThemeProvider } from "@/lib/theme";
import { RoleProvider } from "@/lib/roles";
import { GamificationProvider } from "@/lib/gamification";
import { AppContextProvider, useAppContext } from "@/lib/app-context";
import { LocaleProvider } from "@/lib/LocaleProvider";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { AUTH_EXPIRED_EVENT, ApiError } from "@/lib/api/client";
import { canAccessRoute, canAccessFeature, isPublicRoute } from "@/lib/route-access";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { NoWorkspaceAccess } from "@/components/auth/NoWorkspaceAccess";
import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/CommandPalette";
import { BrandingHeadSync } from "@/components/branding/BrandingHeadSync";
import i18n from "@/lib/i18n";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("errors.notFoundTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("errors.notFoundBody")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("actions.goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("errors.genericTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("errors.genericBody")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("actions.tryAgain")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("actions.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

// Applies dark class synchronously before any CSS loads, preventing light→dark flash.
const EARLY_THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("questlms.theme");var dark=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`;

// Reads the cached brand colors from localStorage and injects the <style> tag
// synchronously before React boots, preventing any flash on subsequent page loads.
const EARLY_BRAND_SCRIPT = `(function(){try{var d=JSON.parse(localStorage.getItem("tenant-brand-cache")||"null");if(!d||d.h!==location.hostname||Date.now()-(d.t||0)>1800000)return;var hexRe=/^#[0-9A-Fa-f]{6}$/;var rgb=function(hex){if(!hexRe.test(hex||""))return null;return parseInt(hex.slice(1,3),16)+", "+parseInt(hex.slice(3,5),16)+", "+parseInt(hex.slice(5,7),16);};var sp=hexRe.test(d.p||"")?d.p:null,ss=hexRe.test(d.s||"")?d.s:null,sa=hexRe.test(d.a||"")?d.a:null;var pr=d.pr||rgb(d.p),sr=d.sr||rgb(d.s),ar=d.ar||rgb(d.a);var r=document.documentElement.style;if(sp)r.setProperty("--tenant-primary-source",sp);if(ss)r.setProperty("--tenant-secondary-source",ss);if(sa)r.setProperty("--tenant-accent-source",sa);if(pr)r.setProperty("--tenant-primary-rgb",pr);if(sr)r.setProperty("--tenant-secondary-rgb",sr);if(ar)r.setProperty("--tenant-accent-rgb",ar);var id="tenant-brand-colors";if(document.getElementById(id))return;var t=":root{";if(sp)t+="--tenant-primary-source:"+sp+";";if(ss)t+="--tenant-secondary-source:"+ss+";";if(sa)t+="--tenant-accent-source:"+sa+";";if(pr)t+="--tenant-primary-rgb:"+pr+";";if(sr)t+="--tenant-secondary-rgb:"+sr+";";if(ar)t+="--tenant-accent-rgb:"+ar+";";t+="}";var el=document.createElement("style");el.id=id;el.textContent=t;document.head.appendChild(el);}catch(e){}})();`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: i18n.t("rootMeta.title") },
      { name: "description", content: i18n.t("rootMeta.description") },
      { name: "author", content: i18n.t("rootMeta.author") },
      { property: "og:title", content: i18n.t("rootMeta.title") },
      { property: "og:description", content: i18n.t("rootMeta.description") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: EARLY_THEME_SCRIPT }} />
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: EARLY_BRAND_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppContextProvider>
        <LocaleProvider>
          <ThemeProvider>
            <RoleProvider>
              <GamificationProvider>
                <BrandingHeadSync />
                <AuthRedirectGate />
                <RouteAccessGate>
                  <Outlet />
                </RouteAccessGate>
                <CommandPalette />
                <Toaster richColors position="top-right" />
              </GamificationProvider>
            </RoleProvider>
          </ThemeProvider>
        </LocaleProvider>
      </AppContextProvider>
    </QueryClientProvider>
  );
}

function AppBootError() {
  const { t } = useTranslation();
  const { refetch } = useAppContext();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("errors.genericTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("errors.genericBody")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("actions.tryAgain")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("actions.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

function AuthRedirectGate() {
  const { context, isBackendEnabled, isLoading, isFetching, error } = useAppContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isBackendEnabled || isPublicRoute(pathname)) return;
    if (isLoading || isFetching) return;
    if (context.mode === "backend" && context.user) return;
    // Do not short-circuit on tokenStore here: an expired server-side session
    // leaves a stale token in storage while context.user is null, so we must
    // redirect regardless of whether a token exists.
    navigate({ to: "/auth" });
  }, [context.mode, context.user, isBackendEnabled, isLoading, isFetching, navigate, pathname]);

  useEffect(() => {
    if (!isBackendEnabled || isPublicRoute(pathname)) return;
    if (error instanceof ApiError && error.status === 401) {
      navigate({ to: "/auth" });
    }
  }, [error, isBackendEnabled, navigate, pathname]);

  useEffect(() => {
    if (!isBackendEnabled) return;
    const handleAuthExpired = () => {
      if (!isPublicRoute(window.location.pathname)) {
        navigate({ to: "/auth" });
      }
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, [isBackendEnabled, navigate]);

  return null;
}

function RouteAccessGate({ children }: { children: ReactNode }) {
  const { context, isBackendEnabled, hasResolvedContext, isError, isLoading, isFetching } = useAppContext();
  const { pathname } = useLocation();

  if (!isBackendEnabled || isPublicRoute(pathname)) return <>{children}</>;
  if (isLoading || (isFetching && !context.user)) return null;
  if (isError && !hasResolvedContext) return <AppBootError />;
  if (context.mode !== "backend") return <>{children}</>;
  if (!context.user) return <Navigate to="/auth" />;
  if (!context.hasTenantWorkspace) return <NoWorkspaceAccess />;
  if (canAccessRoute(pathname, context.activeRole)) {
    if (!canAccessFeature(pathname, context.featureFlags)) return <Navigate to="/" />;
    return <>{children}</>;
  }

  return <AccessDenied />;
}
