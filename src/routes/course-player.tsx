import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Maximize, CheckCircle2,
  Circle, FileText, MessageSquare, Bookmark, Send
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/course-player")({
  head: () => ({ meta: [{ title: "QuestLMS — Course Player" }] }),
  component: CoursePlayerPage,
});

const outline = [
  { id: "1", title: "Introduction", duration: "4:12", done: true },
  { id: "2", title: "Baddeley's model", duration: "12:48", done: true },
  { id: "3", title: "The phonological loop", duration: "9:30", done: false, active: true },
  { id: "4", title: "Quiz — chapter check", duration: "5 q", done: false, type: "quiz" as const },
  { id: "5", title: "Capacity & chunking", duration: "10:05", done: false },
  { id: "6", title: "Assignment: case study", duration: "—", done: false, type: "assignment" as const },
];

function CoursePlayerPage() {
  const [tab, setTab] = useState<"notes" | "transcript" | "discussion">("notes");
  const [playing, setPlaying] = useState(true);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([
    { id: "n1", t: "02:14", text: "Phonological loop = inner voice. Useful mnemonic." },
    { id: "n2", t: "06:40", text: "Test myself on the digit-span experiment later." },
  ]);

  return (
    <DashboardShell>
      <TopBar title="Cognitive Psychology" subtitle="Module 3 · Working Memory" showStreak={false} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">
          {/* Player */}
          <div className="bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow">
            <div className="relative aspect-video bg-gradient-to-br from-primary/30 via-secondary/30 to-accent/30 grid place-items-center">
              <button onClick={() => setPlaying((p) => !p)}
                className="size-20 rounded-full bg-background/90 border-4 border-foreground grid place-items-center chunky-shadow hover:scale-105 transition-transform">
                {playing ? <Pause className="size-9" strokeWidth={3} /> : <Play className="size-9 ml-1" strokeWidth={3} />}
              </button>
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-background/80 backdrop-blur text-xs font-black">
                Lesson 3 of 6
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "42%" }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="size-9 grid place-items-center rounded-xl bg-muted hover:bg-foreground/10"><SkipBack className="size-4" /></button>
                  <button onClick={() => setPlaying((p) => !p)} className="size-10 grid place-items-center rounded-xl bg-primary text-primary-foreground">
                    {playing ? <Pause className="size-5" strokeWidth={3} /> : <Play className="size-5 ml-0.5" strokeWidth={3} />}
                  </button>
                  <button className="size-9 grid place-items-center rounded-xl bg-muted hover:bg-foreground/10"><SkipForward className="size-4" /></button>
                  <span className="text-xs font-mono font-bold ml-2 text-foreground/70">04:02 / 09:30</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="size-9 grid place-items-center rounded-xl bg-muted"><Volume2 className="size-4" /></button>
                  <button className="size-9 grid place-items-center rounded-xl bg-muted"><Maximize className="size-4" /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden">
            <div className="flex border-b-2 border-border">
              {([
                ["notes", "My notes", FileText],
                ["transcript", "Transcript", Bookmark],
                ["discussion", "Discussion", MessageSquare],
              ] as const).map(([key, label, Icon]) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 font-black text-sm border-b-4 transition-colors ${tab === key ? "border-primary text-foreground" : "border-transparent text-foreground/50 hover:text-foreground"}`}>
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
            <div className="p-5 min-h-[280px]">
              {tab === "notes" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder="Note at 04:02…"
                      className="flex-1 px-3 py-2.5 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary" />
                    <button onClick={() => {
                      if (!note.trim()) return;
                      setNotes((n) => [{ id: crypto.randomUUID(), t: "04:02", text: note }, ...n]);
                      setNote("");
                    }} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm">Add</button>
                  </div>
                  <ul className="space-y-2">
                    {notes.map((n) => (
                      <li key={n.id} className="flex gap-3 p-3 bg-muted/50 rounded-xl">
                        <span className="text-xs font-mono font-black text-primary mt-0.5">{n.t}</span>
                        <p className="text-sm font-medium flex-1">{n.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tab === "transcript" && (
                <div className="space-y-2 text-sm leading-relaxed text-foreground/80 font-medium">
                  <p><span className="font-mono text-xs text-primary font-black mr-2">00:00</span>The phonological loop is one of the slave systems in Baddeley's model.</p>
                  <p><span className="font-mono text-xs text-primary font-black mr-2">00:32</span>It comprises a phonological store and an articulatory rehearsal process.</p>
                  <p><span className="font-mono text-xs text-primary font-black mr-2">01:18</span>Capacity is roughly two seconds of speech-based information.</p>
                  <p><span className="font-mono text-xs text-primary font-black mr-2">02:05</span>This explains the word-length effect we'll demonstrate next.</p>
                </div>
              )}
              {tab === "discussion" && (
                <div className="space-y-3">
                  {[{ a: "Mia", t: "Wait, is the loop the same as the articulatory loop? Got confused." },
                    { a: "Ben", t: "Great example with digit span. Going to try at home." }].map((m, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="size-9 rounded-full bg-secondary text-secondary-foreground grid place-items-center font-black text-xs">{m.a[0]}</div>
                      <div className="flex-1 bg-muted/50 rounded-2xl p-3">
                        <p className="text-xs font-black">{m.a}</p>
                        <p className="text-sm font-medium mt-1">{m.t}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2 border-t-2 border-border">
                    <input placeholder="Ask a question…" className="flex-1 px-3 py-2.5 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary" />
                    <button className="px-3 py-2.5 rounded-xl bg-primary text-primary-foreground"><Send className="size-4" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Outline */}
        <aside className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow h-fit">
          <h3 className="font-black text-sm uppercase tracking-wider text-foreground/60 mb-3 px-2">Lesson outline</h3>
          <ul className="space-y-1">
            {outline.map((l) => (
              <li key={l.id}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  "active" in l && l.active ? "bg-primary/10 border-2 border-primary" : "border-2 border-transparent hover:bg-muted"
                }`}>
                {l.done ? <CheckCircle2 className="size-5 text-primary shrink-0" strokeWidth={2.5} /> : <Circle className="size-5 text-foreground/30 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{l.title}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
                    {"type" in l ? l.type : "video"} · {l.duration}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 p-3 bg-secondary/20 rounded-xl">
            <p className="text-xs font-bold">Course progress</p>
            <div className="h-2 bg-background rounded-full overflow-hidden mt-2">
              <div className="h-full bg-secondary" style={{ width: "38%" }} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mt-1">38% · 2 of 6 lessons</p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
