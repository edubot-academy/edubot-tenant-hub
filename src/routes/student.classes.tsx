import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { BookOpen, Clock3, GraduationCap, Users } from "lucide-react";

import { useStudentPortalClasses } from "@/lib/student-portal-api";

export const Route = createFileRoute("/student/classes")({
  head: () => ({ meta: [{ title: "QuestLMS — My Classes" }] }),
  component: StudentClassesPage,
});

function StudentClassesPage() {
  const classesQuery = useStudentPortalClasses();

  return (
    <DashboardShell>
      <TopBar title="My classes" subtitle="Your assigned academic classes and subjects." showStreak={false} />

      {classesQuery.isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-44 rounded-3xl border-2 border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (classesQuery.data ?? []).length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-foreground/60">
          No academic classes assigned yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {(classesQuery.data ?? []).map((item) => (
            <Link
              key={item.id}
              to="/student/classes/$classId"
              params={{ classId: String(item.id) }}
              className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4 transition-colors hover:border-foreground/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black">{item.name}</h3>
                  <p className="text-xs font-medium text-foreground/55">
                    {item.code}
                    {item.gradeLevel ? ` · ${item.gradeLevel}` : ""}
                    {item.academicYear ? ` · ${item.academicYear}` : ""}
                  </p>
                </div>
                <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                  {item.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Metric icon={<Users className="size-3.5" />} label="Students" value={String(item.studentCount)} />
                <Metric icon={<BookOpen className="size-3.5" />} label="Subjects" value={String(item.activeCourseCount)} />
                <Metric icon={<Clock3 className="size-3.5" />} label="Next session" value={item.nextSessionAt ? "Scheduled" : "Pending"} />
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-foreground/65">
                <GraduationCap className="size-4" />
                {item.advisor.name ?? "Advisor pending"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-foreground/55">{icon}<span className="text-[10px] font-black uppercase tracking-wider">{label}</span></div>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}
