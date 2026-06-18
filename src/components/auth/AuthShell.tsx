import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Globe, KeyRound, ShieldCheck, Sparkles, UserRoundPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useActiveTenant } from "@/lib/app-context";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";

interface AuthShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  eyebrow?: ReactNode;
  tone?: "signin" | "recovery" | "invite" | "activate";
  lockViewport?: boolean;
}

const toneStyles = {
  signin: {
    surface: "from-primary/18 via-primary/6 to-transparent",
    badge: "bg-primary/12 text-primary border-primary/20",
  },
  recovery: {
    surface: "from-secondary/18 via-secondary/6 to-transparent",
    badge: "bg-secondary/12 text-secondary border-secondary/20",
  },
  invite: {
    surface: "from-accent/18 via-accent/6 to-transparent",
    badge: "bg-accent/12 text-accent border-accent/20",
  },
  activate: {
    surface: "from-foreground/10 via-primary/8 to-transparent",
    badge: "bg-foreground/6 text-foreground border-foreground/10",
  },
} as const;

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  eyebrow,
  tone = "signin",
  lockViewport = false,
}: AuthShellProps) {
  const { t } = useTranslation();
  const tenant = useActiveTenant();
  const logoText = tenant.logoText || tenant.name.slice(0, 2).toUpperCase();
  const currentTone = toneStyles[tone];

  const highlights = [
    {
      icon: ShieldCheck,
      label: t("auth.workspace.secureAccess", { defaultValue: "Secure workspace access" }),
      detail: t("auth.workspace.tenantReady", { defaultValue: "Tenant-ready" }),
    },
    {
      icon: UserRoundPlus,
      label: t("auth.workspace.roles", { defaultValue: "Role-based permissions" }),
      detail: tenant.role.replace(/_/g, " "),
    },
    {
      icon: Globe,
      label: t("auth.workspace.localized", { defaultValue: "KY/RU/EN localization" }),
      detail: t("auth.workspace.languageHint", { defaultValue: "The interface follows your tenant language preference." }),
    },
  ];

  return (
    <div className={lockViewport ? "relative h-dvh overflow-hidden bg-background" : "relative min-h-dvh overflow-x-hidden bg-background"}>
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b ${currentTone.surface}`} />
      <div className="pointer-events-none absolute -left-24 top-16 size-64 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 size-72 rounded-full bg-secondary/10 blur-3xl" />

      <div className={lockViewport ? "relative mx-auto flex h-full w-full max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6" : "relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8"}>
        <div className="mb-5 hidden items-start justify-between gap-6 lg:flex">
          <Link to="/" className="inline-flex items-center gap-4">
            <div
              className="grid size-16 overflow-hidden rounded-2xl place-items-center text-2xl font-black italic text-white shadow-[0_18px_36px_-18px_rgba(15,23,42,0.45)]"
              style={{ background: `linear-gradient(160deg, ${tenant.secondaryColor} 0%, ${tenant.brandColor} 100%)` }}
              aria-hidden
            >
              {tenant.logoUrl ? (
                <img
                  src={tenant.logoUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                logoText
              )}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-foreground/45">
                {eyebrow ?? t("auth.workspace.secureAccess", { defaultValue: "Secure workspace access" })}
              </p>
              <p className="text-3xl font-black tracking-tight text-foreground">
                {tenant.name}
              </p>
            </div>
          </Link>

          <LanguageSwitcher className="rounded-2xl border-border/70 bg-card/90 px-3.5 py-2.5 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.3)] backdrop-blur" />
        </div>

        <div className={lockViewport ? "grid min-h-0 flex-1 items-start gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(400px,1fr)] lg:items-stretch lg:gap-8" : "grid flex-1 items-start gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(400px,1fr)] lg:gap-8"}>
          <section className={lockViewport ? "hidden h-full lg:block" : "hidden lg:block"}>
            <div className={lockViewport ? "flex h-full max-w-lg flex-col" : "flex max-w-lg flex-col"}>
              <div className={lockViewport ? "flex h-full flex-1 flex-col rounded-[2rem] border border-border/70 bg-card/75 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur" : "flex flex-col rounded-[2rem] border border-border/70 bg-card/75 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur"}>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] ${currentTone.badge}`}>
                  <Sparkles className="size-3.5" strokeWidth={2.4} />
                  {eyebrow ?? title}
                </div>

                <p className="mt-4 text-sm leading-6 text-foreground/66">
                  {t("auth.workspace.languageHint", {
                    defaultValue: "The interface follows your tenant language preference.",
                  })}
                </p>

                <div className={lockViewport ? "mt-5 grid flex-1 content-start gap-3" : "mt-5 grid content-start gap-3"}>
                  {highlights.map(({ icon: Icon, label, detail }) => (
                    <div
                      key={label}
                      className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3.5"
                    >
                      <div className="mt-0.5 rounded-xl bg-muted p-2 text-foreground/70">
                        <Icon className="size-4" strokeWidth={2.4} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">{label}</p>
                        <p className="mt-1 text-sm text-foreground/58">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={lockViewport ? "h-full w-full max-w-xl lg:ml-auto" : "w-full max-w-xl lg:ml-auto"}>
            <div className={lockViewport ? "flex h-full flex-col rounded-[2rem] border border-border/70 bg-card/92 p-5 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur sm:p-6 lg:p-7" : "flex flex-col rounded-[2rem] border border-border/70 bg-card/92 p-5 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur sm:p-6 lg:p-7"}>
              <div className="mb-5 flex items-start justify-between gap-3 lg:hidden">
                <Link to="/" className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className="grid size-12 shrink-0 overflow-hidden rounded-2xl place-items-center text-lg font-black italic text-white shadow-[0_18px_36px_-20px_rgba(15,23,42,0.45)]"
                    style={{ background: `linear-gradient(160deg, ${tenant.secondaryColor} 0%, ${tenant.brandColor} 100%)` }}
                    aria-hidden
                  >
                    {tenant.logoUrl ? (
                      <img
                        src={tenant.logoUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      logoText
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black tracking-tight text-foreground">
                      {tenant.name}
                    </p>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/42">
                      {eyebrow ?? t("auth.workspace.secureAccess", { defaultValue: "Secure workspace access" })}
                    </p>
                  </div>
                </Link>
                <LanguageSwitcher className="rounded-2xl border-border/70 bg-card/90 px-3 py-2 shadow-[0_12px_26px_-20px_rgba(15,23,42,0.3)]" />
              </div>

              <div className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] sm:tracking-[0.22em] ${currentTone.badge}`}>
                <KeyRound className="size-3.5" strokeWidth={2.4} />
                <span className="truncate">{eyebrow ?? title}</span>
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem]">
                {title}
              </h1>
              {subtitle && (
                <div className="mt-2 text-sm leading-6 text-foreground/66 sm:text-base">
                  {subtitle}
                </div>
              )}
              <div className="mt-6 flex flex-col gap-4">{children}</div>
              {footer && (
                <div className="mt-6 border-t border-border/70 pt-4 text-center text-sm leading-6 text-foreground/60">
                  {footer}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
