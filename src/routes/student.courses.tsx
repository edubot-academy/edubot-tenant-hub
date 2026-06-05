import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { CourseProgress } from "@/components/student/CourseProgress";
import { BookOpen, Clock, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export const Route = createFileRoute("/student/courses")({
  head: () => ({ meta: [{ title: "QuestLMS — My Courses" }] }),
  component: StudentCoursesPage,
});

const moreCourses = [
  { id: "math", title: "Intro to Calculus", lessons: 24, hours: 8, pct: 12, tag: "New" },
  { id: "hist", title: "World History — Modern Era", lessons: 18, hours: 6, pct: 0, tag: "Enrolled" },
  { id: "phys", title: "Physics — Mechanics", lessons: 20, hours: 7, pct: 88, tag: "Almost done" },
];

function StudentCoursesPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  return (
    <DashboardShell>
      <TopBar title={t("student.courses.title")} subtitle="Pick up where you left off." showStreak={false} />

      <div className="mb-6 flex items-center gap-3 p-3 bg-card border-2 border-border rounded-2xl chunky-shadow max-w-xl">
        <Search className="size-4 text-foreground/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your courses…"
          className="flex-1 bg-transparent outline-none text-sm font-medium"
        />
      </div>

      <CourseProgress />

      <section className="mt-10 space-y-4">
        <h3 className="text-2xl font-black flex items-center gap-2">
          <BookOpen className="size-5 text-primary" strokeWidth={2.5} /> Continue exploring
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {moreCourses
            .filter((c) => c.title.toLowerCase().includes(q.toLowerCase()))
            .map((c) => (
              <article key={c.id} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-accent/20 text-accent-foreground">
                    {c.tag}
                  </span>
                  <span className="text-xs font-bold text-foreground/40 font-mono">{c.pct}%</span>
                </div>
                <h4 className="font-black text-lg leading-tight">{c.title}</h4>
                <p className="text-xs text-foreground/50 font-medium flex items-center gap-3">
                  <span>{c.lessons} lessons</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" /> {c.hours}h
                  </span>
                </p>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${c.pct}%` }} />
                </div>
              </article>
            ))}
        </div>
      </section>
    </DashboardShell>
  );
}
