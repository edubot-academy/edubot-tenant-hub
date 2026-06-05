import { Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import profAvatar from "@/assets/avatar-prof.jpg";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";

interface TopBarProps {
  title?: string;
  subtitle?: string;
  showStreak?: boolean;
}

export function TopBar({ title, subtitle, showStreak = true }: TopBarProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("topbar.greetingMorning", { name: "Prof. Aris" });
  const resolvedSubtitle = subtitle ?? t("topbar.subtitle");

  return (
    <header className="flex items-start sm:items-center justify-between mb-8 lg:mb-10 gap-4 flex-wrap animate-bounce-in">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-1 truncate">
          {resolvedTitle} <span aria-hidden>👋</span>
        </h1>
        <p className="text-foreground/50 font-medium text-sm sm:text-base">{resolvedSubtitle}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeSwitcher />
        <LanguageSwitcher />

        {showStreak && (
          <>
            <div className="hidden sm:block h-10 w-px bg-border" />

            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <Flame className="size-5 lg:size-6 text-streak fill-streak" strokeWidth={2} />
                <span className="text-streak font-black text-xl lg:text-2xl">12</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                {t("topbar.dayStreak")}
              </span>
            </div>

            <div className="hidden xl:flex items-center gap-3 bg-card p-2 pr-5 rounded-2xl border border-border chunky-shadow">
              <img
                src={profAvatar}
                alt="Prof. Aris avatar"
                width={40}
                height={40}
                className="size-10 rounded-xl object-cover bg-muted"
              />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-primary tracking-wider">
                  {t("topbar.diamondLeague")}
                </span>
                <span className="text-sm font-bold font-mono">
                  {t("topbar.xp", { value: "4,280" })}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
