import { createFileRoute } from "@tanstack/react-router";
import { Award, BookOpen, Edit3, Star, Users } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useInstructorProfile } from "@/lib/profile/profile-api";

export const Route = createFileRoute("/instructor/profile")({
  head: () => ({ meta: [{ title: "QuestLMS — Instructor Profile" }] }),
  component: InstructorProfile,
});

const fallbackCourses = [
  { id: 1, title: "Cognitive Psychology", studentsCount: 124, ratingAverage: 4.9 },
  { id: 2, title: "Intro to Memory", studentsCount: 412, ratingAverage: 4.8 },
  { id: 3, title: "Attention and Perception", studentsCount: 89, ratingAverage: 4.7 },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "IN";
}

function InstructorProfile() {
  const backendEnabled = isBackendApiEnabled();
  const { data, isError, isLoading } = useInstructorProfile();
  const user = data?.user;
  const publicProfile = data?.publicProfile;
  const courses = data?.courses.length ? data.courses : fallbackCourses;
  const displayName = user?.fullName ?? "Prof. Aris Bekov";
  const title = publicProfile?.headline ?? user?.title ?? "QuestLMS Top Instructor";
  const bio = publicProfile?.bio ?? user?.bio ?? "Instructor profile preview. Connect the backend API to show real instructor data.";
  const stats = data?.stats ?? {
    totalStudents: 625,
    totalCourses: 8,
    averageCourseRating: 4.9,
  };
  const reviews = data?.courseReviews ?? [];
  const credentials = publicProfile?.credentials ?? [];

  return (
    <DashboardShell>
      <TopBar title="Public Profile" subtitle="How students see you on QuestLMS" />

      {backendEnabled && isError ? (
        <section className="mb-5 rounded-3xl border-2 border-destructive/40 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          Instructor profile could not be loaded. Showing preview data.
        </section>
      ) : null}

      <section className="bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow mb-5">
        <div className="h-32 bg-gradient-to-br from-primary/40 via-secondary/40 to-accent/40" />
        <div className="p-6 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="size-24 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center text-3xl font-black border-4 border-card chunky-shadow">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={displayName} className="size-full rounded-[1.25rem] object-cover" /> : getInitials(displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black">{backendEnabled && isLoading ? "Loading instructor..." : displayName}</h2>
              <p className="text-sm font-bold text-foreground/60">{title}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  ["Students", String(stats.totalStudents)],
                  ["Courses", String(stats.totalCourses)],
                  ["Rating", stats.averageCourseRating ? `${stats.averageCourseRating} ★` : "New"],
                  ["Years", publicProfile?.yearsOfExperience ? String(publicProfile.yearsOfExperience) : "—"],
                ].map(([k, v]) => (
                  <span key={k} className="px-3 py-1.5 rounded-xl bg-muted font-bold text-xs"><span className="text-foreground/50">{k} · </span>{v}</span>
                ))}
              </div>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow"><Edit3 className="size-4" strokeWidth={2.5} /> Edit profile</button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5">
          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <h3 className="font-black text-lg mb-3">About</h3>
            <p className="text-sm font-medium leading-relaxed text-foreground/80">{bio}</p>
          </section>

          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <h3 className="font-black text-lg flex items-center gap-2 mb-4"><BookOpen className="size-5 text-primary" strokeWidth={2.5} /> Courses taught</h3>
            <ul className="space-y-2">
              {courses.map((course) => (
                <li key={course.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50 border border-border">
                  <span className="font-black text-sm">{course.title}</span>
                  <span className="flex items-center gap-3 text-xs font-bold text-foreground/60">
                    <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{course.studentsCount}</span>
                    <span className="inline-flex items-center gap-1 text-amber-600"><Star className="size-3.5 fill-current" />{course.ratingAverage ?? "New"}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black text-lg flex items-center gap-2 mb-3"><Award className="size-5 text-secondary" strokeWidth={2.5} /> Credentials</h3>
            {credentials.length ? (
              <ul className="space-y-2 text-sm">
                {credentials.map((credential) => <li key={credential.id} className="font-medium">{credential.title}</li>)}
              </ul>
            ) : <p className="text-sm font-bold text-foreground/60">No credentials added yet.</p>}
          </section>
          <section className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black text-lg mb-3">Recent reviews</h3>
            {reviews.length ? (
              <ul className="space-y-3">
                {reviews.map((review) => (
                  <li key={review.id} className="text-xs">
                    <p className="font-medium text-foreground/80">{review.comment}</p>
                    <p className="font-black uppercase tracking-wider text-foreground/50 mt-1 text-[10px]">— {review.studentName}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm font-bold text-foreground/60">No course reviews yet.</p>}
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
