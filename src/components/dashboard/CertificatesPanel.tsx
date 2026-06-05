import { Award, Settings } from "lucide-react";

const tiles = [
  { label: "Pending", value: 7, tone: "text-destructive bg-destructive/10" },
  { label: "Not issued", value: 14, tone: "text-accent-foreground bg-accent/20" },
  { label: "Issued", value: 132, tone: "text-streak bg-streak/10" },
  { label: "Needs config", value: 2, tone: "text-secondary bg-secondary/10" },
];

export function CertificatesPanel() {
  return (
    <div
      className="bg-card border-2 border-border rounded-[32px] p-6 chunky-shadow animate-bounce-in"
      style={{ animationDelay: "450ms" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 grid place-items-center">
            <Award className="size-5 text-primary" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black">Certificates</h3>
            <p className="text-xs font-bold text-foreground/50">Approval workload by status</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 text-xs font-black text-foreground/50 hover:text-primary uppercase tracking-widest">
          <Settings className="size-3.5" strokeWidth={2.5} />
          Config
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className={`rounded-2xl p-4 ${t.tone}`}>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{t.label}</p>
            <p className="text-3xl font-black font-mono leading-none mt-2">{t.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
