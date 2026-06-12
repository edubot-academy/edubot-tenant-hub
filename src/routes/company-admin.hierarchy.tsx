import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ArrowLeft, Check, GraduationCap, Layers } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLms, setHierarchy } from "@/lib/lmsStore";
import { ApiError, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { useCompanySettings, useUpdateCompanySettings } from "@/lib/company-admin/company-settings-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/company-admin/hierarchy")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("meta.companyAdmin.hierarchy")}` }] }),
  component: HierarchyPage,
});

function HierarchyPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const tenantModel = context.activeTenant.tenantModel ?? "course_center";
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const { hierarchy } = useLms();
  const { data, isLoading, isError } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();

  const backendHierarchy = useMemo(() => {
    const settings = data?.settings ?? {};
    const coursesEnabled = settings.hierarchyCoursesEnabled ?? true;
    const modulesEnabled = coursesEnabled && (settings.hierarchyModulesEnabled ?? true);
    return { coursesEnabled, modulesEnabled };
  }, [data]);

  useEffect(() => {
    if (!backendEnabled || !data) return;
    setHierarchy(backendHierarchy);
  }, [backendEnabled, backendHierarchy, data]);

  const visibleHierarchy = backendEnabled ? backendHierarchy : hierarchy;

  const toggle = async (key: "coursesEnabled" | "modulesEnabled", value: boolean) => {
    const next = key === "coursesEnabled"
      ? { coursesEnabled: value, modulesEnabled: value ? visibleHierarchy.modulesEnabled : false }
      : { coursesEnabled: visibleHierarchy.coursesEnabled, modulesEnabled: value };

    setHierarchy({ coursesEnabled: next.coursesEnabled, modulesEnabled: next.modulesEnabled });

    if (!backendEnabled) {
      toast.success(value ? t("companyAdminHierarchyPage.toast.enabled") : t("companyAdminHierarchyPage.toast.disabled"));
      return;
    }

    try {
      await updateSettings.mutateAsync({ hierarchyCoursesEnabled: next.coursesEnabled, hierarchyModulesEnabled: next.modulesEnabled });
      toast.success(t("companyAdminHierarchyPage.toast.saved"));
    } catch (error) {
      setHierarchy(backendHierarchy);
      toast.error(error instanceof ApiError ? error.message : t("companyAdminHierarchyPage.toast.saveFailed"));
    }
  };

  const preview: string[] = [t("companyAdminHierarchyPage.preview.class")];
  if (visibleHierarchy.coursesEnabled) preview.push(t("companyAdminHierarchyPage.preview.course"));
  if (visibleHierarchy.coursesEnabled && visibleHierarchy.modulesEnabled) preview.push(t("companyAdminHierarchyPage.preview.module"));
  preview.push(t("companyAdminHierarchyPage.preview.lesson"));

  return (
    <DashboardShell>
      <TopBar title={t("companyAdminHierarchyPage.title")} subtitle={t("companyAdminHierarchyPage.subtitle")} showStreak={false} />

      <Link to="/company-admin" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> {t("roles.company_admin")}
      </Link>

      {backendEnabled && isLoading && <div className="mb-6 rounded-2xl border border-border bg-card p-4 text-sm text-foreground/60">{t("companyAdminHierarchyPage.state.loading")}</div>}
      {backendEnabled && isError && <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{t("companyAdminHierarchyPage.state.error")}</div>}

      {tenantModel === "academic" && (
        <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="size-4 text-primary" />
                <h3 className="font-black text-base">{t("companyAdminHierarchyPage.academicModel.title")}</h3>
              </div>
              <p className="text-sm text-foreground/60">{t("companyAdminHierarchyPage.academicModel.description")}</p>
            </div>
            <Link to="/classes" className="inline-flex items-center gap-2 rounded-2xl border-2 border-border px-4 py-2.5 text-sm font-bold hover:bg-muted">
              {t("companyAdminHierarchyPage.academicModel.cta")}
            </Link>
          </div>
        </div>
      )}

      <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="size-4 text-primary" />
          <h3 className="font-black text-base">{t("companyAdminHierarchyPage.activeStructure")}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {preview.map((p, i) => (
            <div key={`${p}-${i}`} className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl border-2 border-primary bg-primary/10 text-primary font-bold text-xs uppercase tracking-wide">{p}</span>
              {i < preview.length - 1 && <span className="text-foreground/40 font-black">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Toggle title={t("companyAdminHierarchyPage.courses.title")} description={t("companyAdminHierarchyPage.courses.description")} enabled={visibleHierarchy.coursesEnabled} busy={updateSettings.isPending} onChange={(v) => toggle("coursesEnabled", v)} />
        <Toggle title={t("companyAdminHierarchyPage.modules.title")} description={t("companyAdminHierarchyPage.modules.description")} enabled={visibleHierarchy.modulesEnabled} disabled={!visibleHierarchy.coursesEnabled} busy={updateSettings.isPending} onChange={(v) => toggle("modulesEnabled", v)} />
      </div>

      <p className="mt-6 text-xs text-foreground/60">{t("companyAdminHierarchyPage.tip")}</p>
    </DashboardShell>
  );
}

function Toggle({ title, description, enabled, onChange, disabled, busy }: { title: string; description: string; enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean; busy?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 bg-card border-2 border-border rounded-2xl p-5 chunky-shadow ${disabled ? "opacity-60" : ""}`}>
      <div className="min-w-0">
        <p className="font-black text-base">{title}</p>
        <p className="text-xs text-foreground/60 mt-1">{description}</p>
      </div>
      <button type="button" disabled={disabled || busy} onClick={() => onChange(!enabled)} aria-pressed={enabled} className={`relative shrink-0 w-14 h-8 rounded-full border-2 transition-colors cursor-pointer disabled:cursor-not-allowed ${enabled ? "bg-primary border-primary" : "bg-background border-border"}`}>
        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow flex items-center justify-center transition-all ${enabled ? "left-6" : "left-0.5"}`}>
          {enabled && <Check className="size-3 text-primary" strokeWidth={3} />}
        </span>
      </button>
    </div>
  );
}
