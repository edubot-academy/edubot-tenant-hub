import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Bot, Send, Sparkles, User, Loader2, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/ai-tutor")({
  head: () => ({ meta: [{ title: "QuestLMS — AI Tutor" }] }),
  component: AiTutorPage,
});

type Msg = { id: string; role: "user" | "tutor"; text: string };

const SUGGESTIONS = [
  "Explain working memory like I'm 12",
  "Quiz me on the phonological loop",
  "Help me solve: 3x + 7 = 22",
  "Summarize the French Revolution in 5 bullets",
];

const INITIAL: Msg[] = [
  { id: "0", role: "tutor", text: "Hi! I'm your AI tutor. Ask me about any lesson, or paste a problem you're stuck on. I'll guide you step by step — not just hand over the answer." },
];

function AiTutorPage() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim() || typing) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, { id: crypto.randomUUID(), role: "tutor", text: tutorReply(text) }]);
      setTyping(false);
      inputRef.current?.focus();
    }, 800 + Math.random() * 500);
  };

  return (
    <DashboardShell>
      <TopBar title="AI Tutor" subtitle="Conversational homework help — friendly, Socratic, on your level." showStreak={false} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 h-[calc(100vh-220px)] min-h-[520px]">
        <section className="bg-card border-2 border-border rounded-3xl chunky-shadow flex flex-col overflow-hidden">
          <header className="px-5 py-4 border-b-2 border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center chunky-shadow border-2 border-foreground">
                <Bot className="size-5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-black">Quest Tutor</p>
                <p className="text-[11px] font-bold text-foreground/55 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" /> Online · powered by AI
                </p>
              </div>
            </div>
            <button onClick={() => setMessages(INITIAL)}
              className="px-3 py-1.5 rounded-xl bg-card border-2 border-border font-bold text-xs flex items-center gap-1.5 hover:bg-muted">
              <RotateCcw className="size-3.5" /> Reset
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.map(m => <Bubble key={m.id} msg={m} />)}
            {typing && (
              <div className="flex items-end gap-2">
                <div className="size-8 rounded-xl bg-primary text-primary-foreground grid place-items-center">
                  <Bot className="size-4" strokeWidth={2.5} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-muted border-2 border-border flex gap-1">
                  <Dot /><Dot delay={150} /><Dot delay={300} />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="border-t-2 border-border p-3 flex gap-2 bg-background">
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the tutor anything…"
              className="flex-1 px-4 py-3 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50" />
            <button type="submit" disabled={!input.trim() || typing}
              className="size-12 grid place-items-center rounded-xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow disabled:opacity-50">
              {typing ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" strokeWidth={2.5} />}
            </button>
          </form>
        </section>

        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow h-fit">
          <h3 className="font-black flex items-center gap-2 mb-3">
            <Sparkles className="size-4 text-primary" /> Try asking
          </h3>
          <div className="space-y-2">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="w-full text-left text-xs font-bold p-3 rounded-2xl bg-muted hover:bg-foreground/10 transition-colors">
                {s}
              </button>
            ))}
          </div>
          <div className="mt-5 p-3 rounded-2xl bg-accent/15 border-2 border-accent/30">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/55 mb-1">Tip</p>
            <p className="text-xs font-medium">Paste a quiz question or a paragraph from your textbook — the tutor will adapt.</p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`size-8 rounded-xl grid place-items-center shrink-0 ${
        isUser ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
      }`}>
        {isUser ? <User className="size-4" strokeWidth={2.5} /> : <Bot className="size-4" strokeWidth={2.5} />}
      </div>
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl border-2 text-sm font-medium leading-relaxed whitespace-pre-wrap ${
        isUser ? "bg-primary text-primary-foreground border-foreground rounded-br-md chunky-shadow"
               : "bg-muted border-border rounded-bl-md"
      }`}>
        {msg.text}
      </div>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return <span className="size-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: `${delay}ms` }} />;
}

function tutorReply(q: string): string {
  const t = q.toLowerCase();
  if (/quiz me/.test(t)) {
    return "Great — quick question:\n\nWhich component of working memory rehearses verbal information?\n  A) Visuospatial sketchpad\n  B) Phonological loop\n  C) Central executive\n  D) Episodic buffer\n\nType A, B, C, or D and I'll explain!";
  }
  if (/3x ?\+ ?7/.test(t)) {
    return "Let's walk through it together:\n\n1. Start with 3x + 7 = 22.\n2. Subtract 7 from both sides → 3x = 15.\n3. Divide both sides by 3 → x = 5.\n\nWant to try one yourself? Try: 4y − 6 = 14.";
  }
  if (/working memory|like i'?m 12/.test(t)) {
    return "Think of working memory as a tiny mental whiteboard 🧠 — you can scribble about 4 things on it at once. If you don't keep going over them, they fade. That's why repeating a phone number out loud helps you remember it long enough to dial.";
  }
  if (/french revolution/.test(t)) {
    return "Sure! Here's a fast 5-bullet summary:\n• 1789: Estates-General → Tennis Court Oath; revolution begins.\n• Bastille stormed (Jul 14) — symbol of popular uprising.\n• Declaration of the Rights of Man and of the Citizen.\n• Reign of Terror (1793–94) under Robespierre.\n• Ends with Napoleon's coup in 1799.";
  }
  return "Good question. Let's break it down step by step — what do you already know about it? Even a rough idea helps me meet you where you are.";
}
