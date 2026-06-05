import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { MessageSquare, Pin, Flag, CheckCircle2, ArrowUp } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instructor/discussions")({
  head: () => ({ meta: [{ title: "QuestLMS — Discussions" }] }),
  component: DiscussionsPage,
});

type Thread = { id: string; title: string; author: string; cls: string; replies: number; votes: number; status: "open" | "answered" | "flagged"; pinned?: boolean; lastReply: string; preview: string };

const seed: Thread[] = [
  { id: "1", title: "How do I cite Baddeley in APA?", author: "Mia Chen", cls: "Cog. Psych", replies: 4, votes: 12, status: "answered", lastReply: "1h ago", preview: "I'm writing my essay and want to make sure I cite the working-memory model correctly…" },
  { id: "2", title: "Confused about SN1 vs SN2 in question 5", author: "B. Tilek", cls: "Org. Chem II", replies: 7, votes: 9, status: "open", pinned: true, lastReply: "3h ago", preview: "The rate law seemed to fit SN1 but the stereochemistry suggests SN2 — which is it?" },
  { id: "3", title: "[Spam] Crypto channel link", author: "anon42", cls: "Calculus", replies: 0, votes: -3, status: "flagged", lastReply: "5h ago", preview: "Check out my new crypto channel — link in bio!" },
  { id: "4", title: "Tips for staying focused during long lectures?", author: "F. Saltanat", cls: "Cog. Psych", replies: 11, votes: 24, status: "open", lastReply: "Yesterday", preview: "I notice my attention dips around minute 20. Any techniques the class uses?" },
];

const tone: Record<Thread["status"], string> = {
  open: "bg-muted text-foreground/70",
  answered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  flagged: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

function DiscussionsPage() {
  const [filter, setFilter] = useState<"all" | Thread["status"]>("all");
  const items = seed.filter((t) => filter === "all" || t.status === filter);

  return (
    <DashboardShell>
      <TopBar title="Discussions" subtitle="Answer questions and moderate class forums" />

      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "open", "answered", "flagged"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-black border-2 capitalize transition-all ${filter === f ? "bg-primary text-primary-foreground border-foreground chunky-shadow" : "bg-card border-border hover:-translate-y-0.5"}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((t) => (
          <article key={t.id} className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow flex gap-4">
            <div className="flex flex-col items-center gap-1 shrink-0 w-12">
              <button className="size-8 grid place-items-center rounded-lg hover:bg-muted"><ArrowUp className="size-4" strokeWidth={2.5} /></button>
              <span className="font-black font-mono text-sm">{t.votes}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {t.pinned && <Pin className="size-3.5 text-primary" strokeWidth={3} />}
                <h3 className="font-black text-base">{t.title}</h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${tone[t.status]}`}>{t.status}</span>
              </div>
              <p className="text-xs font-bold text-foreground/50">{t.author} · {t.cls} · {t.lastReply}</p>
              <p className="text-sm font-medium text-foreground/75 mt-2 line-clamp-1">{t.preview}</p>
              <div className="flex items-center gap-3 mt-3 text-xs font-bold text-foreground/60">
                <span className="inline-flex items-center gap-1"><MessageSquare className="size-3.5" />{t.replies} replies</span>
                <button className="inline-flex items-center gap-1 hover:text-foreground"><CheckCircle2 className="size-3.5" /> Mark answered</button>
                <button className="inline-flex items-center gap-1 hover:text-rose-600"><Flag className="size-3.5" /> Flag</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
