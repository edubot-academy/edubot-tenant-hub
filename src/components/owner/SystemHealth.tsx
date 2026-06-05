import { useTranslation } from "react-i18next";
import { Activity, Server, Database, Cloud, Wifi } from "lucide-react";

const services = [
  { name: "API Gateway", status: "operational", uptime: "99.99%", latency: "42ms", icon: Wifi },
  { name: "Auth Service", status: "operational", uptime: "99.97%", latency: "28ms", icon: Cloud },
  { name: "Database Primary", status: "operational", uptime: "99.95%", latency: "12ms", icon: Database },
  { name: "Media Stream", status: "degraded", uptime: "99.82%", latency: "156ms", icon: Server },
  { name: "Search Index", status: "operational", uptime: "99.91%", latency: "34ms", icon: Activity },
];

export function SystemHealth() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-6 bg-card border border-border rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("owner.health.title")}</h3>
        <span className="text-xs font-mono text-foreground/50">{t("owner.health.live")}</span>
      </div>

      <div className="space-y-3">
        {services.map((svc) => {
          const Icon = svc.icon;
          const statusColor =
            svc.status === "operational"
              ? "bg-emerald-500"
              : svc.status === "degraded"
              ? "bg-amber-500"
              : "bg-destructive";
          return (
            <div key={svc.name} className="flex items-center justify-between bg-muted/40 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-muted grid place-items-center">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{svc.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-block size-1.5 rounded-full ${statusColor}`} />
                    <span className="text-[11px] text-muted-foreground capitalize">{svc.status}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold">{svc.uptime}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{svc.latency}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
