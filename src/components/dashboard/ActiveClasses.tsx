import { ClassCard } from "./ClassCard";
import { Link } from "@tanstack/react-router";
import { BookOpen, Users, Loader2, GraduationCap } from "lucide-react";
import coverPsych from "@/assets/cover-psych.jpg";
import coverChem from "@/assets/cover-chem.jpg";
import a1 from "@/assets/avatar-1.jpg";
import a2 from "@/assets/avatar-2.jpg";
import a3 from "@/assets/avatar-3.jpg";

import { useAppContext, useTenantModel } from "@/lib/app-context";
import { useTenantCourses, useAcademicClasses } from "@/lib/lms-core-api";

const ACCENT_CYCLE: Array<"primary" | "secondary"> = ["primary", "secondary"];

function AcademicActiveClasses() {
  const classesQuery = useAcademicClasses();
  const classes = (classesQuery.data?.items ?? [])
    .filter((c) => c.status === "active")
    .slice(0, 4);

  return (
    <section className="col-span-12 lg:col-span-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black">Active Classes</h3>
        <Link to="/classes" className="text-sm font-bold text-primary hover:underline">
          View all
        </Link>
      </div>

      {classesQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-foreground/40" />
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-[32px] border-2 border-dashed border-border">
          <GraduationCap className="size-8 text-foreground/25" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground/50">No active classes yet.</p>
          <Link to="/classes" className="text-xs font-bold text-primary hover:underline">
            Manage classes →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((cls, i) => {
            const accent = ACCENT_CYCLE[i % 2];
            const studentCount = cls.activeStudentCount ?? 0;
            return (
              <div
                key={cls.id}
                className={`bg-card border-2 border-border rounded-[32px] overflow-hidden chunky-shadow transition-colors animate-bounce-in ${
                  accent === "primary" ? "hover:border-primary/50" : "hover:border-secondary/50"
                }`}
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                <div
                  className={`h-32 relative flex items-end p-4 ${
                    accent === "primary"
                      ? "bg-gradient-to-br from-primary/20 to-primary/5"
                      : "bg-gradient-to-br from-secondary/20 to-secondary/5"
                  }`}
                >
                  <div className="absolute top-4 right-4 bg-card/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {studentCount} Students
                  </div>
                  <GraduationCap
                    className={`size-10 opacity-20 ${accent === "primary" ? "text-primary" : "text-secondary"}`}
                    strokeWidth={1.5}
                  />
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-bold mb-1 truncate">{cls.name}</h4>
                  {(cls.gradeLevel || cls.academicYear) && (
                    <p className="text-xs text-foreground/50 mb-3">
                      {[cls.gradeLevel, cls.academicYear].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs font-bold flex items-center gap-1 text-foreground/60">
                      <Users className="size-3.5" />
                      {studentCount} students
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {cls.code}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CourseActiveClasses() {
  const coursesQuery = useTenantCourses();
  const courses = (coursesQuery.data?.items ?? []).filter((c) => c.isPublished).slice(0, 4);

  return (
    <section className="col-span-12 lg:col-span-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black">Active Courses</h3>
        <Link to="/classes" className="text-sm font-bold text-primary hover:underline">
          View all
        </Link>
      </div>

      {coursesQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-foreground/40" />
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-[32px] border-2 border-dashed border-border">
          <BookOpen className="size-8 text-foreground/25" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground/50">No published courses yet.</p>
          <Link to="/course-studio" className="text-xs font-bold text-primary hover:underline">
            Create your first course →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course, i) => {
            const accent = ACCENT_CYCLE[i % 2];
            const enrolled = course.enrolledStudents ?? 0;
            return (
              <div
                key={course.id}
                className={`bg-card border-2 border-border rounded-[32px] overflow-hidden chunky-shadow transition-colors animate-bounce-in ${
                  accent === "primary" ? "hover:border-primary/50" : "hover:border-secondary/50"
                }`}
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                <div
                  className={`h-32 relative flex items-end p-4 ${
                    accent === "primary"
                      ? "bg-gradient-to-br from-primary/20 to-primary/5"
                      : "bg-gradient-to-br from-secondary/20 to-secondary/5"
                  }`}
                >
                  <div className="absolute top-4 right-4 bg-card/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {enrolled} Students
                  </div>
                  <BookOpen className={`size-10 opacity-20 ${accent === "primary" ? "text-primary" : "text-secondary"}`} strokeWidth={1.5} />
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-bold mb-4 truncate">{course.title}</h4>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs font-bold flex items-center gap-1 text-foreground/60">
                      <Users className="size-3.5" />
                      {enrolled} enrolled
                    </span>
                    {course.lessonCount != null && (
                      <span className="text-xs font-bold text-foreground/40">
                        {course.lessonCount} lessons
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function BackendActiveClasses() {
  const tenantModel = useTenantModel();
  if (tenantModel === "academic") return <AcademicActiveClasses />;
  return <CourseActiveClasses />;
}

export function ActiveClasses() {
  const { context } = useAppContext();

  if (context.mode === "backend") return <BackendActiveClasses />;

  return (
    <section className="col-span-12 lg:col-span-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black">Active Courses</h3>
        <Link to="/classes" className="text-sm font-bold text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClassCard
          cover={coverPsych}
          title="Cognitive Psychology"
          students={45}
          xp={12400}
          xpGoal={20000}
          avgStreak="4.2d"
          accent="primary"
          delay={300}
          avatars={[a1, a2, a3]}
        />
        <ClassCard
          cover={coverChem}
          title="Organic Chemistry II"
          students={32}
          xp={8100}
          xpGoal={15000}
          avgStreak="2.1d"
          accent="secondary"
          delay={400}
          avatars={[a2, a3]}
        />
      </div>
    </section>
  );
}
