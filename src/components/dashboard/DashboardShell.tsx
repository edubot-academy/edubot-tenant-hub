import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ClientOnly } from "@/components/ClientOnly";
import { Sidebar } from "./Sidebar";
import { TenantBrand } from "./TenantBadge";
import { useRole, roleFromPath } from "@/lib/roles";

interface DashboardShellProps {
  children: ReactNode;
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block w-64 h-screen border-r border-border bg-card" />
      <div className="flex-1" />
    </div>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <ClientOnly fallback={<ShellSkeleton />}>
      <DashboardShellInner>{children}</DashboardShellInner>
    </ClientOnly>
  );
}

function DashboardShellInner({ children }: DashboardShellProps) {
  const { t } = useTranslation();
  const { config, role, setRole, isBackendControlled } = useRole();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // In prototype mode, keep active role in sync with URL for design review.
  // In backend mode, the role must come from AppContext/workspace membership only.
  useEffect(() => {
    if (isBackendControlled) return;
    const fromPath = roleFromPath(pathname);
    if (fromPath && fromPath !== role) setRole(fromPath);
  }, [pathname, role, setRole, isBackendControlled]);

  useEffect(() => {
    setMobileOpen(false);
    mainRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div
      data-surface={config.surface === "ops" ? "ops" : undefined}
      className="flex h-screen bg-background text-foreground"
    >
      {/* Desktop sidebar */}
      <aside className="hidden lg:block sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Mobile sidebar (sheet drawer) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 max-w-[85vw]">
          <SheetTitle className="sr-only">{t("app.name")}</SheetTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <main ref={mainRef} className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {/* Mobile top bar with hamburger */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={t("nav.openMenu")}
            className="size-10 grid place-items-center rounded-xl border border-border hover:bg-muted transition-colors"
          >
            <Menu className="size-5" strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2">
            <TenantBrand compact />
          </div>
          <div className="size-10" aria-hidden />
        </div>

        <div key={pathname} className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
