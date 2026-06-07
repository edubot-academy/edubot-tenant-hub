import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { BookOpen, Clock, GraduationCap, Search, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";

import { useTenantModel } from "@/lib/app-context";
import { useStudentPortalClasses, useStudentPortalCourses } from "@/lib/student-portal-api";

export const Route = createFileRoute("/student/courses")({
  head: () => ({ meta: [{ title: "QuestLMS — My Courses" }] }),
  component: StudentCoursesPage,
});

function StudentCoursesPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const tenantModel = useTenantModel();
  const coursesQuery = useStudentPortalCourses();
  const classesQuery = useStudentPortalClasses();

  const courses = useMemo(() => {
    const value = q.trim().toLowerCase();
    return (coursesQuery.data ?? []).filter((course) => {
      if (!value) return true;
      return [course.title, course.groupName, course.instructorName]
        .filter(Boolean)
        .some((part) => String(part).toLowerCase().includes(value));
    });
  }, [coursesQuery.data, q]);

  const academicClasses = useMemo(() => {
    const value = q.trim().toLowerCase();
    return (classesQuery.data ?? []).filter((item) => {
      if (!value) return true;
      return [item.name, item.code, item.gradeLevel, item.academicYear, item.advisor.name]
        .filter(Boolean)
        .some((part) => String(part).toLowerCase().includes(value));
    });
  }, [classesQuery.data, q]);

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

      {coursesQuery.isLoading || (tenantModel === "academic" && classesQuery.isLoading) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-40 rounded-3xl border-2 border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : tenantModel === "academic" ? (
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-2xl font-black flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" strokeWidth={2.5} /> My classes
            </h3>
            {academicClasses.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-foreground/60">
                No academic classes assigned yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {academicClasses.map((academicClass) => {
                  const classCourses = courses.filter((course) => course.groupId === academicClass.id);
                  return (
                    <article key={academicClass.id} className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-black">{academicClass.name}</h4>
                          <p className="text-xs font-medium text-foreground/55">
                            {academicClass.code}
                            {academicClass.gradeLevel ? ` · ${academicClass.gradeLevel}` : ""}
                            {academicClass.academicYear ? ` · ${academicClass.academicYear}` : ""}
                          </p>
                        </div>
                        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                          {academicClass.activeCourseCount} subjects
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs font-medium text-foreground/60">
                        <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {academicClass.studentCount} students</span>
                        <span className="inline-flex items-center gap-1"><BookOpen className="size-3.5" /> {academicClass.advisor.name ?? "Advisor pending"}</span>
                        {academicClass.nextSessionAt ? (
                          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> Next session scheduled</span>
                        ) : null}
                      </div>

                      {classCourses.length === 0 ? (
                        <div className="rounded-2xl bg-muted/40 p-4 text-sm font-medium text-foreground/60">
                          No subjects attached to this class yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {classCourses.map((course) => (
                            <Link
                              key={`${course.courseId}-${course.groupId ?? 'none'}`}
                              to="/course-player"
                              search={{ courseId: course.courseId, groupId: course.groupId ?? undefined }}
                              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-muted/30 p-4 transition-colors hover:bg-muted"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black">{course.title}</p>
                                <p className="truncate text-xs font-medium text-foreground/55">
                                  {course.instructorName ?? "Instructor pending"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-primary">{course.progressPercent}%</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/45">{course.status}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-foreground/60">
          No courses assigned yet.
        </div>
      ) : (
        <section className="mt-4 space-y-4">
          <h3 className="text-2xl font-black flex items-center gap-2">
            <BookOpen className="size-5 text-primary" strokeWidth={2.5} /> Continue learning
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Link
                key={`${course.courseId}-${course.groupId ?? 'none'}`}
                to="/course-player"
                search={{ courseId: course.courseId, groupId: course.groupId ?? undefined }}
                className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-3 transition-colors hover:border-foreground/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-accent/20 text-accent-foreground">
                    {course.status}
                  </span>
                  <span className="text-xs font-bold text-foreground/40 font-mono">{course.progressPercent}%</span>
                </div>
                <h4 className="font-black text-lg leading-tight">{course.title}</h4>
                <p className="text-xs text-foreground/50 font-medium flex items-center gap-3">
                  <span>{course.groupName ?? course.instructorName ?? "Assigned course"}</span>
                </p>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${course.progressPercent}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
