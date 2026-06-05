import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { User, Lock, Globe, Palette, Bell, Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "QuestLMS — Settings" }] }),
  component: SettingsPage,
});

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "language", label: "Language", icon: Globe },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

function SettingsPage() {
  const { i18n } = useTranslation();
  const [tab, setTab] = useState<(typeof sections)[number]["id"]>("profile");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [prefs, setPrefs] = useState({
    emailDigest: true,
    pushAnnouncements: true,
    pushGrades: true,
    pushMessages: false,
    marketing: false,
  });

  return (
    <DashboardShell>
      <TopBar title="Settings" subtitle="Manage your account and preferences" />

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
          {tab === "profile" && (
            <>
              <Header title="Profile" desc="How others see you across QuestLMS." />
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center text-3xl font-black border-4 border-foreground chunky-shadow">MC</div>
                <div className="space-y-2">
                  <button className="px-3 py-1.5 rounded-xl bg-foreground text-background font-bold text-xs">Upload new</button>
                  <button className="px-3 py-1.5 rounded-xl bg-muted font-bold text-xs">Remove</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full name" defaultValue="Mia Chen" />
                <Field label="Display name" defaultValue="Mia" />
                <Field label="Email" defaultValue="mia@questlms.example" type="email" />
                <Field label="Phone" defaultValue="+44 7700 900123" />
              </div>
              <Field label="Bio" textarea defaultValue="Year 11 student. Curious about cognitive science and chess." />
              <SaveBar />
            </>
          )}

          {tab === "security" && (
            <>
              <Header title="Security" desc="Keep your account safe." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Current password" type="password" placeholder="••••••••" />
                <div />
                <Field label="New password" type="password" placeholder="At least 12 characters" />
                <Field label="Confirm new password" type="password" />
              </div>
              <div className="p-4 rounded-2xl border-2 border-border bg-muted/30 flex items-center justify-between gap-3">
                <div>
                  <p className="font-black">Two-factor authentication</p>
                  <p className="text-sm text-foreground/60 font-medium">Add an extra step at sign-in.</p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow">Enable</button>
              </div>
              <div className="p-4 rounded-2xl border-2 border-border">
                <p className="font-black mb-2">Active sessions</p>
                <ul className="text-sm space-y-2 font-medium">
                  <li className="flex justify-between"><span>MacBook Pro · Chrome · London</span><span className="text-primary font-bold">This device</span></li>
                  <li className="flex justify-between"><span>iPhone · Safari · London</span><button className="text-destructive font-bold">Sign out</button></li>
                </ul>
              </div>
              <SaveBar />
            </>
          )}

          {tab === "language" && (
            <>
              <Header title="Language & region" desc="Choose how dates, numbers and the interface appear." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Interface language" value={i18n.language} onChange={(v) => i18n.changeLanguage(v)}
                  options={[["en", "English"], ["es", "Español"], ["fr", "Français"], ["ar", "العربية"], ["zh", "中文"]]} />
                <Select label="Time zone" options={[["Europe/London", "London (GMT+1)"], ["America/New_York", "New York"], ["Asia/Tokyo", "Tokyo"]]} />
                <Select label="Date format" options={[["dmy", "DD/MM/YYYY"], ["mdy", "MM/DD/YYYY"], ["iso", "YYYY-MM-DD"]]} />
                <Select label="Week starts on" options={[["mon", "Monday"], ["sun", "Sunday"]]} />
              </div>
              <SaveBar />
            </>
          )}

          {tab === "appearance" && (
            <>
              <Header title="Appearance" desc="Make QuestLMS yours." />
              <div>
                <p className="font-black text-sm mb-2">Theme</p>
                <div className="grid grid-cols-3 gap-3">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <button key={t} onClick={() => setTheme(t)}
                      className={`p-4 rounded-2xl border-4 ${theme === t ? "border-primary" : "border-border"} bg-card chunky-shadow text-center`}>
                      <div className={`h-16 rounded-xl mb-2 border-2 border-border ${t === "light" ? "bg-white" : t === "dark" ? "bg-zinc-900" : "bg-gradient-to-r from-white to-zinc-900"}`} />
                      <p className="font-black capitalize text-sm">{t}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-black text-sm mb-2">Density</p>
                <div className="flex gap-2">
                  {["Comfortable", "Cozy", "Compact"].map((d, i) => (
                    <button key={d} className={`px-4 py-2 rounded-xl border-2 font-bold text-sm ${i === 0 ? "border-primary bg-primary/10" : "border-border"}`}>{d}</button>
                  ))}
                </div>
              </div>
              <SaveBar />
            </>
          )}

          {tab === "notifications" && (
            <>
              <Header title="Notifications" desc="Pick how and when QuestLMS reaches you." />
              <ul className="divide-y-2 divide-border">
                {([
                  ["emailDigest", "Daily email digest", "A morning summary of what's new."],
                  ["pushAnnouncements", "Announcements", "Class & school-wide announcements."],
                  ["pushGrades", "Grades & feedback", "When a teacher releases a grade."],
                  ["pushMessages", "Direct messages", "When someone messages you 1:1."],
                  ["marketing", "Product updates", "Occasional product news from QuestLMS."],
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
              <SaveBar />
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

function Field({ label, textarea, ...props }: { label: string; textarea?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-xs font-black uppercase tracking-wider text-foreground/60 mb-1.5">{label}</span>
      {textarea
        ? <textarea defaultValue={props.defaultValue as string} rows={3}
            className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary resize-none" />
        : <input {...props} className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary" />}
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

function SaveBar() {
  return (
    <div className="flex justify-end gap-2 pt-2 border-t-2 border-border">
      <button className="px-4 py-2 rounded-xl bg-muted font-bold text-sm">Cancel</button>
      <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow">
        <Save className="size-4" /> Save changes
      </button>
    </div>
  );
}
