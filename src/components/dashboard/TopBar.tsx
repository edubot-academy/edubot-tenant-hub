import { Flame, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import profAvatar from "@/assets/avatar-prof.jpg";
import "@/lib/overview/overview-i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useGamification, LEAGUES } from "@/lib/gamification";
import { useAppContext } from "@/lib/app-context";
import { useRole } from "@/lib/roles";
import type { Role } from "@/lib/roles";

interface TopBarProps {
  title?: string;
  subtitle?: string;
  showStreak?: boolean;
}

const ROLE_SUBTITLE_KEYS: Record<Role, string> = {
  instructor: "topbar.subtitleInstructor",
  student: "topbar.subtitleStudent",
  company_admin: "topbar.subtitleAdmin",
  owner: "topbar.subtitleAdmin",
  parent: "topbar.subtitleParent",
  assistant: "topbar.subtitleAssistant",
};

const PROTO_NAME_KEYS: Record<Role, string> = {
  instructor: "topbar.prototypeName.instructor",
  student: "topbar.prototypeName.student",
  company_admin: "topbar.prototypeName.company_admin",
  owner: "topbar.prototypeName.owner",
  parent: "topbar.prototypeName.parent",
  assistant: "topbar.prototypeName.assistant",
};

export function TopBar({ title, subtitle, showStreak }: TopBarProps) {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const { role } = useRole();
  const { state } = useGamification();
  const L = LEAGUES[state.league];

  const isGreeting = !title;
  const name = context.user?.fullName || (context.mode === "backend" ? t("topbar.fallbackName") : t(PROTO_NAME_KEYS[role]));
  const h = new Date().getHours();
  const greetingKey = h < 12 ? "topbar.greetingMorning" : h < 17 ? "topbar.greetingAfternoon" : "topbar.greetingEvening";
  const resolvedTitle = title ?? t(greetingKey, { name });
  const resolvedSubtitle = subtitle ?? t(ROLE_SUBTITLE_KEYS[role]);
  const streakVisible = showStreak ?? (role === "student");
  const avatarSrc = context.user?.avatar || profAvatar;

  return (
    <header className="flex items-start sm:items-center justify-between mb-8 lg:mb-10 gap-4 flex-wrap animate-bounce-in">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-1 truncate">
          {resolvedTitle}{isGreeting && <> <span aria-hidden>👋</span></>}
        </h1>
        <p className="text-foreground/50 font-medium text-sm sm:text-base">{resolvedSubtitle}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          className="hidden md:flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-3 py-2 text-foreground/40 transition-colors hover:bg-muted hover:text-foreground/60 min-w-[140px] lg:min-w-[200px]"
          aria-label={t("topbar.search")}
        >
          <Search className="size-3.5 shrink-0" strokeWidth={2.5} />
          <span className="flex-1 text-left text-sm font-medium">{t("topbar.search")}</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-border/70 px-1 py-0.5 text-[9px] font-black text-foreground/30">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>

        <div className="flex items-center gap-1.5">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>

        {streakVisible && (
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
              <img src={avatarSrc} alt={t("topbar.avatarAlt")} width={40} height={40} className="size-10 rounded-xl object-cover bg-muted" />
              <div className="flex flex-col">
                <span className={`text-[10px] font-black tracking-wider uppercase ${L.color}`}>
                  {L.emoji} {t(`student.league.${state.league}`, { defaultValue: L.name })} {t("topbar.league")}
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
