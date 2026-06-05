import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useGamification, XP_REWARDS, LEAGUES } from "@/lib/gamification";
import { Zap, Flame, Trophy, Award, BookOpen, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/xp")({
  head: () => ({ meta: [{ title: "QuestLMS — XP & Progress" }] }),
  component: XpPage,
});

function XpPage() {
  const { state, awardXp, recordActivity, reset } = useGamification();
  const pct = (state.xpInLevel / state.xpForNextLevel) * 100;
  const L = LEAGUES[state.league];

  return (
    <DashboardShell>
      <TopBar title="XP & Progress" subtitle="Your gamification engine in one place." showStreak={false} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={Zap} label="Total XP" value={state.xp.toLocaleString()} sub={`Level ${state.level}`} tone="primary" />
        <Stat icon={Flame} label="Streak" value={`${state.streak}d`} sub={`Longest: ${state.longestStreak}d`} tone="streak" />
        <Stat icon={Trophy} label="League" value={`${L.emoji} ${L.name}`} sub={`${state.weeklyXp.toLocaleString()} weekly XP`} tone="secondary" />
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
            <p className="text-xs font-bold text-foreground/60 mt-2">
              {state.xpForNextLevel - state.xpInLevel} XP to Level {state.level + 1}
            </p>
          </div>

          <div>
            <h3 className="font-black text-xl mb-3">Try the engine</h3>
            <p className="text-sm font-medium text-foreground/60 mb-4">These actions normally run automatically when you learn — try them here to feel the loop.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ActionBtn label="Complete lesson" amount={XP_REWARDS.lessonComplete}
                onClick={() => { recordActivity(); awardXp("lessonComplete", "Lesson completed"); }} />
              <ActionBtn label="Finish quiz" amount={XP_REWARDS.quizComplete}
                onClick={() => { recordActivity(); awardXp("quizComplete", "Quiz finished"); }} />
              <ActionBtn label="Perfect quiz" amount={XP_REWARDS.quizPerfect} tone="primary"
                onClick={() => { recordActivity(); awardXp("quizPerfect", "Quiz · 100%"); }} />
              <ActionBtn label="Daily check-in" amount={XP_REWARDS.dailyLogin}
                onClick={() => { recordActivity(); awardXp("dailyLogin", "Daily check-in"); }} />
              <ActionBtn label="Post in discussion" amount={XP_REWARDS.discussionPost}
                onClick={() => { recordActivity(); awardXp("discussionPost", "Discussion post"); }} />
              <ActionBtn label="Submit assignment" amount={XP_REWARDS.assignmentSubmit}
                onClick={() => { recordActivity(); awardXp("assignmentSubmit", "Assignment submitted"); }} />
            </div>
            <button onClick={reset}
              className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted hover:bg-foreground/10 font-bold text-xs transition-colors">
              <RotateCcw className="size-3.5" /> Reset progress
            </button>
          </div>

          <div>
            <h3 className="font-black text-xl mb-3">Skill mastery</h3>
            <ul className="space-y-3">
              {state.skills.map((s) => {
                const p = Math.round((s.xp / s.max) * 100);
                return (
                  <li key={s.id}>
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>{s.name}</span>
                      <span className="font-mono text-xs text-foreground/60">{s.xp}/{s.max}</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden border-2 border-border">
                      <div className={`h-full ${p >= 80 ? "bg-primary" : p >= 50 ? "bg-secondary" : "bg-accent"}`} style={{ width: `${p}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow h-fit">
          <h3 className="font-black text-xl flex items-center gap-2 mb-3">
            <BookOpen className="size-5 text-primary" strokeWidth={2.5} /> Recent XP
          </h3>
          <ul className="divide-y-2 divide-border">
            {state.history.slice(0, 12).map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-2.5">
                <span className="size-9 grid place-items-center rounded-xl bg-primary/15 text-primary font-black text-xs">+{h.amount}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{h.label}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">{relTime(h.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </DashboardShell>
  );
}

function relTime(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
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
    <button onClick={onClick}
      className={`p-3 rounded-2xl border-2 chunky-shadow text-left transition-transform hover:-translate-y-0.5 ${
        tone === "primary" ? "bg-primary text-primary-foreground border-foreground" : "bg-card border-border hover:bg-muted/50"
      }`}>
      <p className="text-[10px] font-black uppercase tracking-wider opacity-70">+{amount} XP</p>
      <p className="font-black text-sm">{label}</p>
    </button>
  );
}
