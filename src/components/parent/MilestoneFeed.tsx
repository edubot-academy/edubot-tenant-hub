import { useTranslation } from "react-i18next";
import { Trophy, Flame, Star, Award } from "lucide-react";

const feed = [
  { id: 1, icon: Trophy, key: "m1", when: "2d", tone: "primary" },
  { id: 2, icon: Flame, key: "m2", when: "3d", tone: "destructive" },
  { id: 3, icon: Star, key: "m3", when: "5d", tone: "secondary" },
  { id: 4, icon: Award, key: "m4", when: "1w", tone: "accent" },
] as const;

const toneStyles: Record<(typeof feed)[number]["tone"], string> = {
  primary: "bg-brand-primary-soft text-primary",
  secondary: "bg-brand-secondary-soft text-secondary",
  accent: "bg-brand-accent-soft text-accent",
  destructive: "bg-destructive/15 text-destructive",
};

export function MilestoneFeed() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-4 p-6 bg-card border-2 border-border rounded-[28px] chunky-shadow">
      <h3 className="text-xl font-black mb-5">{t("parent.milestones.title")}</h3>
      <ul className="space-y-3">
        {feed.map((m) => {
          const Icon = m.icon;
          return (
            <li key={m.id} className="flex items-start gap-3">
              <div className={`size-9 rounded-xl grid place-items-center shrink-0 ${toneStyles[m.tone]}`}>
                <Icon className="size-4" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold leading-snug">
                  {t(`parent.milestones.${m.key}`)}
                </div>
                <div className="text-xs text-foreground/55 font-medium mt-0.5">{m.when}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
