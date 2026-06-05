import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Bell, MessageSquare, BookOpen, Award, AlertCircle, CheckCheck, Settings } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "QuestLMS — Notifications" }] }),
  component: NotificationsPage,
});

type N = { id: string; kind: "message" | "course" | "badge" | "alert"; title: string; body: string; time: string; read: boolean };

const initial: N[] = [
  { id: "n1", kind: "alert", title: "Essay 4 due tomorrow", body: "Working memory case study · 1,000–1,500 words", time: "5m ago", read: false },
  { id: "n2", kind: "message", title: "Mr. Adeyemi replied", body: "Re: phonological loop question — \"Great question, the answer is…\"", time: "1h ago", read: false },
  { id: "n3", kind: "badge", title: "Badge earned: 7-day streak 🔥", body: "Keep it up — you're on a roll", time: "3h ago", read: false },
  { id: "n4", kind: "course", title: "New lesson published", body: "Cognitive Psychology · Module 3 · Capacity & chunking", time: "Yesterday", read: true },
  { id: "n5", kind: "course", title: "Quiz graded", body: "Working Memory pop quiz · 9/10", time: "Yesterday", read: true },
  { id: "n6", kind: "message", title: "Class announcement", body: "Live session tomorrow at 09:00 — bring questions", time: "2d ago", read: true },
  { id: "n7", kind: "alert", title: "Password expires in 7 days", body: "Update from Settings → Security", time: "3d ago", read: true },
];

const tabs = ["All", "Unread", "Messages", "Courses", "Alerts"] as const;

const icon = { message: MessageSquare, course: BookOpen, badge: Award, alert: AlertCircle };
const tone = {
  message: "text-secondary bg-secondary/15",
  course: "text-primary bg-primary/15",
  badge: "text-accent-foreground bg-accent/20",
  alert: "text-destructive bg-destructive/15",
} as const;

function NotificationsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [items, setItems] = useState(initial);

  const filtered = items.filter((i) => {
    if (tab === "All") return true;
    if (tab === "Unread") return !i.read;
    if (tab === "Messages") return i.kind === "message";
    if (tab === "Courses") return i.kind === "course" || i.kind === "badge";
    if (tab === "Alerts") return i.kind === "alert";
    return true;
  });

  const unread = items.filter((i) => !i.read).length;

  return (
    <DashboardShell>
      <TopBar title="Notifications" subtitle={`${unread} unread`} />

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex bg-card border-2 border-border rounded-2xl p-1 chunky-shadow overflow-x-auto">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${tab === t ? "bg-foreground text-background" : "text-foreground/60"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setItems((it) => it.map((i) => ({ ...i, read: true })))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border-2 border-border font-bold text-sm chunky-shadow">
            <CheckCheck className="size-4" /> Mark all read
          </button>
          <button className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border chunky-shadow" aria-label="settings">
            <Settings className="size-4" />
          </button>
        </div>
      </div>

      <section className="bg-card border-2 border-border rounded-3xl chunky-shadow divide-y-2 divide-border overflow-hidden">
        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <Bell className="size-10 mx-auto text-foreground/30 mb-3" />
            <p className="font-black">You're all caught up</p>
            <p className="text-sm text-foreground/60 font-medium">Nothing in this view right now.</p>
          </div>
        )}
        {filtered.map((n) => {
          const Icon = icon[n.kind];
          return (
            <div key={n.id}
              onClick={() => setItems((it) => it.map((i) => i.id === n.id ? { ...i, read: true } : i))}
              className={`flex gap-4 p-4 cursor-pointer transition-colors hover:bg-muted/40 ${!n.read ? "bg-primary/5" : ""}`}>
              <div className={`size-11 shrink-0 grid place-items-center rounded-2xl ${tone[n.kind]}`}>
                <Icon className="size-5" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-black text-sm truncate">{n.title}</p>
                  {!n.read && <span className="size-2 rounded-full bg-primary" />}
                </div>
                <p className="text-sm text-foreground/70 font-medium mt-0.5 line-clamp-2">{n.body}</p>
              </div>
              <span className="text-xs font-bold text-foreground/40 whitespace-nowrap mt-0.5">{n.time}</span>
            </div>
          );
        })}
      </section>
    </DashboardShell>
  );
}
