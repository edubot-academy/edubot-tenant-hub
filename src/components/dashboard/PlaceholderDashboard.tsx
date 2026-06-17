import { useTranslation } from "react-i18next";
import { Sparkles, type LucideIcon } from "lucide-react";
import { TopBar } from "./TopBar";

interface PlaceholderDashboardProps {
  roleKey: string;
  surfaceOps?: boolean;
  cards: { titleKey: string; descKey: string; icon: LucideIcon }[];
}

export function PlaceholderDashboard({ roleKey, surfaceOps, cards }: PlaceholderDashboardProps) {
  const { t } = useTranslation();
  const title = t("placeholder.greeting", { role: t(`roles.${roleKey}`) });
  const subtitle = t(`placeholder.subtitle.${roleKey}`, {
    defaultValue: t("placeholder.subtitle.default"),
  });

  return (
    <>
      <TopBar title={title} subtitle={subtitle} showStreak={!surfaceOps} />

      <div className="mb-8 p-6 sm:p-8 rounded-3xl border-2 border-dashed border-border bg-card/50 flex items-start gap-4">
        <div className="size-12 shrink-0 rounded-2xl bg-brand-primary-emphasis text-primary grid place-items-center">
          <Sparkles className="size-6" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-black mb-1">{t("placeholder.heroTitle")}</h2>
          <p className="text-sm text-foreground/60 font-medium leading-relaxed">
            {t("placeholder.heroBody")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {cards.map(({ titleKey, descKey, icon: Icon }) => (
          <div
            key={titleKey}
            className={
              surfaceOps
                ? "p-5 rounded-xl border border-border bg-card hover:border-brand-primary-border transition-colors"
                : "p-6 rounded-[24px] border-2 border-border bg-card chunky-shadow hover:border-brand-primary-border transition-colors"
            }
          >
            <div className="size-10 rounded-xl bg-muted text-foreground/70 grid place-items-center mb-4">
              <Icon className="size-5" strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-base mb-1">{t(titleKey)}</h3>
            <p className="text-sm text-foreground/55 font-medium leading-relaxed">{t(descKey)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
