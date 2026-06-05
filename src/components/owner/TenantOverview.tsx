import { useTranslation } from "react-i18next";
import { Building2, Users, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

const tenants = [
  { id: 1, name: "Apex Academy", domain: "apex.questlms.io", plan: "Enterprise", users: 1240, health: "healthy", growth: "+12%" },
  { id: 2, name: "BrightFuture School", domain: "brightf.questlms.io", plan: "Pro", users: 856, health: "healthy", growth: "+8%" },
  { id: 3, name: "CodeCamp Kyrgyz", domain: "codecamp.questlms.io", plan: "Starter", users: 320, health: "warning", growth: "+3%" },
  { id: 4, name: "MedPrep Institute", domain: "medprep.questlms.io", plan: "Enterprise", users: 2100, health: "healthy", growth: "+18%" },
  { id: 5, name: "Global Learning Co.", domain: "global.questlms.io", plan: "Pro", users: 640, health: "critical", growth: "-2%" },
];

const healthIcon = (h: string) => {
  if (h === "healthy") return <CheckCircle2 className="size-4 text-emerald-500" />;
  if (h === "warning") return <AlertCircle className="size-4 text-amber-500" />;
  return <AlertCircle className="size-4 text-destructive" />;
};

const planBadge = (plan: string) => {
  const cls =
    plan === "Enterprise"
      ? "bg-primary/10 text-primary"
      : plan === "Pro"
      ? "bg-secondary/10 text-secondary"
      : "bg-muted text-muted-foreground";
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>{plan}</span>;
};

export function TenantOverview() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-7 bg-card border border-border rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("owner.tenants.title")}</h3>
        <span className="text-xs font-mono text-foreground/50">{t("owner.tenants.total")}: {tenants.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="pb-2 font-medium">{t("owner.tenants.col.org")}</th>
              <th className="pb-2 font-medium">{t("owner.tenants.col.plan")}</th>
              <th className="pb-2 font-medium">{t("owner.tenants.col.users")}</th>
              <th className="pb-2 font-medium">{t("owner.tenants.col.health")}</th>
              <th className="pb-2 font-medium text-right">{t("owner.tenants.col.growth")}</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tnt) => (
              <tr key={tnt.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-muted grid place-items-center">
                      <Building2 className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{tnt.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{tnt.domain}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">{planBadge(tnt.plan)}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="size-3.5 text-muted-foreground" />
                    <span className="font-mono">{tnt.users.toLocaleString()}</span>
                  </div>
                </td>
                <td className="py-3 pr-4">{healthIcon(tnt.health)}</td>
                <td className="py-3 text-right">
                  <span className={`font-mono text-xs ${tnt.growth.startsWith("+") ? "text-emerald-500" : "text-destructive"}`}>
                    {tnt.growth}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
