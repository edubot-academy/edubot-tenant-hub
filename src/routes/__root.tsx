import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
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
import { hydrateLanguageFromStorage } from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { ThemeProvider } from "@/lib/theme";
import { RoleProvider } from "@/lib/roles";
import { GamificationProvider } from "@/lib/gamification";
import { AppContextProvider, useAppContext } from "@/lib/app-context";
import { AUTH_EXPIRED_EVENT, ApiError, tokenStore } from "@/lib/api/client";
import { canAccessRoute, isPublicRoute } from "@/lib/route-access";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { NoWorkspaceAccess } from "@/components/auth/NoWorkspaceAccess";
import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/CommandPalette";

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
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EduBot Learning — Tenant Hub" },
      { name: "description", content: "EduBot Learning tenant workspace for instructors, students, assistants, and education teams." },
      { name: "author", content: "EduBot Learning" },
      { property: "og:title", content: "EduBot Learning — Tenant Hub" },
      { property: "og:description", content: "Tenant workspace for courses, live learning, progress, and student support." },
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
    <html lang="en">
      <head>
        <HeadContent />
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

  useEffect(() => {
    hydrateLanguageFromStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppContextProvider>
        <ThemeProvider>
          <RoleProvider>
            <GamificationProvider>
              <AuthRedirectGate />
              <RouteAccessGate>
                <Outlet />
              </RouteAccessGate>
              <CommandPalette />
              <Toaster richColors position="top-right" />
            </GamificationProvider>
          </RoleProvider>
        </ThemeProvider>
      </AppContextProvider>

    </QueryClientProvider>
  );
}

function AuthRedirectGate() {
  const { context, isBackendEnabled, isLoading, error } = useAppContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isBackendEnabled || isPublicRoute(pathname)) return;
    if (isLoading || tokenStore.get() || (context.mode === "backend" && context.user)) return;
    navigate({ to: "/auth" });
  }, [context.mode, context.user, isBackendEnabled, isLoading, navigate, pathname]);

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
  const { context, isBackendEnabled, isLoading } = useAppContext();
  const { pathname } = useLocation();

  if (!isBackendEnabled || context.mode !== "backend" || isPublicRoute(pathname)) return <>{children}</>;
  // While loading or before credentials are confirmed, render nothing rather than
  // leaking protected content for the one frame before AuthRedirectGate's effect fires.
  if (isLoading) return null;
  if (!tokenStore.get() && !context.user) return null;
  if (!context.hasTenantWorkspace) return <NoWorkspaceAccess />;
  if (canAccessRoute(pathname, context.activeRole)) return <>{children}</>;

  return <AccessDenied />;
}
