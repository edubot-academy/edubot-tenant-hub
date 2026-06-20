import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useStartAssessmentAttempt, type StudentGoal } from "@/lib/assessment-api";
import { Home, BookOpen, FileText, Briefcase, GraduationCap } from "lucide-react";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/student/assessment/start")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("assessment.goals.title")}` }] }),
  component: AssessmentGoalPage,
});

// ─── Goal config ──────────────────────────────────────────────────────────────

const GOALS: { key: StudentGoal; Icon: React.ElementType }[] = [
  { key: "daily_life",     Icon: Home },
  { key: "study_abroad",   Icon: GraduationCap },
  { key: "ielts_toefl",   Icon: FileText },
  { key: "work_career",    Icon: Briefcase },
  { key: "school_support", Icon: BookOpen },
];

// ─── Goal card ────────────────────────────────────────────────────────────────

function GoalCard({
  goalKey,
  Icon,
  label,
  desc,
  selected,
  onSelect,
}: {
  goalKey: StudentGoal;
  Icon: React.ElementType;
  label: string;
  desc: string;
  selected: boolean;
  onSelect: (key: StudentGoal) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(goalKey)}
      aria-pressed={selected}
      className={[
        "w-full text-left p-5 rounded-2xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer",
        "hover:border-foreground/20 hover:chunky-shadow",
        selected
          ? "border-primary bg-primary/5 chunky-shadow"
          : "border-border bg-card",
      ].join(" ")}
    >
      <span className={`inline-flex items-center justify-center size-11 rounded-xl mb-4 ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/60"}`}>
        <Icon className="size-5" />
      </span>
      <p className="font-black text-base leading-snug">{label}</p>
      <p className="text-sm text-foreground/55 mt-1 leading-relaxed">{desc}</p>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AssessmentGoalPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<StudentGoal | null>(null);
  const startMutation = useStartAssessmentAttempt();

  const handleContinue = async () => {
    if (!selected || startMutation.isPending) return;
    try {
      const attempt = await startMutation.mutateAsync(selected);
      navigate({ to: "/student/assessment/attempt/$attemptId", params: { attemptId: String(attempt.id) } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("assessment.test.startError"));
    }
  };

  return (
    <DashboardShell>
      <TopBar
        title={t("assessment.goals.title")}
        subtitle={t("assessment.goals.subtitle")}
        showStreak={false}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-2xl">
        {GOALS.map(({ key, Icon }) => (
          <GoalCard
            key={key}
            goalKey={key}
            Icon={Icon}
            label={t(`assessment.goals.${key}.label`)}
            desc={t(`assessment.goals.${key}.desc`)}
            selected={selected === key}
            onSelect={setSelected}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!selected || startMutation.isPending}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-base chunky-shadow hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {startMutation.isPending ? t("assessment.test.starting") : t("assessment.goals.continueBtn")}
        {!startMutation.isPending && <span aria-hidden>→</span>}
      </button>
    </DashboardShell>
  );
}
