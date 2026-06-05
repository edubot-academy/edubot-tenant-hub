import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, FileText, Calendar, Users, MoreVertical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/instructor/assignments")({
  head: () => ({ meta: [{ title: "QuestLMS — Assignments" }] }),
  component: AssignmentsPage,
});

type Status = "draft" | "live" | "closed";
type Assignment = { id: string; title: string; cls: string; due: string; points: number; submitted: number; total: number; status: Status; type: string };

const seed: Assignment[] = [
  { id: "a1", title: "Essay: Theories of Memory", cls: "Cog. Psych", due: "Jun 14", points: 100, submitted: 86, total: 124, status: "live", type: "Essay" },
  { id: "a2", title: "Problem Set #8", cls: "Calculus", due: "Jun 16", points: 50, submitted: 42, total: 142, status: "live", type: "Worksheet" },
  { id: "a3", title: "Lab Report — Aldehydes", cls: "Org. Chem II", due: "Jun 20", points: 80, submitted: 12, total: 86, status: "live", type: "Lab" },
  { id: "a4", title: "Final Project Proposal", cls: "Cog. Psych", due: "Jul 02", points: 25, submitted: 0, total: 124, status: "draft", type: "Project" },
  { id: "a5", title: "Quiz: Attention Models", cls: "Cog. Psych", due: "Jun 05", points: 20, submitted: 120, total: 124, status: "closed", type: "Quiz" },
];

const tabs: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "live", label: "Live" },
  { key: "closed", label: "Closed" },
];

const statusTone: Record<Status, string> = {
  draft: "bg-muted text-foreground/60",
  live: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  closed: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

function AssignmentsPage() {
  const [tab, setTab] = useState<Status | "all">("all");
  const [open, setOpen] = useState(false);
  const items = seed.filter((a) => tab === "all" || a.status === tab);

  return (
    <DashboardShell>
      <TopBar title="Assignments" subtitle="Create and track work across all your classes" />

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${tab === t.key ? "bg-primary text-primary-foreground border-foreground chunky-shadow" : "bg-card border-border hover:-translate-y-0.5"}`}>{t.label}</button>
          ))}
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow hover:-translate-y-0.5 transition-transform">
          <Plus className="size-4" strokeWidth={3} /> New assignment
        </button>
      </div>

      <div className="space-y-3">
        {items.map((a) => (
          <article key={a.id} className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow flex flex-col md:flex-row md:items-center gap-4">
            <span className="size-12 grid place-items-center rounded-2xl bg-muted shrink-0"><FileText className="size-5 text-primary" strokeWidth={2.5} /></span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base">{a.title}</h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${statusTone[a.status]}`}>{a.status}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{a.type}</span>
              </div>
              <p className="text-xs font-bold text-foreground/60 mt-1">{a.cls}</p>
            </div>
            <div className="flex items-center gap-5 text-xs font-bold text-foreground/70">
              <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" />Due {a.due}</span>
              <span className="font-mono">{a.points} pts</span>
              <span className="inline-flex items-center gap-2 min-w-[120px]">
                <Users className="size-3.5" />
                <span className="h-2 w-16 bg-muted rounded-full overflow-hidden"><span className="block h-full bg-primary" style={{ width: `${(a.submitted / a.total) * 100}%` }} /></span>
                <span className="font-mono">{a.submitted}/{a.total}</span>
              </span>
            </div>
            <button className="size-9 grid place-items-center rounded-xl hover:bg-muted"><MoreVertical className="size-4" /></button>
          </article>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border-2 border-border rounded-3xl chunky-shadow max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-xl mb-4">New assignment</h3>
            <form onSubmit={(e) => { e.preventDefault(); setOpen(false); toast.success("Assignment created as draft"); }} className="space-y-3">
              <div><label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Title</label><input required placeholder="Essay: …" className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted border-2 border-border text-sm font-bold outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Class</label><select className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted border-2 border-border text-sm font-bold outline-none"><option>Cog. Psych</option><option>Calculus</option><option>Org. Chem II</option></select></div>
                <div><label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Type</label><select className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted border-2 border-border text-sm font-bold outline-none"><option>Essay</option><option>Quiz</option><option>Worksheet</option><option>Project</option><option>Lab</option></select></div>
                <div><label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Due date</label><input type="date" className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted border-2 border-border text-sm font-bold outline-none" /></div>
                <div><label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Points</label><input type="number" defaultValue={100} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted border-2 border-border text-sm font-bold outline-none" /></div>
              </div>
              <div><label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Instructions</label><textarea rows={3} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted border-2 border-border text-sm font-medium outline-none resize-none" /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl bg-card font-black text-sm border-2 border-border">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow">Create draft</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
