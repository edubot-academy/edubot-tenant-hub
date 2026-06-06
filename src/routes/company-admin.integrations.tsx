import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Globe, Plug, Shield, Webhook, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { IntegrationsMarketplace } from "@/components/admin/IntegrationsMarketplace";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { useCompanyIntegrationRecord } from "@/lib/company-admin/company-integrations-api";

export const Route = createFileRoute("/company-admin/integrations")({
  head: () => ({ meta: [{ title: "QuestLMS — Integrations" }] }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const { data, isLoading, isError } = useCompanyIntegrationRecord();

  if (backendEnabled) {
    const crmLinked = Boolean(data?.crmLink?.linked);
    const connectedCount = crmLinked ? 1 : 0;
    const host = data?.host ?? t("companyAdminIntegrationsPage.workspace.noHost");
    const featureFlags = data?.featureFlags ?? {};
    const enabledFeatures = Object.entries(featureFlags).filter(([, value]) => value).length;

    return (
      <DashboardShell>
        <TopBar />
        <section className="space-y-4">
          {isLoading && (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm text-foreground/60">
              {t("companyAdminIntegrationsPage.state.loading")}
            </div>
          )}

          {isError && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {t("companyAdminIntegrationsPage.state.error")}
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              <section className="grid gap-4 lg:grid-cols-3">
                <IntegrationStatusCard
                  icon={Globe}
                  title={t("companyAdminIntegrationsPage.cards.crm.title")}
                  status={crmLinked ? "connected" : "not_connected"}
                  description={
                    crmLinked
                      ? data.crmLink?.crmPrimaryDomain || data.crmLink?.crmTenantSlug || data.crmLink?.crmTenantId || t("companyAdminIntegrationsPage.cards.crm.connectedFallback")
                      : t("companyAdminIntegrationsPage.cards.crm.notConnected")
                  }
                  note={t("companyAdminIntegrationsPage.cards.crm.note")}
                />
                <IntegrationStatusCard
                  icon={Webhook}
                  title={t("companyAdminIntegrationsPage.cards.webhooks.title")}
                  status="coming_soon"
                  description={t("companyAdminIntegrationsPage.cards.webhooks.description")}
                  note={t("companyAdminIntegrationsPage.cards.webhooks.note")}
                />
                <IntegrationStatusCard
                  icon={Shield}
                  title={t("companyAdminIntegrationsPage.cards.sso.title")}
                  status="coming_soon"
                  description={t("companyAdminIntegrationsPage.cards.sso.description")}
                  note={t("companyAdminIntegrationsPage.cards.sso.note")}
                />
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="text-sm font-bold uppercase tracking-wider">
                    {t("companyAdminIntegrationsPage.summary.title")}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <SummaryMetric
                      label={t("companyAdminIntegrationsPage.summary.connected")}
                      value={String(connectedCount)}
                    />
                    <SummaryMetric
                      label={t("companyAdminIntegrationsPage.summary.features")}
                      value={String(enabledFeatures)}
                    />
                    <SummaryMetric
                      label={t("companyAdminIntegrationsPage.summary.host")}
                      value={host}
                    />
                    <SummaryMetric
                      label={t("companyAdminIntegrationsPage.summary.crmStatus")}
                      value={crmLinked ? t("companyAdminIntegrationsPage.status.connected") : t("companyAdminIntegrationsPage.status.notConnected")}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="text-sm font-bold uppercase tracking-wider">
                    {t("companyAdminIntegrationsPage.workspace.title")}
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-foreground/70">
                    <p>{t("companyAdminIntegrationsPage.workspace.host", { host })}</p>
                    <p>{t("companyAdminIntegrationsPage.workspace.platformManaged")}</p>
                    <p>{t("companyAdminIntegrationsPage.workspace.deferred")}</p>
                  </div>
                </div>
              </section>
            </>
          )}
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <TopBar />
      <IntegrationsMarketplace />
    </DashboardShell>
  );
}

function IntegrationStatusCard({
  icon: Icon,
  title,
  status,
  description,
  note,
}: {
  icon: typeof Globe;
  title: string;
  status: "connected" | "not_connected" | "coming_soon";
  description: string;
  note: string;
}) {
  const { t } = useTranslation();
  const tone =
    status === "connected"
      ? "bg-primary/10 text-primary"
      : status === "coming_soon"
        ? "bg-muted text-foreground/50"
        : "bg-destructive/10 text-destructive";
  const StatusIcon = status === "connected" ? CheckCircle2 : status === "coming_soon" ? Plug : XCircle;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-muted text-foreground/70">
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <div>
            <div className="text-sm font-bold">{title}</div>
            <div className="mt-1 text-xs text-foreground/60">{description}</div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider ${tone}`}>
          <StatusIcon className="size-3" strokeWidth={3} />
          {status === "connected"
            ? t("companyAdminIntegrationsPage.status.connected")
            : status === "coming_soon"
              ? t("companyAdminIntegrationsPage.status.comingSoon")
              : t("companyAdminIntegrationsPage.status.notConnected")}
        </span>
      </div>
      <div className="mt-3 text-xs text-foreground/50">{note}</div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{label}</div>
      <div className="mt-2 break-all text-sm font-semibold">{value}</div>
    </div>
  );
}
