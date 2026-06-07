import { createFileRoute } from "@tanstack/react-router";
import { Award, Lock, Sparkles } from "lucide-react";
import { useState } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { BADGES, useGamification, type Badge } from "@/lib/gamification";
import { useStudentProfile } from "@/lib/profile/student-profile-api";

export const Route = createFileRoute("/badges")({
  head: () => ({ meta: [{ title: "QuestLMS — Badges & Achievements" }] }),
  component: BadgesPage,
});

const cats: { id: Badge["category"] | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "milestone", label: "Milestones" },
  { id: "streak", label: "Streaks" },
  { id: "mastery", label: "Mastery" },
  { id: "social", label: "Social" },
];

function BadgesPage() {
  const { context } = useAppContext();
  const { state } = useGamification();
  const [cat, setCat] = useState<Badge["category"] | "all">("all");
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const profileQuery = useStudentProfile();

  const filtered = BADGES.filter((badge) => cat === "all" || badge.category === cat);

  if (backendEnabled) {
    const profile = profileQuery.data;
    const unlockedCount = profile?.gamification.badges ?? 0;

    return (
      <DashboardShell>
        <TopBar title="Badges & Achievements" subtitle={`${unlockedCount} earned`} />

        {profileQuery.isLoading ? (
          <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
            Loading earned badges…
          </section>
        ) : profileQuery.isError || !profile ? (
          <section className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6 text-sm font-medium text-destructive">
            Failed to load earned badges.
          </section>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Stat label="Earned" value={String(unlockedCount)} sub="backend tracked" />
              <Stat label="XP" value={profile.gamification.xp.toLocaleString()} sub="total" />
              <Stat label="Streak" value={`${profile.gamification.streak}d`} sub="current" />
              <Stat label="Skills" value={String(profile.skills.length)} sub="tracked" />
            </div>

            <section className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
              <h3 className="mb-3 text-xl font-black">Backend badge state is summary-only</h3>
              <p className="text-sm font-medium text-foreground/65">
                The current backend exposes badge totals through the student profile summary, but it does not yet expose the underlying earned-badge list or achievement definitions. This page therefore shows the real earned count without pretending to know which specific badge cards are unlocked.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filtered.map((badge, index) => {
                  const unlocked = index < unlockedCount;
                  return (
                    <article key={badge.id} className={`relative aspect-square rounded-3xl border-2 chunky-shadow p-4 flex flex-col items-center justify-center text-center ${unlocked ? "bg-gradient-to-br from-primary/20 via-card to-secondary/20 border-primary" : "bg-card border-border opacity-70"}`}>
                      <div className={`text-5xl mb-2 ${unlocked ? "" : "grayscale opacity-40"}`}>{badge.emoji}</div>
                      <p className="font-black text-sm leading-tight">{badge.name}</p>
                      <p className="text-[10px] font-medium text-foreground/60 mt-1 line-clamp-2">{badge.description}</p>
                      {unlocked ? (
                        <div className="absolute top-2 right-2 size-6 grid place-items-center rounded-full bg-primary text-primary-foreground border-2 border-foreground">
                          <Sparkles className="size-3" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 size-6 grid place-items-center rounded-full bg-background border-2 border-border">
                          <Lock className="size-3" strokeWidth={3} />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </DashboardShell>
    );
  }

  const unlockedCount = state.unlocked.length;

  return (
    <DashboardShell>
      <TopBar title="Badges & Achievements" subtitle={`${unlockedCount} of ${BADGES.length} unlocked`} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Unlocked", value: unlockedCount, sub: `of ${BADGES.length}` },
          { label: "Rarest", value: "💎", sub: "Diamond club" },
          { label: "Closest", value: "🏔️", sub: `${30 - state.streak} days to Unstoppable` },
          { label: "Recent", value: "⚡", sub: "Week warrior" },
        ].map((item) => (
          <Stat key={item.label} label={item.label} value={String(item.value)} sub={item.sub} />
        ))}
      </div>

      <div className="flex bg-card border-2 border-border rounded-2xl p-1 chunky-shadow mb-5 overflow-x-auto">
        {cats.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${cat === c.id ? "bg-foreground text-background" : "text-foreground/60"}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((badge) => {
          const unlocked = state.unlocked.includes(badge.id);
          return (
            <article key={badge.id} className={`relative aspect-square rounded-3xl border-2 chunky-shadow p-4 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 ${unlocked ? "bg-gradient-to-br from-primary/20 via-card to-secondary/20 border-primary" : "bg-card border-border opacity-70"}`}>
              <div className={`text-5xl mb-2 ${unlocked ? "" : "grayscale opacity-40"}`}>{badge.emoji}</div>
              <p className="font-black text-sm leading-tight">{badge.name}</p>
              <p className="text-[10px] font-medium text-foreground/60 mt-1 line-clamp-2">{badge.description}</p>
              {!unlocked ? (
                <div className="absolute top-2 right-2 size-6 grid place-items-center rounded-full bg-background border-2 border-border">
                  <Lock className="size-3" strokeWidth={3} />
                </div>
              ) : (
                <div className="absolute top-2 right-2 size-6 grid place-items-center rounded-full bg-primary text-primary-foreground border-2 border-foreground">
                  <Sparkles className="size-3" strokeWidth={3} />
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="text-center mt-8 text-xs font-bold text-foreground/50 inline-flex items-center gap-2 w-full justify-center">
        <Award className="size-4" /> Keep learning — new badges unlock automatically.
      </p>
    </DashboardShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
      <p className="text-xs font-black uppercase tracking-wider text-foreground/60">{label}</p>
      <p className="text-3xl font-black mt-1">{value}</p>
      <p className="text-xs font-bold text-foreground/50 mt-1">{sub}</p>
    </div>
  );
}
