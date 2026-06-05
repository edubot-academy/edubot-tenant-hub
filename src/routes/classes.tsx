import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, Users, Calendar, BookOpen, X } from "lucide-react";
import { useLms, createClass, coursesForClass } from "@/lib/lmsStore";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [{ title: "QuestLMS — My Classes" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const state = useLms();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", code: "", students: "", nextSession: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.code.trim()) {
      toast.error("Title and code are required");
      return;
    }
    const created = createClass({
      title: form.title.trim(),
      code: form.code.trim(),
      students: Number(form.students) || 0,
      nextSession: form.nextSession.trim(),
    });
    setForm({ title: "", code: "", students: "", nextSession: "" });
    setOpen(false);
    toast.success(`Class "${created.title}" created`);
  };

  return (
    <DashboardShell>
      <TopBar title="My Classes" subtitle="All cohorts you're teaching this term." showStreak={false} />

      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <p className="text-sm text-foreground/60 font-medium">{state.classes.length} active classes</p>
        <div className="flex items-center gap-2">
          <Link
            to="/courses"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-border bg-card font-bold text-sm hover:bg-muted transition-colors"
          >
            <BookOpen className="size-4" strokeWidth={2.5} /> Course library
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" strokeWidth={3} /> New class
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {state.classes.map((c) => {
          const courses = coursesForClass(state, c.id);
          return (
            <Link
              key={c.id}
              to="/classes/$classId"
              params={{ classId: c.id }}
              className="group bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow hover:border-foreground/20 transition-colors"
            >
              <div className={`h-24 bg-gradient-to-br ${c.color} relative`}>
                <span className="absolute top-3 left-4 text-[10px] font-black uppercase tracking-widest text-white/90">
                  {c.code}
                </span>
                <span className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/25 text-white text-[10px] font-black uppercase tracking-wider">
                  {courses.length} course{courses.length === 1 ? "" : "s"}
                </span>
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
          );
        })}
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

            <FormField label="Title">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Linear Algebra"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
                autoFocus
              />
            </FormField>

            <FormField label="Course code">
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. MTH-220"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Students">
                <input
                  type="number"
                  min={0}
                  value={form.students}
                  onChange={(e) => setForm({ ...form, students: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
                />
              </FormField>
              <FormField label="Next session">
                <input
                  value={form.nextSession}
                  onChange={(e) => setForm({ ...form, nextSession: e.target.value })}
                  placeholder="Mon, 12:00"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
                />
              </FormField>
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{label}</span>
      {children}
    </label>
  );
}
