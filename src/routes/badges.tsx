import { createFileRoute } from "@tanstack/react-router";
import { Award, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { BADGES, useGamification, type Badge } from "@/lib/gamification";
import { useStudentProfile } from "@/lib/profile/student-profile-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/badges")({
  head: () => ({ meta: [{ title: i18n.t("studentPages.badgesPage.metaTitle", { appName: i18n.t("app.name") }) }] }),
  component: BadgesPage,
});

const cats: { id: Badge["category"] | "all"; labelKey: string }[] = [
  { id: "all", labelKey: "studentPages.badgesPage.filters.all" },
  { id: "milestone", labelKey: "studentPages.badgesPage.filters.milestone" },
  { id: "streak", labelKey: "studentPages.badgesPage.filters.streak" },
  { id: "mastery", labelKey: "studentPages.badgesPage.filters.mastery" },
  { id: "social", labelKey: "studentPages.badgesPage.filters.social" },
];

function BadgesPage() {
  const { t } = useTranslation();
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
        <TopBar title={t("studentPages.badgesPage.title")} subtitle={t("studentPages.badgesPage.earnedSubtitle", { count: unlockedCount })} />

        {profileQuery.isLoading ? (
          <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
            {t("studentPages.badgesPage.loading")}
          </section>
        ) : profileQuery.isError || !profile ? (
          <section className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6 text-sm font-medium text-destructive">
            {t("studentPages.badgesPage.loadFailed")}
          </section>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Stat label={t("studentPages.badgesPage.earned")} value={String(unlockedCount)} sub={t("studentPages.badgesPage.backendTracked")} />
              <Stat label="XP" value={profile.gamification.xp.toLocaleString()} sub={t("studentPages.badgesPage.xpTotal")} />
              <Stat label={t("studentPages.xp.streak")} value={t("studentPages.common.daysShort", { count: profile.gamification.streak })} sub={t("studentPages.badgesPage.current")} />
              <Stat label={t("studentPages.badgesPage.skills")} value={String(profile.skills.length)} sub={t("studentPages.badgesPage.tracked")} />
            </div>

            <section className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
              <h3 className="mb-3 text-xl font-black">{t("studentPages.badgesPage.summaryTitle")}</h3>
              <p className="text-sm font-medium text-foreground/65">
                {t("studentPages.badgesPage.summaryBody")}
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
      <TopBar title={t("studentPages.badgesPage.title")} subtitle={t("studentPages.badgesPage.unlockedSubtitle", { unlocked: unlockedCount, total: BADGES.length })} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("studentPages.badgesPage.unlocked"), value: unlockedCount, sub: t("studentPages.badgesPage.ofTotal", { total: BADGES.length }) },
          { label: t("studentPages.badgesPage.rarest"), value: "💎", sub: t("studentPages.badgesPage.diamondClub") },
          { label: t("studentPages.badgesPage.closest"), value: "🏔️", sub: t("studentPages.badgesPage.daysToUnstoppable", { count: 30 - state.streak }) },
          { label: t("studentPages.badgesPage.recent"), value: "⚡", sub: t("studentPages.badgesPage.weekWarrior") },
        ].map((item) => (
          <Stat key={item.label} label={item.label} value={String(item.value)} sub={item.sub} />
        ))}
      </div>

      <div className="flex bg-card border-2 border-border rounded-2xl p-1 chunky-shadow mb-5 overflow-x-auto">
        {cats.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${cat === c.id ? "bg-foreground text-background" : "text-foreground/60"}`}>
            {t(c.labelKey)}
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
        <Award className="size-4" /> {t("studentPages.badgesPage.keepLearning")}
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
