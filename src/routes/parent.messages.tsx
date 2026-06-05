import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Send } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/parent/messages")({
  head: () => ({ meta: [{ title: "QuestLMS — Messages" }] }),
  component: ParentMessagesPage,
});

const threads = [
  { id: "t1", from: "Prof. Aris", role: "Cognitive Psychology", preview: "Great job on this week's essay — keep it up!", time: "2h", unread: true },
  { id: "t2", from: "Ms. Tunjarova", role: "Org. Chemistry II", preview: "Reminder: Lab kit needed for Thursday session.", time: "Yesterday", unread: true },
  { id: "t3", from: "Principal's office", role: "Admin", preview: "Parent-teacher meeting scheduled for next Friday.", time: "2d", unread: false },
  { id: "t4", from: "Mr. Bekov", role: "Math Tutoring", preview: "Bekzat is making real progress on fractions.", time: "1w", unread: false },
];

function ParentMessagesPage() {
  const [active, setActive] = useState(threads[0].id);
  const [reply, setReply] = useState("");
  const current = threads.find((t) => t.id === active)!;

  return (
    <DashboardShell>
      <TopBar title="Messages" subtitle="Conversations with teachers and the school." showStreak={false} />

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[480px]">
        <aside className="col-span-12 md:col-span-4 bg-card border-2 border-border rounded-3xl p-2 chunky-shadow overflow-y-auto">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`w-full text-left p-3 rounded-2xl transition-colors ${
                active === t.id ? "bg-primary/10" : "hover:bg-muted/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-black text-sm truncate">{t.from}</p>
                <span className="text-[10px] text-foreground/40 font-bold shrink-0">{t.time}</span>
              </div>
              <p className="text-xs text-foreground/55 font-medium truncate">{t.role}</p>
              <p className="text-xs mt-1 truncate font-medium">{t.preview}</p>
              {t.unread && <span className="inline-block mt-1.5 size-2 rounded-full bg-primary" />}
            </button>
          ))}
        </aside>

        <section className="col-span-12 md:col-span-8 bg-card border-2 border-border rounded-3xl chunky-shadow flex flex-col">
          <header className="p-5 border-b border-border">
            <h3 className="font-black text-lg">{current.from}</h3>
            <p className="text-xs text-foreground/55 font-medium">{current.role}</p>
          </header>
          <div className="flex-1 p-5 space-y-3 overflow-y-auto">
            <Bubble side="them">{current.preview}</Bubble>
            <Bubble side="me">Thank you for the update!</Bubble>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setReply("");
            }}
            className="p-3 border-t border-border flex items-center gap-2"
          >
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type a reply…"
              className="flex-1 p-3 bg-muted rounded-2xl text-sm font-medium outline-none"
            />
            <button className="size-11 grid place-items-center rounded-2xl bg-primary text-primary-foreground hover:opacity-90">
              <Send className="size-4" strokeWidth={2.5} />
            </button>
          </form>
        </section>
      </div>
    </DashboardShell>
  );
}

function Bubble({ side, children }: { side: "me" | "them"; children: React.ReactNode }) {
  return (
    <div className={`flex ${side === "me" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] p-3 rounded-2xl text-sm font-medium ${
          side === "me" ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
