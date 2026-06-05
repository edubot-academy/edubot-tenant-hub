import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Send, Paperclip, Search } from "lucide-react";
import { useState } from "react";

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

const threads: Thread[] = [
  { id: "t1", name: "Prof. Aris", role: "Cognitive Psych", last: "Great essay! One small note on section 3…", time: "2m", unread: 2, avatar: "PA" },
  { id: "t2", name: "Dr. Nuray", role: "Calculus", last: "The extension is approved.", time: "1h", unread: 0, avatar: "DN" },
  { id: "t3", name: "Sra. Lucia", role: "Spanish", last: "Practice the past tense for Friday.", time: "Yesterday", unread: 0, avatar: "SL" },
  { id: "t4", name: "Coach Aida", role: "Wellness", last: "How did the breathing exercise go?", time: "2d", unread: 1, avatar: "CA" },
];

const initialMsgs = [
  { from: "them", body: "Hi Mia — I just finished reading your essay on memory theories.", time: "10:02" },
  { from: "me", body: "Oh thank you for taking the time! 🙏", time: "10:04" },
  { from: "them", body: "Great essay! One small note on section 3 — your treatment of Baddeley's model could go deeper on the episodic buffer.", time: "10:05" },
  { from: "them", body: "Also, your sources are excellent. Keep it up.", time: "10:05" },
];

function MessagesPage() {
  const [active, setActive] = useState("t1");
  const [msgs, setMsgs] = useState(initialMsgs);
  const [draft, setDraft] = useState("");

  const send = () => {
    if (!draft.trim()) return;
    setMsgs((m) => [...m, { from: "me", body: draft, time: "now" }]);
    setDraft("");
  };

  const current = threads.find((t) => t.id === active)!;

  return (
    <DashboardShell>
      <TopBar title="Messages" subtitle="Chat with your instructors" />

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Thread list */}
        <aside className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden flex flex-col">
          <div className="p-3 border-b-2 border-border">
            <div className="flex items-center gap-2 bg-muted rounded-xl px-3">
              <Search className="size-4 text-foreground/50" />
              <input placeholder="Search…" className="bg-transparent outline-none py-2 text-sm font-medium w-full" />
            </div>
          </div>
          <ul className="overflow-y-auto flex-1">
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setActive(t.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border flex gap-3 items-center transition-colors ${
                    active === t.id ? "bg-primary/10" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="size-10 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center font-black text-sm border-2 border-foreground">
                    {t.avatar}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-black text-sm truncate">{t.name}</span>
                      <span className="text-[10px] font-bold text-foreground/50">{t.time}</span>
                    </span>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-foreground/50">{t.role}</span>
                    <span className="block text-xs font-medium text-foreground/70 truncate mt-0.5">{t.last}</span>
                  </span>
                  {t.unread > 0 && (
                    <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black grid place-items-center shrink-0">
                      {t.unread}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Conversation */}
        <section className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden flex flex-col">
          <header className="px-5 py-4 border-b-2 border-border flex items-center gap-3">
            <span className="size-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center font-black text-sm border-2 border-foreground">
              {current.avatar}
            </span>
            <div>
              <p className="font-black">{current.name}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{current.role}</p>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl border-2 text-sm font-medium ${
                    m.from === "me"
                      ? "bg-primary text-primary-foreground border-foreground rounded-br-sm"
                      : "bg-muted border-border rounded-bl-sm"
                  }`}
                >
                  {m.body}
                  <span className={`block text-[10px] font-bold mt-1 ${m.from === "me" ? "text-primary-foreground/70" : "text-foreground/50"}`}>
                    {m.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="p-3 border-t-2 border-border flex items-center gap-2"
          >
            <button type="button" className="size-10 grid place-items-center rounded-xl bg-muted">
              <Paperclip className="size-4" />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 bg-muted rounded-xl px-4 py-2.5 outline-none text-sm font-medium"
            />
            <button type="submit" className="size-10 grid place-items-center rounded-xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow">
              <Send className="size-4" strokeWidth={2.5} />
            </button>
          </form>
        </section>
      </div>
    </DashboardShell>
  );
}
