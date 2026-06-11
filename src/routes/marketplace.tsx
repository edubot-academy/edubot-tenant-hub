import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Store } from "lucide-react";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      {
        title: i18n.t("marketplacePage.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — Marketplace",
        }),
      },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const { t } = useTranslation();
  return (
    <DashboardShell>
      <TopBar
        title={t("marketplacePage.topbar.title", { defaultValue: "Marketplace" })}
        subtitle={t("marketplacePage.topbar.subtitle", { defaultValue: "Shared content from instructors and partners around the world." })}
        showStreak={false}
      />
      <section className="rounded-3xl border-2 border-border bg-card p-10 text-center space-y-3">
        <Store className="mx-auto size-10 text-foreground/30" />
        <p className="font-black text-base">{t("marketplacePage.empty.title", { defaultValue: "Marketplace coming soon" })}</p>
        <p className="text-sm font-medium text-foreground/55">
          {t("marketplacePage.empty.body", { defaultValue: "Browse and acquire ready-made quiz packs from instructors and content partners." })}
        </p>
      </section>
    </DashboardShell>
  );
}
