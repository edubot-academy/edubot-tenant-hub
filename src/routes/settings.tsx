import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { User, Lock, Globe, Palette, Bell, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ApiError, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { LANG_STORAGE_KEY } from "@/lib/i18n";
import {
  TIMEZONE_STORAGE_KEY,
  useMyProfile,
  useUpdateMyPreferences,
  useUpdateMyProfile,
} from "@/lib/profile/profile-api";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "EduBot Learning — Settings" }] }),
  component: SettingsPage,
});

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "language", label: "Language", icon: Globe },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

function normalizeLanguage(value?: string | null): "ky" | "ru" | "en" {
  return value === "ru" || value === "en" || value === "ky" ? value : "ky";
}

function SettingsPage() {
  const { i18n, t } = useTranslation();
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const [tab, setTab] = useState<(typeof sections)[number]["id"]>("profile");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const { data: profile, isLoading, isError } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const updatePreferences = useUpdateMyPreferences();
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    title: "",
    email: "",
    phoneNumber: "",
    bio: "",
  });
  const [languageForm, setLanguageForm] = useState({
    locale: "ky" as "ky" | "ru" | "en",
    timezone: "Asia/Bishkek",
  });
  const [prefs, setPrefs] = useState({
    emailDigest: true,
    announcements: true,
    grades: true,
    messages: false,
    marketing: false,
    notifyByEmail: true,
    notifyByWhatsApp: false,
    notifyByTelegram: false,
    notifyForPayments: true,
  });

  // Tracks whether we have already seeded the form from backend data.
  // Prevents background refetches from overwriting in-progress user edits.
  const profileSeededRef = useRef(false);

  useEffect(() => {
    if (!backendEnabled) {
      profileSeededRef.current = false;
      setProfileForm({
        fullName: context.user?.fullName ?? t("settingsPage.prototype.fullName"),
        title: t("settingsPage.prototype.title"),
        email: context.user?.email ?? t("settingsPage.prototype.email"),
        phoneNumber: "",
        bio: "",
      });
      setLanguageForm({
        locale: i18n.language === "ru" || i18n.language === "en" ? i18n.language : "ky",
        timezone: "Asia/Bishkek",
      });
      return;
    }
    if (!profile || profileSeededRef.current) return;
    profileSeededRef.current = true;
    setProfileForm({
      fullName: profile.fullName ?? "",
      title: profile.title ?? "",
      email: profile.email ?? "",
      phoneNumber: profile.phoneNumber ?? "",
      bio: profile.bio ?? "",
    });
    const storedLanguage =
      typeof window !== "undefined" ? localStorage.getItem(LANG_STORAGE_KEY) : null;
    setLanguageForm({
      locale: normalizeLanguage(storedLanguage ?? i18n.language ?? profile.locale),
      timezone:
        (typeof window !== "undefined" ? localStorage.getItem(TIMEZONE_STORAGE_KEY) : null) ??
        profile.timezone ??
        "Asia/Bishkek",
    });
    setPrefs({
      emailDigest: profile.notificationPreferences.emailDigest,
      announcements: profile.notificationPreferences.announcements,
      grades: profile.notificationPreferences.grades,
      messages: profile.notificationPreferences.messages,
      marketing: profile.notificationPreferences.marketing,
      notifyByEmail: profile.notificationPreferences.notifyByEmail,
      notifyByWhatsApp: profile.notificationPreferences.notifyByWhatsApp,
      notifyByTelegram: profile.notificationPreferences.notifyByTelegram,
      notifyForPayments: profile.notificationPreferences.notifyForPayments,
    });
  }, [backendEnabled, context.user?.email, context.user?.fullName, i18n.language, profile, t]);

  function resetProfileForm() {
    if (!profile) return;
    setProfileForm({
      fullName: profile.fullName ?? "",
      title: profile.title ?? "",
      email: profile.email ?? "",
      phoneNumber: profile.phoneNumber ?? "",
      bio: profile.bio ?? "",
    });
  }

  function resetLanguageForm() {
    if (!profile) return;
    const storedLanguage =
      typeof window !== "undefined" ? localStorage.getItem(LANG_STORAGE_KEY) : null;
    setLanguageForm({
      locale: normalizeLanguage(storedLanguage ?? i18n.language ?? profile.locale),
      timezone:
        (typeof window !== "undefined" ? localStorage.getItem(TIMEZONE_STORAGE_KEY) : null) ??
        profile.timezone ??
        "Asia/Bishkek",
    });
  }

  function resetPrefs() {
    if (!profile) return;
    setPrefs({
      emailDigest: profile.notificationPreferences.emailDigest,
      announcements: profile.notificationPreferences.announcements,
      grades: profile.notificationPreferences.grades,
      messages: profile.notificationPreferences.messages,
      marketing: profile.notificationPreferences.marketing,
      notifyByEmail: profile.notificationPreferences.notifyByEmail,
      notifyByWhatsApp: profile.notificationPreferences.notifyByWhatsApp,
      notifyByTelegram: profile.notificationPreferences.notifyByTelegram,
      notifyForPayments: profile.notificationPreferences.notifyForPayments,
    });
  }

  async function handleProfileSave() {
    if (!backendEnabled) {
      toast.info(t("settingsPage.toast.profileRequiresBackend"));
      return;
    }
    try {
      await updateProfile.mutateAsync({
        fullName: profileForm.fullName,
        title: profileForm.title || null,
        phoneNumber: profileForm.phoneNumber || null,
        bio: profileForm.bio || null,
      });
      toast.success(t("settingsPage.toast.profileSaved"));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("settingsPage.toast.profileSaveFailed"));
    }
  }

  async function handlePreferencesSave(input: {
    notifyByEmail?: boolean;
    notifyByWhatsApp?: boolean;
    notifyByTelegram?: boolean;
    notifyForPayments?: boolean;
    locale?: "ky" | "ru" | "en";
    timezone?: string;
  }) {
    if (!backendEnabled) {
      if (input.locale) {
        await i18n.changeLanguage(input.locale);
      }
      if (input.timezone && typeof window !== "undefined") {
        localStorage.setItem(TIMEZONE_STORAGE_KEY, input.timezone);
      }
      toast.info(t("settingsPage.toast.preferencesLocalOnly"));
      return;
    }
    try {
      await updatePreferences.mutateAsync(input);
      if (input.locale) {
        await i18n.changeLanguage(input.locale);
      }
      if (input.timezone && typeof window !== "undefined") {
        localStorage.setItem(TIMEZONE_STORAGE_KEY, input.timezone);
      }
      toast.success(t("settingsPage.toast.preferencesSaved"));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("settingsPage.toast.preferencesSaveFailed"));
    }
  }

  const avatarText = (profileForm.fullName || "ED")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <DashboardShell>
      <TopBar title={t("settingsPage.title")} subtitle={t("settingsPage.subtitle")} />

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
        <aside className="bg-card border-2 border-border rounded-3xl p-3 chunky-shadow h-fit">
          <ul className="space-y-1">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.id}>
                  <button onClick={() => setTab(s.id)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-colors ${tab === s.id ? "bg-primary/15 text-primary" : "hover:bg-muted text-foreground/70"}`}>
                    <Icon className="size-4" strokeWidth={2.5} /> {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-6">
          {isLoading && <p className="text-sm font-medium text-foreground/60">{t("settingsPage.state.loading")}</p>}
          {isError && <p className="text-sm font-medium text-destructive">{t("settingsPage.state.error")}</p>}
          {tab === "profile" && (
            <>
              <Header title={t("settingsPage.tabs.profile")} desc={t("settingsPage.profile.desc")} />
              <div className="flex items-center gap-4">
                <div className="size-20 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center text-3xl font-black border-4 border-foreground chunky-shadow">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    avatarText || "ED"
                  )}
                </div>
                <div className="space-y-2">
                  <div className="px-3 py-1.5 rounded-xl bg-muted font-bold text-xs">
                    {profile?.tenantRole ?? "member"} · {profile?.tenantStatus ?? "active"}
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-muted/50 font-medium text-xs">
                    {profile?.platformRole ?? "user"}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label={t("settingsPage.profile.fields.fullName")}
                  value={profileForm.fullName}
                  onChange={(value) => setProfileForm((current) => ({ ...current, fullName: value }))}
                  disabled={isLoading}
                />
                <Field
                  label={t("settingsPage.profile.fields.title")}
                  value={profileForm.title}
                  onChange={(value) => setProfileForm((current) => ({ ...current, title: value }))}
                  disabled={isLoading}
                />
                <Field label={t("settingsPage.profile.fields.email")} value={profileForm.email} type="email" readOnly disabled />
                <Field
                  label={t("settingsPage.profile.fields.phone")}
                  value={profileForm.phoneNumber}
                  onChange={(value) => setProfileForm((current) => ({ ...current, phoneNumber: value }))}
                  disabled={isLoading}
                />
              </div>
              <Field
                label={t("settingsPage.profile.fields.bio")}
                textarea
                value={profileForm.bio}
                onChange={(value) => setProfileForm((current) => ({ ...current, bio: value }))}
                disabled={isLoading}
              />
              <SaveBar
                onSave={handleProfileSave}
                onCancel={resetProfileForm}
                disabled={isLoading || updateProfile.isPending || !profileForm.fullName.trim()}
                saving={updateProfile.isPending}
              />
            </>
          )}

          {tab === "security" && (
            <>
              <Header title={t("settingsPage.tabs.security")} desc={t("settingsPage.security.desc")} />
              <div className="p-4 rounded-2xl border-2 border-border bg-muted/20">
                <p className="font-black">{t("settingsPage.comingSoon.title")}</p>
                <p className="text-sm text-foreground/60 font-medium">{t("settingsPage.security.body")}</p>
              </div>
            </>
          )}

          {tab === "language" && (
            <>
              <Header title={t("settingsPage.tabs.language")} desc={t("settingsPage.language.desc")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label={t("settingsPage.language.fields.interfaceLanguage")}
                  value={languageForm.locale}
                  onChange={(value) => setLanguageForm((current) => ({ ...current, locale: value as "ky" | "ru" | "en" }))}
                  options={[["ky", "Кыргызча"], ["ru", "Русский"], ["en", "English"]]}
                />
                <Select
                  label={t("settingsPage.language.fields.timezone")}
                  value={languageForm.timezone}
                  onChange={(value) => setLanguageForm((current) => ({ ...current, timezone: value }))}
                  options={[
                    ["Asia/Bishkek", t("settingsPage.language.options.bishkek")],
                    ["Asia/Almaty", t("settingsPage.language.options.almaty")],
                    ["Europe/London", t("settingsPage.language.options.london")],
                    ["America/New_York", t("settingsPage.language.options.newYork")],
                  ]}
                />
              </div>
              <SaveBar
                onSave={() => handlePreferencesSave({
                  locale: languageForm.locale,
                  timezone: languageForm.timezone,
                })}
                onCancel={resetLanguageForm}
                disabled={isLoading || updatePreferences.isPending}
                saving={updatePreferences.isPending}
              />
            </>
          )}

          {tab === "appearance" && (
            <>
              <Header title={t("settingsPage.tabs.appearance")} desc={t("settingsPage.appearance.desc")} />
              <div>
                <p className="font-black text-sm mb-2">{t("settingsPage.appearance.theme")}</p>
                <div className="grid grid-cols-3 gap-3">
                  {(["light", "dark", "system"] as const).map((themeOption) => (
                    <button key={themeOption} onClick={() => setTheme(themeOption)}
                      className={`p-4 rounded-2xl border-4 ${theme === themeOption ? "border-primary" : "border-border"} bg-card chunky-shadow text-center`}>
                      <div className={`h-16 rounded-xl mb-2 border-2 border-border ${themeOption === "light" ? "bg-white" : themeOption === "dark" ? "bg-zinc-900" : "bg-gradient-to-r from-white to-zinc-900"}`} />
                      <p className="font-black capitalize text-sm">{t(`theme.${themeOption}`)}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-2xl border-2 border-border bg-muted/20">
                <p className="font-black">{t("settingsPage.comingSoon.title")}</p>
                <p className="text-sm text-foreground/60 font-medium">{t("settingsPage.appearance.body")}</p>
              </div>
            </>
          )}

          {tab === "notifications" && (
            <>
              <Header title={t("settingsPage.tabs.notifications")} desc={t("settingsPage.notifications.desc")} />
              <ul className="divide-y-2 divide-border">
                {([
                  ["notifyByEmail", t("settingsPage.notifications.items.notifyByEmail.label"), t("settingsPage.notifications.items.notifyByEmail.desc")],
                  ["notifyByWhatsApp", t("settingsPage.notifications.items.notifyByWhatsApp.label"), t("settingsPage.notifications.items.notifyByWhatsApp.desc")],
                  ["notifyByTelegram", t("settingsPage.notifications.items.notifyByTelegram.label"), t("settingsPage.notifications.items.notifyByTelegram.desc")],
                  ["notifyForPayments", t("settingsPage.notifications.items.notifyForPayments.label"), t("settingsPage.notifications.items.notifyForPayments.desc")],
                ] as const).map(([key, label, desc]) => (
                  <li key={key} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="font-black text-sm">{label}</p>
                      <p className="text-xs text-foreground/60 font-medium">{desc}</p>
                    </div>
                    <button onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                      className={`w-12 h-7 rounded-full border-2 border-foreground relative transition-colors ${prefs[key] ? "bg-primary" : "bg-muted"}`}>
                      <span className={`absolute top-0.5 size-5 rounded-full bg-background border-2 border-foreground transition-all ${prefs[key] ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </li>
                ))}
              </ul>
              <SaveBar
                onSave={() => handlePreferencesSave({
                  notifyByEmail: prefs.notifyByEmail,
                  notifyByWhatsApp: prefs.notifyByWhatsApp,
                  notifyByTelegram: prefs.notifyByTelegram,
                  notifyForPayments: prefs.notifyForPayments,
                })}
                onCancel={resetPrefs}
                disabled={isLoading || updatePreferences.isPending}
                saving={updatePreferences.isPending}
              />
            </>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function Header({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="pb-4 border-b-2 border-border">
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="text-sm text-foreground/60 font-medium">{desc}</p>
    </div>
  );
}

function Field({
  label,
  textarea,
  value,
  onChange,
  type = "text",
  disabled,
  readOnly,
  ...props
}: {
  label: string;
  textarea?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "disabled" | "readOnly">) {
  return (
    <label className="block">
      <span className="block text-xs font-black uppercase tracking-wider text-foreground/60 mb-1.5">{label}</span>
      {textarea
        ? <textarea
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            rows={3}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={props.placeholder}
            className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary resize-none disabled:opacity-60"
          />
        : <input
            {...props}
            type={type}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            disabled={disabled}
            readOnly={readOnly}
        className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary disabled:opacity-60"
          />}
    </label>
  );
}

function Select({ label, options, value, onChange }: { label: string; options: [string, string][]; value?: string; onChange?: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs font-black uppercase tracking-wider text-foreground/60 mb-1.5">{label}</span>
      <select value={value} onChange={(e) => onChange?.(e.target.value)}
        className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-bold outline-none focus:border-primary">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function SaveBar({
  onSave,
  onCancel,
  disabled,
  saving = false,
}: {
  onSave?: () => void | Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
  saving?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end gap-2 pt-2 border-t-2 border-border">
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl bg-muted font-bold text-sm">{t("actions.cancel")}</button>
      <button
        type="button"
        onClick={() => void onSave?.()}
        disabled={disabled}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow disabled:opacity-60"
      >
        <Save className="size-4" /> {saving ? t("settingsPage.actions.saving") : t("settingsPage.actions.saveChanges")}
      </button>
    </div>
  );
}
