import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Award, Download, Share2, ExternalLink, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/student/certificates")({
  head: () => ({ meta: [{ title: "QuestLMS — Certificates" }] }),
  component: CertificatesPage,
});

const certs = [
  { id: "c1", title: "Intro to Memory", issuer: "Prof. Aris · QuestLMS", issued: "May 24, 2026", grade: "A", hours: 18, credentialId: "QL-7821-MEM-2026", tone: "from-primary/30 to-secondary/30" },
  { id: "c2", title: "Lab Safety Certification", issuer: "Dr. Nuray · QuestLMS", issued: "Apr 10, 2026", grade: "Pass", hours: 6, credentialId: "QL-4421-LAB-2026", tone: "from-emerald-300/40 to-teal-300/40" },
  { id: "c3", title: "Study Skills 101", issuer: "Coach Aida · QuestLMS", issued: "Mar 2, 2026", grade: "A-", hours: 12, credentialId: "QL-1109-STU-2026", tone: "from-amber-300/40 to-orange-300/40" },
  { id: "c4", title: "Spanish A1 Foundations", issuer: "Sra. Lucia · QuestLMS", issued: "Feb 14, 2026", grade: "A", hours: 24, credentialId: "QL-0214-ESP-2026", tone: "from-rose-300/40 to-fuchsia-300/40" },
];

function CertificatesPage() {
  return (
    <DashboardShell>
      <TopBar title="Certificates" subtitle="Your verified achievements, ready to share" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Earned", value: certs.length },
          { label: "Hours", value: certs.reduce((n, c) => n + c.hours, 0) },
          { label: "Avg grade", value: "A-" },
          { label: "Verified", value: "100%" },
        ].map((s) => (
          <div key={s.label} className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{s.label}</p>
            <p className="text-2xl font-black font-mono mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {certs.map((c) => (
          <article key={c.id} className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden">
            <div className={`relative bg-gradient-to-br ${c.tone} p-6 border-b-2 border-border`}>
              <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-foreground text-background text-[10px] font-black uppercase">
                <Shield className="size-3" strokeWidth={3} /> Verified
              </div>
              <Award className="size-10 text-foreground mb-3" strokeWidth={2.5} />
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/60">Certificate of completion</p>
              <h3 className="text-xl font-black leading-tight mt-1">{c.title}</h3>
              <p className="text-xs font-bold text-foreground/70 mt-1">{c.issuer}</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Issued</p>
                  <p className="font-black text-sm mt-0.5">{c.issued}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Grade</p>
                  <p className="font-black text-sm mt-0.5">{c.grade}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Hours</p>
                  <p className="font-black text-sm mt-0.5">{c.hours}</p>
                </div>
              </div>
              <div className="text-[10px] font-mono font-bold text-foreground/50 bg-muted rounded-lg px-3 py-2 truncate">
                ID: {c.credentialId}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toast.success(`Downloading ${c.title}.pdf`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow hover:-translate-y-0.5 transition-transform"
                >
                  <Download className="size-4" strokeWidth={2.5} /> PDF
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`https://questlms.app/verify/${c.credentialId}`);
                    toast.success("Share link copied to clipboard");
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-card font-black text-sm border-2 border-border hover:-translate-y-0.5 transition-transform"
                >
                  <Share2 className="size-4" strokeWidth={2.5} /> Share
                </button>
                <button
                  onClick={() => toast(`Verifying ${c.credentialId}…`, { description: "Opening credential page." })}
                  className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border hover:-translate-y-0.5 transition-transform"
                  title="Verify online"
                >
                  <ExternalLink className="size-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
