import { createFileRoute } from "@tanstack/react-router";
import { Award, BookOpen, Flame, TrendingUp, Zap } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { LEAGUES, useGamification } from "@/lib/gamification";
import { useStudentProfile } from "@/lib/profile/student-profile-api";

export const Route = createFileRoute("/xp")({
  head: () => ({ meta: [{ title: "QuestLMS — XP & Progress" }] }),
  component: XpPage,
});

function XpPage() {
  const { context } = useAppContext();
  const { state, awardXp, recordActivity, reset } = useGamification();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const profileQuery = useStudentProfile();

  if (backendEnabled) {
    const profile = profileQuery.data;
    const skills = profile?.skills ?? [];
    const maxSkillXp = Math.max(...skills.map((skill) => skill.xp), 1);

    return (
      <DashboardShell>
        <TopBar title="XP & Progress" subtitle="Your backend-tracked learning progress." showStreak={false} />

        {profileQuery.isLoading ? (
          <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
            Loading XP and progress…
          </section>
        ) : profileQuery.isError || !profile ? (
          <section className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6 text-sm font-medium text-destructive">
            Failed to load XP and progress.
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
            <section className="space-y-5 rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Stat icon={Zap} label="Total XP" value={profile.gamification.xp.toLocaleString()} sub={`${profile.gamification.lessonsCompleted} lessons completed`} tone="primary" />
                <Stat icon={Flame} label="Streak" value={`${profile.gamification.streak}d`} sub={profile.gamification.lastActivityAt ? `Last active ${formatDate(profile.gamification.lastActivityAt)}` : "No recent activity"} tone="streak" />
                <Stat icon={Award} label="Badges" value={String(profile.gamification.badges)} sub="earned" tone="accent" />
                <Stat icon={BookOpen} label="Quizzes done" value={String(profile.gamification.quizzesCompleted)} sub={`${profile.summary.averageProgressPercent}% avg progress`} tone="secondary" />
              </div>

              <div>
                <h3 className="mb-3 text-xl font-black">Skill progress</h3>
                {skills.length ? (
                  <ul className="space-y-3">
                    {skills.map((skill) => (
                      <li key={skill.id}>
                        <div className="mb-1 flex justify-between text-sm font-bold">
                          <span>{skill.name}</span>
                          <span className="font-mono text-xs text-foreground/60">{skill.xp} XP</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full border-2 border-border bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${Math.max(skill.progressPercent, Math.round((skill.xp / maxSkillXp) * 100))}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-medium text-foreground/60">No backend skill progress is available yet.</p>
                )}
              </div>
            </section>

            <aside className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow h-fit">
              <h3 className="mb-3 flex items-center gap-2 text-xl font-black">
                <TrendingUp className="size-5 text-primary" strokeWidth={2.5} /> Recent activity
              </h3>
              <ul className="divide-y-2 divide-border">
                {profile.activity.length ? profile.activity.slice(0, 12).map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary font-black text-xs">
                      {item.score != null ? item.score : "XP"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{item.title}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">{formatDate(item.date)}</p>
                    </div>
                  </li>
                )) : (
                  <li className="py-2.5 text-sm font-medium text-foreground/60">No recent backend activity yet.</li>
                )}
              </ul>
            </aside>
          </div>
        )}
      </DashboardShell>
    );
  }

  const L = LEAGUES[state.league];
  const pct = (state.xpInLevel / state.xpForNextLevel) * 100;

  return (
    <DashboardShell>
      <TopBar title="XP & Progress" subtitle="Your gamification engine in one place." showStreak={false} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={Zap} label="Total XP" value={state.xp.toLocaleString()} sub={`Level ${state.level}`} tone="primary" />
        <Stat icon={Flame} label="Streak" value={`${state.streak}d`} sub={`Longest: ${state.longestStreak}d`} tone="streak" />
        <Stat icon={TrendingUp} label="League" value={`${L.emoji} ${L.name}`} sub={`${state.weeklyXp.toLocaleString()} weekly XP`} tone="secondary" />
        <Stat icon={Award} label="Badges" value={`${state.unlocked.length}`} sub="unlocked" tone="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-xl">Level progress</h3>
              <p className="font-mono font-black text-sm">{state.xpInLevel} / {state.xpForNextLevel} XP</p>
            </div>
            <div className="h-5 bg-muted rounded-full overflow-hidden border-2 border-foreground chunky-shadow">
              <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs font-bold text-foreground/60 mt-2">{state.xpForNextLevel - state.xpInLevel} XP to Level {state.level + 1}</p>
          </div>

          <div>
            <h3 className="font-black text-xl mb-3">Try the engine</h3>
            <p className="text-sm font-medium text-foreground/60 mb-4">These actions normally run automatically when you learn — try them here to feel the loop.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ActionBtn label="Complete lesson" amount={25} onClick={() => { recordActivity(); awardXp("lessonComplete", "Lesson completed"); }} />
              <ActionBtn label="Finish quiz" amount={40} onClick={() => { recordActivity(); awardXp("quizComplete", "Quiz finished"); }} />
              <ActionBtn label="Perfect quiz" amount={65} tone="primary" onClick={() => { recordActivity(); awardXp("quizPerfect", "Quiz · 100%"); }} />
              <ActionBtn label="Daily check-in" amount={15} onClick={() => { recordActivity(); awardXp("dailyLogin", "Daily check-in"); }} />
              <ActionBtn label="Post in discussion" amount={20} onClick={() => { recordActivity(); awardXp("discussionPost", "Discussion post"); }} />
              <ActionBtn label="Submit assignment" amount={45} onClick={() => { recordActivity(); awardXp("assignmentSubmit", "Assignment submitted"); }} />
            </div>
            <button onClick={reset} className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted hover:bg-foreground/10 font-bold text-xs transition-colors">
              Reset progress
            </button>
          </div>
        </section>

        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow h-fit">
          <h3 className="font-black text-xl flex items-center gap-2 mb-3">
            <BookOpen className="size-5 text-primary" strokeWidth={2.5} /> Recent XP
          </h3>
          <ul className="divide-y-2 divide-border">
            {state.history.slice(0, 12).map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2.5">
                <span className="size-9 grid place-items-center rounded-xl bg-primary/15 text-primary font-black text-xs">+{item.amount}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{item.label}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </DashboardShell>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function Stat({ icon: Icon, label, value, sub, tone }: { icon: typeof Zap; label: string; value: string; sub: string; tone: "primary" | "secondary" | "accent" | "streak" }) {
  const map = { primary: "bg-primary/15 text-primary", secondary: "bg-secondary/20 text-secondary-foreground", accent: "bg-accent/20 text-accent-foreground", streak: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" };
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow flex items-center gap-3">
      <div className={`size-12 grid place-items-center rounded-2xl ${map[tone]}`}><Icon className="size-6" strokeWidth={2.5} /></div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wider text-foreground/60">{label}</p>
        <p className="text-xl font-black truncate">{value}</p>
        <p className="text-[10px] font-bold text-foreground/50 truncate">{sub}</p>
      </div>
    </div>
  );
}

function ActionBtn({ label, amount, onClick, tone }: { label: string; amount: number; onClick: () => void; tone?: "primary" }) {
  return (
    <button onClick={onClick} className={`p-3 rounded-2xl border-2 chunky-shadow text-left transition-transform hover:-translate-y-0.5 ${tone === "primary" ? "bg-primary text-primary-foreground border-foreground" : "bg-card border-border hover:bg-muted/50"}`}>
      <p className="text-[10px] font-black uppercase tracking-wider opacity-70">+{amount} XP</p>
      <p className="font-black text-sm">{label}</p>
    </button>
  );
}
