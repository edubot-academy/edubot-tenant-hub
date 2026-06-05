import { useTranslation } from "react-i18next";
import { Award, Lock } from "lucide-react";

interface Badge {
  id: string;
  emoji: string;
  labelKey: string;
  earned: boolean;
}

const badges: Badge[] = [
  { id: "1", emoji: "🔥", labelKey: "student.badges.marathoner", earned: true },
  { id: "2", emoji: "🧠", labelKey: "student.badges.brainiac", earned: true },
  { id: "3", emoji: "⚡", labelKey: "student.badges.speedster", earned: true },
  { id: "4", emoji: "🏆", labelKey: "student.badges.champion", earned: false },
  { id: "5", emoji: "📚", labelKey: "student.badges.scholar", earned: false },
  { id: "6", emoji: "🌟", labelKey: "student.badges.starStudent", earned: false },
];

export function AchievementsWall() {
  const { t } = useTranslation();
  const earned = badges.filter((b) => b.earned).length;
  return (
    <section className="space-y-4 animate-bounce-in" style={{ animationDelay: "600ms" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black flex items-center gap-2">
          <Award className="size-5 text-accent" strokeWidth={2.5} />
          {t("student.badges.title")}
        </h3>
        <span className="text-xs font-bold text-foreground/40 font-mono">
          {earned} / {badges.length}
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 p-2 text-center transition-all ${
              b.earned
                ? "bg-card border-accent/40 chunky-shadow hover:scale-105"
                : "bg-muted border-dashed border-border opacity-50"
            }`}
          >
            <span className="text-3xl">{b.earned ? b.emoji : <Lock className="size-5 text-foreground/40" />}</span>
            <span className="text-[10px] font-black uppercase tracking-wider leading-tight">
              {t(b.labelKey)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
