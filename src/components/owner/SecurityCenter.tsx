import { useTranslation } from "react-i18next";
import { ShieldCheck, ShieldAlert, Lock, Fingerprint, Globe } from "lucide-react";

const threats = [
  { id: 1, type: "bruteForce", target: "apex.questlms.io", time: "2m ago", severity: "blocked" },
  { id: 2, type: "suspiciousLogin", target: "medprep.questlms.io", time: "14m ago", severity: "blocked" },
  { id: 3, type: "rateLimit", target: "global.questlms.io", time: "1h ago", severity: "mitigated" },
];

export function SecurityCenter() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-6 bg-card border border-border rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("owner.security.title")}</h3>
        <span className="text-xs font-mono text-foreground/50">{t("owner.security.last24")}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-muted/40 rounded-xl p-3 text-center">
          <Lock className="size-4 mx-auto mb-1 text-primary" />
          <div className="text-lg font-black font-mono">94%</div>
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t("owner.security._2faRate")}</div>
        </div>
        <div className="bg-muted/40 rounded-xl p-3 text-center">
          <ShieldCheck className="size-4 mx-auto mb-1 text-emerald-500" />
          <div className="text-lg font-black font-mono">0</div>
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t("owner.security.breaches")}</div>
        </div>
        <div className="bg-muted/40 rounded-xl p-3 text-center">
          <Fingerprint className="size-4 mx-auto mb-1 text-secondary" />
          <div className="text-lg font-black font-mono">3</div>
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t("owner.security.blocked")}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{t("owner.security.recentThreats")}</div>
        {threats.map((threat) => (
          <div key={threat.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              {threat.severity === "blocked" ? (
                <ShieldAlert className="size-4 text-destructive" />
              ) : (
                <ShieldCheck className="size-4 text-amber-500" />
              )}
              <div>
                <div className="text-xs font-semibold">{t(`owner.security.types.${threat.type}`)}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{threat.target}</div>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${threat.severity === "blocked" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"}`}>
                {t(`owner.security.severity.${threat.severity}`)}
              </span>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{threat.time}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
