import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Award, FileText } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { AchievementsWall } from "@/components/student/AchievementsWall";
import { useAppContext } from "@/lib/app-context";
import { type StudentCertificate, useStudentCertificates } from "@/lib/profile/student-profile-api";

export const Route = createFileRoute("/student/achievements")({
  head: () => ({ meta: [{ title: "QuestLMS — Achievements" }] }),
  component: StudentAchievementsPage,
});

const PROTO_CERTS = [
  { id: "c1", course: "Cognitive Psychology — Foundations", date: "Apr 2026", hours: 24 },
  { id: "c2", course: "Intro to Statistics", date: "Feb 2026", hours: 16 },
];

const PROTO_MILESTONES = [
  { id: "m1", text: "Hit a 12-day learning streak", date: "Today", emoji: "🔥" },
  { id: "m2", text: "Earned 4,000 XP this month", date: "Yesterday", emoji: "⚡" },
  { id: "m3", text: "Won a class quiz battle", date: "3d ago", emoji: "🏆" },
  { id: "m4", text: "Completed first course chapter", date: "1w ago", emoji: "📘" },
];

function StudentAchievementsPage() {
  const { context } = useAppContext();
  const certsQuery = useStudentCertificates();

  return (
    <DashboardShell>
      <TopBar title="Achievements" subtitle="Badges, certificates, and milestones you've earned." showStreak={false} />

      <AchievementsWall />

      <div className="grid grid-cols-12 gap-6 mt-10">
        <section className="col-span-12 lg:col-span-7 bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
          <h3 className="font-black text-xl flex items-center gap-2 mb-4">
            <Award className="size-5 text-accent" strokeWidth={2.5} /> Recent milestones
          </h3>
          <ul className="space-y-3">
            {PROTO_MILESTONES.map((m) => (
              <li key={m.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50">
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{m.text}</p>
                </div>
                <span className="text-xs font-bold text-foreground/40 shrink-0">{m.date}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="col-span-12 lg:col-span-5 bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
          <h3 className="font-black text-xl flex items-center gap-2 mb-4">
            <FileText className="size-5 text-primary" strokeWidth={2.5} /> Certificates
          </h3>

          {context.mode !== "backend" ? (
            <div className="space-y-3">
              {PROTO_CERTS.map((c) => (
                <article key={c.id} className="p-4 rounded-2xl border-2 border-dashed border-border">
                  <p className="font-black text-sm">{c.course}</p>
                  <p className="text-xs text-foreground/50 font-medium mt-1">
                    Issued {c.date} · {c.hours}h
                  </p>
                  <button className="mt-3 text-xs font-bold text-primary hover:underline">Download PDF</button>
                </article>
              ))}
            </div>
          ) : certsQuery.isLoading ? (
            <CertificatesSkeleton />
          ) : certsQuery.isError ? (
            <p className="text-sm font-medium text-destructive">Failed to load certificates.</p>
          ) : !certsQuery.data?.length ? (
            <p className="text-sm font-medium text-foreground/50">No certificates yet.</p>
          ) : (
            <CertificateList certs={certsQuery.data} />
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function CertificateList({ certs }: { certs: StudentCertificate[] }) {
  return (
    <div className="space-y-3">
      {certs.map((c, i) => {
        const key = c.id ?? c.publicId ?? `${c.courseId}-${i}`;
        const issued = c.issuedAt ? format(new Date(c.issuedAt), "MMM yyyy") : null;
        const context = c.groupName ?? null;
        return (
          <article key={key} className="p-4 rounded-2xl border-2 border-dashed border-border">
            <p className="font-black text-sm">{c.courseTitle}</p>
            <p className="text-xs text-foreground/50 font-medium mt-1">
              {issued ? `Issued ${issued}` : "Pending"}
              {context ? ` · ${context}` : ""}
              {c.status && c.status !== "issued" ? ` · ${c.status}` : ""}
            </p>
            {c.downloadUrl && (
              <a
                href={c.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-bold text-primary hover:underline"
              >
                Download PDF
              </a>
            )}
          </article>
        );
      })}
    </div>
  );
}

function CertificatesSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl border-2 border-dashed border-border bg-muted/30" />
      ))}
    </div>
  );
}
