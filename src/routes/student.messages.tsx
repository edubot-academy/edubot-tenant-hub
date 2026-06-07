import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Clock, MessageSquare, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import { useStudentSupportRequests } from "@/lib/student-portal-api";

export const Route = createFileRoute("/student/messages")({
  head: () => ({ meta: [{ title: "QuestLMS — Messages" }] }),
  component: MessagesPage,
});

type Thread = {
  id: string;
  name: string;
  role: string;
  last: string;
  time: string;
  unread: number;
  avatar: string;
};

const prototypeThreads: Thread[] = [
  { id: "t1", name: "Prof. Aris", role: "Cognitive Psych", last: "Great essay! One small note on section 3…", time: "2m", unread: 2, avatar: "PA" },
  { id: "t2", name: "Dr. Nuray", role: "Calculus", last: "The extension is approved.", time: "1h", unread: 0, avatar: "DN" },
];

function MessagesPage() {
  const { context } = useAppContext();
  const supportQuery = useStudentSupportRequests();
  const [q, setQ] = useState("");

  if (context.mode !== "backend") {
    return <PrototypeMessagesPage />;
  }

  const items = useMemo(() => {
    const value = q.trim().toLowerCase();
    return (supportQuery.data ?? []).filter((item) => {
      if (!value) return true;
      return [item.category, item.message, item.ownerRole, item.status]
        .filter(Boolean)
        .some((part) => String(part).toLowerCase().includes(value));
    });
  }, [supportQuery.data, q]);

  return (
    <DashboardShell>
      <TopBar title="Messages" subtitle="Support and instructor communication status for your tenant workspace." />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-h-[500px]">
        <aside className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden flex flex-col">
          <div className="p-3 border-b-2 border-border">
            <div className="flex items-center gap-2 bg-muted rounded-xl px-3">
              <Search className="size-4 text-foreground/50" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search support requests…"
                className="bg-transparent outline-none py-2 text-sm font-medium w-full"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {supportQuery.isLoading ? (
              [0, 1, 2].map((index) => <div key={index} className="h-20 rounded-2xl bg-muted animate-pulse" />)
            ) : items.length === 0 ? (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                No support requests found.
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="rounded-2xl border-2 border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black truncate">{item.category}</p>
                    <span className="rounded-lg bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground/65">{item.message}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-foreground/50">
                    <span>{item.ownerRole}</span>
                    <span>{item.priority}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>

        <section className="bg-card border-2 border-border rounded-3xl chunky-shadow p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-primary/10 p-2 text-primary"><MessageSquare className="size-5" /></span>
            <div className="space-y-2">
              <h3 className="text-lg font-black">Direct chat is not wired yet</h3>
              <p className="text-sm font-medium text-foreground/65">
                Backend mode currently exposes support-request state, not persistent student-to-instructor chat threads. This page shows the real support inbox so the tenant frontend stays truthful until messaging contracts are implemented.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Metric label="Requests" value={String((supportQuery.data ?? []).length)} icon={<MessageSquare className="size-4" />} />
            <Metric label="Open" value={String((supportQuery.data ?? []).filter((item) => item.status === "open").length)} icon={<AlertCircle className="size-4" />} />
            <Metric label="In progress" value={String((supportQuery.data ?? []).filter((item) => item.status === "in_progress").length)} icon={<Clock className="size-4" />} />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-foreground/55">{icon}<span className="text-[10px] font-black uppercase tracking-wider">{label}</span></div>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}

function PrototypeMessagesPage() {
  return (
    <DashboardShell>
      <TopBar title="Messages" subtitle="Chat with your instructors" />
      <div className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
        Prototype mode uses local conversation threads.
      </div>
      <div className="mt-4 grid gap-3">
        {prototypeThreads.map((thread) => (
          <div key={thread.id} className="rounded-2xl border-2 border-border bg-card p-4">
            <p className="font-black">{thread.name}</p>
            <p className="text-xs text-foreground/50 font-medium">{thread.role}</p>
            <p className="mt-2 text-sm font-medium text-foreground/65">{thread.last}</p>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
