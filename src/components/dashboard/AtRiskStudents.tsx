import { AlertTriangle, MessageCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

import { useAppContext } from "@/lib/app-context";
import { useInstructorAnalyticsOverview } from "@/lib/instructor/instructor-analytics-api";

const PROTO_STUDENTS = [
  { id: 1, name: "Aizat M.", reasonKey: "instructor.atRisk.r1", initials: "AM" },
  { id: 2, name: "Bekzat T.", reasonKey: "instructor.atRisk.r2", initials: "BT" },
  { id: 3, name: "Dilnoza K.", reasonKey: "instructor.atRisk.r3", initials: "DK" },
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function Shell({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-8 p-6 bg-card border-2 border-border rounded-[28px] chunky-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="size-10 rounded-xl bg-destructive/10 text-destructive grid place-items-center">
          <AlertTriangle className="size-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-black">{t("instructor.atRisk.title")}</h3>
          <p className="text-xs text-foreground/55 font-medium">{subtitle ?? t("instructor.atRisk.subtitle")}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function BackendAtRiskStudents() {
  const { t } = useTranslation();
  const analyticsQuery = useInstructorAnalyticsOverview();
  const students = (analyticsQuery.data?.charts.atRiskStudents ?? []).slice(0, 3);

  if (analyticsQuery.isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-foreground/40" />
        </div>
      </Shell>
    );
  }

  if (students.length === 0) {
    return (
      <Shell subtitle={t("instructor.atRisk.noneSubtitle", { defaultValue: "No at-risk students right now." })}>
        <p className="py-6 text-center text-sm font-medium text-foreground/50">
          {t("instructor.atRisk.allOnTrack", { defaultValue: "All students are on track." })}
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {students.map((s) => (
          <li key={s.studentId} className="p-4 bg-muted/40 rounded-2xl border border-border/60 flex flex-col items-start gap-3">
            <div className="flex items-center gap-3 w-full">
              <div className="size-10 rounded-full bg-secondary/15 text-secondary grid place-items-center font-black text-sm shrink-0">
                {initials(s.studentName || "?")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{s.studentName}</div>
                <div className="text-[11px] text-destructive font-bold uppercase tracking-wider truncate">
                  {s.riskReason}
                </div>
                <div className="text-[10px] text-foreground/40 font-medium truncate">{s.courseTitle}</div>
              </div>
            </div>
            <Link
              to="/instructor/messages"
              className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-card border-2 border-border font-bold text-xs hover:border-primary/40 cursor-pointer transition-colors"
            >
              <MessageCircle className="size-3.5" strokeWidth={2.5} />
              {t("instructor.atRisk.reachOut", { defaultValue: "Reach out" })}
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function ProtoAtRiskStudents() {
  const { t } = useTranslation();
  return (
    <Shell>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PROTO_STUDENTS.map((s) => (
          <li key={s.id} className="p-4 bg-muted/40 rounded-2xl border border-border/60 flex flex-col items-start gap-3">
            <div className="flex items-center gap-3 w-full">
              <div className="size-10 rounded-full bg-secondary/15 text-secondary grid place-items-center font-black text-sm shrink-0">
                {s.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{s.name}</div>
                <div className="text-[11px] text-destructive font-bold uppercase tracking-wider">
                  {t(s.reasonKey)}
                </div>
              </div>
            </div>
            <Link
              to="/instructor/messages"
              className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-card border-2 border-border font-bold text-xs hover:border-primary/40 cursor-pointer transition-colors"
            >
              <MessageCircle className="size-3.5" strokeWidth={2.5} />
              {t("instructor.atRisk.reach")}
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function AtRiskStudents() {
  const { context } = useAppContext();
  if (context.mode === "backend") return <BackendAtRiskStudents />;
  return <ProtoAtRiskStudents />;
}
