import { createFileRoute } from "@tanstack/react-router";
import { Award, BookOpen, Flame, TrendingUp } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { useGamification } from "@/lib/gamification";
import { useStudentProfile } from "@/lib/profile/student-profile-api";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/student/profile")({
  head: () => ({ meta: [{ title: "QuestLMS — Student Profile" }] }),
  component: StudentProfilePage,
});

const fallbackCertificates = [
  { id: "c1", title: "Intro to Memory", issued: "2026-05-24T00:00:00.000Z", status: "issued" },
  { id: "c2", title: "Lab Safety", issued: "2026-04-10T00:00:00.000Z", status: "issued" },
  { id: "c3", title: "Study Skills 101", issued: "2026-03-02T00:00:00.000Z", status: "issued" },
];

const fallbackTimeline = [
  { id: "t1", type: "feedback" as const, date: "2026-06-04T00:00:00.000Z", title: "Completed quiz: Working Memory", subtitle: null, score: 9, status: "graded", courseId: null, courseTitle: null },
  { id: "t2", type: "certificate" as const, date: "2026-05-24T00:00:00.000Z", title: "Intro to Memory", subtitle: null, score: null, status: "issued", courseId: null, courseTitle: null },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatJoined(value?: string | null, t?: (key: string, options?: Record<string, unknown>) => string) {
  if (!value || !t) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return t("studentProfilePage.joined", {
    date: new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(date),
  });
}

function StudentProfilePage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const { state } = useGamification();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const { data, isLoading, isError } = useStudentProfile();

  const profile = backendEnabled ? data : null;
  const fullName = profile?.student.fullName ?? context.user?.fullName ?? "Student";
  const statXp = backendEnabled ? (profile?.gamification.xp ?? 0) : state.xp;
  const statStreak = backendEnabled ? (profile?.gamification.streak ?? 0) : state.streak;
  const statBadges = backendEnabled ? (profile?.gamification.badges ?? 0) : state.unlocked.length;
  const avatarText = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const skills = backendEnabled
    ? (profile?.skills ?? []).map((skill) => ({
        name: skill.name,
        value: skill.progressPercent,
      }))
    : state.skills.map((skill) => ({
        name: skill.name,
        value: Math.round((skill.xp / skill.max) * 100),
      }));

  const certificates = backendEnabled
    ? (profile?.certificates ?? []).map((certificate) => ({
        id: String(certificate.id ?? certificate.publicId ?? certificate.courseId),
        title: certificate.courseTitle,
        issued: certificate.issuedAt,
        status: certificate.status ?? "issued",
      }))
    : fallbackCertificates;

  const activity = backendEnabled ? (profile?.activity ?? []) : fallbackTimeline;
  const courseCount = backendEnabled
    ? (profile?.courses.length ?? profile?.summary.activeCourses ?? 0)
    : Math.max(profile?.summary.activeCourses ?? 0, state.lessonsCompleted ? 1 : 0);

  const hasSkillData = skills.length > 0;
  const cx = 110, cy = 110, r = 80;
  const radarPoints = skills.map((skill, i) => {
    const angle = (Math.PI * 2 * i) / Math.max(skills.length, 1) - Math.PI / 2;
    const dist = (skill.value / 100) * r;
    return {
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      lx: cx + Math.cos(angle) * (r + 16),
      ly: cy + Math.sin(angle) * (r + 16),
      name: skill.name,
    };
  });
  const polygon = radarPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map((scale) =>
    skills.map((_, i) => {
      const angle = (Math.PI * 2 * i) / Math.max(skills.length, 1) - Math.PI / 2;
      return `${cx + Math.cos(angle) * r * scale},${cy + Math.sin(angle) * r * scale}`;
    }).join(" "),
  );

  return (
    <DashboardShell>
      <TopBar title={t("studentProfilePage.title")} subtitle={t("studentProfilePage.subtitle")} showStreak={false} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5">
          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="size-20 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center text-3xl font-black border-4 border-foreground chunky-shadow overflow-hidden">
              {profile?.student.avatarUrl ? (
                <img src={profile.student.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                avatarText || "ST"
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black">{fullName}</h2>
              <p className="text-sm font-medium text-foreground/60">
                {profile?.student.title || t("roles.student")} {profile?.student.joinedAt ? `· ${formatJoined(profile.student.joinedAt, t)}` : ""}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  [t("studentProfilePage.stats.xp"), statXp.toLocaleString()],
                  [t("studentProfilePage.stats.streak"), t("studentProfilePage.stats.days", { count: statStreak })],
                  [t("studentProfilePage.stats.badges"), String(statBadges)],
                  [t("studentProfilePage.stats.courses"), String(courseCount)],
                ].map(([key, value]) => (
                  <span key={key} className="px-3 py-1.5 rounded-xl bg-muted font-bold text-xs">
                    <span className="text-foreground/50">{key} · </span>{value}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {backendEnabled && isLoading && (
            <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow text-sm font-medium text-foreground/60">
              {t("studentProfilePage.state.loading")}
            </section>
          )}

          {backendEnabled && isError && (
            <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow text-sm font-medium text-destructive">
              {t("studentProfilePage.state.error")}
            </section>
          )}

          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-black text-xl flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" strokeWidth={2.5} /> {t("studentProfilePage.skills.title")}
              </h3>
              {profile && (
                <div className="text-xs font-bold text-foreground/50">
                  {t("studentProfilePage.skills.lessonSummary", {
                    completed: profile.summary.lessonsCompleted,
                    total: profile.summary.lessonsTotal,
                  })}
                </div>
              )}
            </div>
            {hasSkillData ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <svg viewBox="0 0 220 220" className="w-[220px] h-[220px] shrink-0">
                  {grid.map((ring, i) => (
                    <polygon key={i} points={ring} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
                  ))}
                  <polygon points={polygon} fill="hsl(var(--primary) / 0.25)" stroke="hsl(var(--primary))" strokeWidth={2.5} />
                  {radarPoints.map((point, i) => (
                    <g key={i}>
                      <circle cx={point.x} cy={point.y} r={3.5} fill="hsl(var(--primary))" />
                      <text x={point.lx} y={point.ly} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-black fill-current">
                        {point.name}
                      </text>
                    </g>
                  ))}
                </svg>
                <ul className="flex-1 w-full space-y-2">
                  {skills.map((skill) => (
                    <li key={skill.name} className="space-y-1">
                      <div className="flex justify-between text-sm font-bold">
                        <span>{skill.name}</span>
                        <span className="font-mono">{skill.value}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${skill.value}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm font-medium text-foreground/60">{t("studentProfilePage.skills.empty")}</p>
            )}
          </section>

          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-black text-xl flex items-center gap-2">
                <Award className="size-5 text-secondary" strokeWidth={2.5} /> {t("studentProfilePage.certificates.title")}
              </h3>
              {profile && (
                <div className="text-xs font-bold text-foreground/50">
                  {t("studentProfilePage.certificates.issuedCount", { count: profile.summary.certificatesIssued })}
                </div>
              )}
            </div>
            {certificates.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {certificates.map((certificate) => (
                  <div key={certificate.id} className="border-2 border-border rounded-2xl p-4 bg-gradient-to-br from-secondary/20 to-accent/20">
                    <Award className="size-6 text-secondary mb-2" strokeWidth={2.5} />
                    <p className="font-black text-sm leading-tight">{certificate.title}</p>
                    <p className="text-xs font-bold text-foreground/50 mt-1">{formatDate(certificate.issued)}</p>
                    <p className="text-xs font-black text-primary mt-2">{certificate.status}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-foreground/60">{t("studentProfilePage.certificates.empty")}</p>
            )}
          </section>
        </div>

        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow h-fit">
          <div className="space-y-4">
            <div>
              <h3 className="font-black text-xl mb-1">{t("studentProfilePage.activity.title")}</h3>
              {profile && (
                <p className="text-xs font-medium text-foreground/50">
                  {t("studentProfilePage.activity.summary", {
                    progress: profile.summary.averageProgressPercent,
                    attendance: profile.summary.attendanceRate ?? 0,
                  })}
                </p>
              )}
            </div>
            {activity.length ? (
              <ol className="relative border-l-2 border-border ml-3 space-y-5">
                {activity.map((item) => {
                  const Icon = item.type === "certificate" ? Award : item.type === "course_completion" ? Flame : BookOpen;
                  return (
                    <li key={item.id} className="ml-5">
                      <span className="absolute -left-[13px] size-6 grid place-items-center rounded-full bg-primary text-primary-foreground border-2 border-background">
                        <Icon className="size-3" strokeWidth={3} />
                      </span>
                      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{formatDate(item.date)}</p>
                      <p className="font-bold text-sm mt-0.5">{item.title}</p>
                      {(item.subtitle || item.courseTitle) && (
                        <p className="text-xs font-medium text-foreground/60 mt-0.5">{item.subtitle || item.courseTitle}</p>
                      )}
                      {item.score != null && <p className="text-xs font-mono font-black text-primary mt-0.5">{item.score}</p>}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm font-medium text-foreground/60">{t("studentProfilePage.activity.empty")}</p>
            )}
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
