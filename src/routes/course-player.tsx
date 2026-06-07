import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { CheckCircle2, Circle, Clock, Layers3, ListChecks, MapPin } from "lucide-react";
import { z } from "zod";

import { useAppContext } from "@/lib/app-context";
import { useStudentPortalCourseDetail } from "@/lib/student-portal-api";

export const Route = createFileRoute("/course-player")({
  validateSearch: z.object({
    courseId: z.coerce.number().optional(),
    groupId: z.coerce.number().optional(),
  }),
  head: () => ({ meta: [{ title: "QuestLMS — Course Player" }] }),
  component: CoursePlayerPage,
});

function CoursePlayerPage() {
  const { context } = useAppContext();
  const search = Route.useSearch();
  const courseId = search.courseId ?? null;
  const groupId = search.groupId ?? null;

  // The student-portal API rejects non-student sessions. Only enable the query
  // when the active role is actually "student" in backend mode.
  const isStudentBackend = context.mode === "backend" && context.activeRole === "student";
  const detailQuery = useStudentPortalCourseDetail(
    isStudentBackend ? courseId : null,
    isStudentBackend ? groupId : null,
  );

  if (!isStudentBackend) {
    return <PrototypeCoursePlayer />;
  }

  return (
    <DashboardShell>
      <TopBar
        title={detailQuery.data?.course.title ?? "Course workspace"}
        subtitle={detailQuery.data?.course.groupName ?? "Track sessions, materials, and tasks."}
        showStreak={false}
      />

      {!courseId ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Open a course from your student dashboard first.
        </div>
      ) : detailQuery.isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <div className="h-80 rounded-3xl border-2 border-border bg-card animate-pulse" />
          <div className="h-80 rounded-3xl border-2 border-border bg-card animate-pulse" />
        </div>
      ) : detailQuery.isError || !detailQuery.data ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Unable to load this course right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-4">
            <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                  {detailQuery.data.course.courseType.replace(/_/g, " ")}
                </span>
                <span className="rounded-lg bg-secondary/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/70">
                  {detailQuery.data.course.status}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-black">{detailQuery.data.course.title}</h2>
                <p className="mt-1 text-sm font-medium text-foreground/60">
                  {detailQuery.data.course.description ?? "No course description yet."}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Progress</p>
                  <p className="mt-1 text-2xl font-black text-primary">{detailQuery.data.progress?.progressPercent ?? 0}%</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Sessions</p>
                  <p className="mt-1 text-2xl font-black">{detailQuery.data.sessions.length}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Open tasks</p>
                  <p className="mt-1 text-2xl font-black">{detailQuery.data.tasks.filter((task) => task.status === "open" || task.status === "overdue").length}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-black"><Layers3 className="size-4.5 text-primary" /> Session plan</h3>
              {detailQuery.data.sessions.length === 0 ? (
                <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                  No sessions scheduled yet.
                </div>
              ) : (
                <ul className="space-y-2">
                  {detailQuery.data.sessions.map((session) => (
                    <li key={session.id} className="rounded-2xl border-2 border-border bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">{session.sessionTitle}</p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs font-medium text-foreground/55">
                            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {session.startsAt ?? session.startAt ?? "TBD"}</span>
                            {session.location ? <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {session.location}</span> : null}
                          </div>
                        </div>
                        <span className="rounded-lg bg-background px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">
                          {session.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-black"><ListChecks className="size-4.5 text-primary" /> Tasks</h3>
              {detailQuery.data.tasks.length === 0 ? (
                <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                  No tasks published for this course yet.
                </div>
              ) : (
                <ul className="space-y-2">
                  {detailQuery.data.tasks.map((task) => (
                    <li key={`${task.kind}-${task.id}`} className="flex items-center gap-3 rounded-2xl border-2 border-border bg-muted/20 p-4">
                      {task.status === "approved" || task.status === "completed" || task.status === "submitted" ? (
                        <CheckCircle2 className="size-5 shrink-0 text-primary" strokeWidth={2.5} />
                      ) : (
                        <Circle className="size-5 shrink-0 text-foreground/30" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{task.title}</p>
                        <p className="truncate text-xs font-medium text-foreground/55">
                          {task.kind} · {task.sessionTitle ?? "Session task"}
                        </p>
                      </div>
                      <span className="rounded-lg bg-background px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">
                        {task.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow h-fit">
            <h3 className="font-black text-sm uppercase tracking-wider text-foreground/60 mb-3 px-2">Course outline</h3>
            <ul className="space-y-1">
              {detailQuery.data.sessions.map((session) => (
                <li key={session.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-transparent hover:bg-muted">
                  {session.status === "completed" ? (
                    <CheckCircle2 className="size-5 text-primary shrink-0" strokeWidth={2.5} />
                  ) : (
                    <Circle className="size-5 text-foreground/30 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{session.sessionTitle}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
                      session {session.sessionIndex}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 bg-secondary/20 rounded-xl">
              <p className="text-xs font-bold">Certificate</p>
              <p className="mt-1 text-sm font-medium text-foreground/70">
                {detailQuery.data.certificate?.issuedAt ? "Issued" : "Not issued yet"}
              </p>
            </div>
          </aside>
        </div>
      )}
    </DashboardShell>
  );
}

function PrototypeCoursePlayer() {
  return (
    <DashboardShell>
      <TopBar title="Cognitive Psychology" subtitle="Module 3 · Working Memory" showStreak={false} />
      <div className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
        Prototype course player remains available in non-backend mode.
      </div>
    </DashboardShell>
  );
}
