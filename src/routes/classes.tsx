import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, Users, Calendar, MoreHorizontal, X } from "lucide-react";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [{ title: "QuestLMS — My Classes" }] }),
  component: ClassesPage,
});

type ClassItem = {
  id: string;
  title: string;
  code: string;
  students: number;
  nextSession: string;
  color: string;
};

const seedClasses: ClassItem[] = [
  { id: "psych", title: "Cognitive Psychology", code: "PSY-201", students: 38, nextSession: "Today, 18:00", color: "from-primary to-primary/70" },
  { id: "chem", title: "Organic Chemistry II", code: "CHM-302", students: 24, nextSession: "Tomorrow, 10:00", color: "from-secondary to-secondary/70" },
  { id: "math", title: "Intro to Calculus", code: "MTH-101", students: 52, nextSession: "Thu, 14:00", color: "from-accent to-accent/70" },
  { id: "hist", title: "World History — Modern Era", code: "HST-210", students: 19, nextSession: "Fri, 09:00", color: "from-primary to-secondary" },
];

const STORAGE_KEY = "questlms.classes.v1";
const palette = [
  "from-primary to-primary/70",
  "from-secondary to-secondary/70",
  "from-accent to-accent/70",
  "from-primary to-secondary",
  "from-secondary to-accent",
];

function ClassesPage() {
  const [extra, setExtra] = useState<ClassItem[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", code: "", students: "", nextSession: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setExtra(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: ClassItem[]) => {
    setExtra(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.code.trim()) {
      toast.error("Title and code are required");
      return;
    }
    const item: ClassItem = {
      id: `cls-${Date.now()}`,
      title: form.title.trim(),
      code: form.code.trim().toUpperCase(),
      students: Number(form.students) || 0,
      nextSession: form.nextSession.trim() || "TBA",
      color: palette[(extra.length + seedClasses.length) % palette.length],
    };
    persist([item, ...extra]);
    setForm({ title: "", code: "", students: "", nextSession: "" });
    setOpen(false);
    toast.success(`Class "${item.title}" created`);
  };

  const all = [...extra, ...seedClasses];

  return (
    <DashboardShell>
      <TopBar title="My Classes" subtitle="All cohorts you're teaching this term." showStreak={false} />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-foreground/60 font-medium">{all.length} active classes</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" strokeWidth={3} /> New class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {all.map((c) => (
          <Link
            key={c.id}
            to="/"
            className="group bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow hover:border-foreground/20 transition-colors"
          >
            <div className={`h-24 bg-gradient-to-br ${c.color} relative`}>
              <span className="absolute top-3 left-4 text-[10px] font-black uppercase tracking-widest text-white/90">
                {c.code}
              </span>
              <button type="button" className="absolute top-3 right-3 size-8 grid place-items-center rounded-lg bg-black/20 text-white hover:bg-black/30">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-black text-lg leading-tight">{c.title}</h3>
              <div className="flex items-center gap-4 text-xs font-bold text-foreground/60">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5" /> {c.students}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> {c.nextSession}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">New class</h2>
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Linear Algebra"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
                autoFocus
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Course code</span>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. MTH-220"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Students</span>
                <input
                  type="number"
                  min={0}
                  value={form.students}
                  onChange={(e) => setForm({ ...form, students: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Next session</span>
                <input
                  value={form.nextSession}
                  onChange={(e) => setForm({ ...form, nextSession: e.target.value })}
                  placeholder="Mon, 12:00"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">
                Cancel
              </button>
              <button type="submit" className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90">
                Create class
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
