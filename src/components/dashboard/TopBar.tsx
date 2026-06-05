import { Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import profAvatar from "@/assets/avatar-prof.jpg";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { TenantBadge } from "./TenantBadge";
import { useGamification, LEAGUES } from "@/lib/gamification";

interface TopBarProps {
  title?: string;
  subtitle?: string;
  showStreak?: boolean;
}

export function TopBar({ title, subtitle, showStreak = true }: TopBarProps) {
  const { t } = useTranslation();
  const { state } = useGamification();
  const L = LEAGUES[state.league];
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
        <TenantBadge />
        <ThemeSwitcher />
        <LanguageSwitcher />

        {showStreak && (
          <>
            <div className="hidden sm:block h-10 w-px bg-border" />

            <Link to="/xp" className="hidden sm:flex flex-col items-end hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-1.5">
                <Flame className="size-5 lg:size-6 text-streak fill-streak" strokeWidth={2} />
                <span className="text-streak font-black text-xl lg:text-2xl">{state.streak}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                {t("topbar.dayStreak")}
              </span>
            </Link>

            <Link to="/leagues" className="hidden xl:flex items-center gap-3 bg-card p-2 pr-5 rounded-2xl border border-border chunky-shadow hover:bg-muted/50 transition-colors">
              <img
                src={profAvatar}
                alt="Avatar"
                width={40}
                height={40}
                className="size-10 rounded-xl object-cover bg-muted"
              />
              <div className="flex flex-col">
                <span className={`text-[10px] font-black tracking-wider uppercase ${L.color}`}>
                  {L.emoji} {L.name} league
                </span>
                <span className="text-sm font-bold font-mono">
                  {state.xp.toLocaleString()} XP · L{state.level}
                </span>
              </div>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

