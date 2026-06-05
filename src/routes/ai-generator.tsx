import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Sparkles, Wand2, FileText, ListChecks, Loader2, Copy, RotateCcw, Save, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { useGeneratedQuizzes } from "@/lib/quizStore";

export const Route = createFileRoute("/ai-generator")({
  head: () => ({ meta: [{ title: "QuestLMS — AI Content Generator" }] }),
  component: AiGeneratorPage,
});

type Mode = "quiz" | "summary" | "outline";

const MODES: { id: Mode; label: string; icon: typeof Wand2; desc: string }[] = [
  { id: "quiz", label: "Quiz questions", icon: ListChecks, desc: "Generate MCQs with answer keys" },
  { id: "summary", label: "Lesson summary", icon: FileText, desc: "Tight recap for review" },
  { id: "outline", label: "Lesson outline", icon: Sparkles, desc: "Bulleted teaching plan" },
];

function AiGeneratorPage() {
  const navigate = useNavigate();
  const { add } = useGeneratedQuizzes();
  const [mode, setMode] = useState<Mode>("quiz");
  const [topic, setTopic] = useState("Working memory in cognitive psychology");
  const [level, setLevel] = useState("High school");
  const [count, setCount] = useState(5);
  const [course, setCourse] = useState("Cognitive Psychology");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>("");

  const run = () => {
    setLoading(true);
    setOutput("");
    setTimeout(() => {
      setOutput(mock(mode, topic, level, count));
      setLoading(false);
    }, 900);
  };

  const handleSave = () => {
    const id = `gen-${Date.now()}`;
    const title = mode === "quiz" ? `${topic} — AI quiz` : `${topic} — AI ${mode}`;
    const questionCount = mode === "quiz" ? count : 0;
    add({
      id,
      title,
      course,
      questions: questionCount,
      lastUsed: "Never",
      uses: 0,
      content: output,
    });
    toast.success("Saved to Quiz Bank");
    navigate({ to: "/quiz-bank" });
  };

  const handleLaunch = () => {
    toast.success("Launching live quiz…");
    navigate({ to: "/live-quiz-host" });
  };

  return (
    <DashboardShell>
      <TopBar title="AI Content Generator" subtitle="Draft quizzes, summaries, and outlines in seconds." showStreak={false} />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-5 h-fit">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2">Mode</p>
            <div className="grid gap-2">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = m.id === mode;
                return (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                      active ? "bg-primary text-primary-foreground border-foreground chunky-shadow" : "bg-card border-border hover:bg-muted/50"
                    }`}>
                    <Icon className="size-5 shrink-0" strokeWidth={2.5} />
                    <div className="min-w-0">
                      <p className="font-black text-sm">{m.label}</p>
                      <p className={`text-[11px] font-medium truncate ${active ? "opacity-80" : "text-foreground/55"}`}>{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Topic">
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50" />
          </Field>

          <Field label="Audience level">
            <select value={level} onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50">
              {["Elementary", "Middle school", "High school", "University", "Adult learners"].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>

          <Field label="Course">
            <input value={course} onChange={(e) => setCourse(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50" />
          </Field>

          {mode === "quiz" && (
            <Field label={`Question count · ${count}`}>
              <input type="range" min={3} max={15} value={count} onChange={(e) => setCount(+e.target.value)}
                className="w-full accent-primary" />
            </Field>
          )}

          <button onClick={run} disabled={loading || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground border-2 border-foreground chunky-shadow font-black disabled:opacity-50">
            {loading ? <><Loader2 className="size-4 animate-spin" /> Generating…</> : <><Wand2 className="size-4" strokeWidth={2.5} /> Generate</>}
          </button>
        </aside>

        <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow min-h-[480px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-xl flex items-center gap-2">
              <Sparkles className="size-5 text-primary" strokeWidth={2.5} /> Output
            </h3>
            <div className="flex gap-2">
              {mode === "quiz" && output && (
                <>
                  <button onClick={handleSave}
                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-bold text-xs flex items-center gap-1.5 transition-opacity cursor-pointer">
                    <Save className="size-3.5" /> Save to Quiz Bank
                  </button>
                  <button onClick={handleLaunch}
                    className="px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground hover:opacity-90 font-bold text-xs flex items-center gap-1.5 transition-opacity cursor-pointer">
                    <PlayCircle className="size-3.5" /> Launch Live
                  </button>
                </>
              )}
              <button onClick={() => navigator.clipboard?.writeText(output)} disabled={!output}
                className="px-3 py-1.5 rounded-xl bg-muted hover:bg-foreground/10 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer">
                <Copy className="size-3.5" /> Copy
              </button>
              <button onClick={run} disabled={loading || !topic.trim()}
                className="px-3 py-1.5 rounded-xl bg-muted hover:bg-foreground/10 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer">
                <RotateCcw className="size-3.5" /> Regenerate
              </button>
            </div>
          </div>

          {!output && !loading && (
            <div className="grid place-items-center h-[380px] text-center">
              <div className="max-w-sm space-y-2">
                <div className="size-16 mx-auto rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center chunky-shadow border-2 border-foreground">
                  <Wand2 className="size-7" strokeWidth={2.5} />
                </div>
                <p className="font-black text-lg">Pick a mode and click Generate</p>
                <p className="text-sm font-medium text-foreground/55">AI drafts content tuned to your topic and audience. Always review before publishing.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 rounded-lg bg-muted" style={{ width: `${60 + Math.random() * 40}%` }} />)}
            </div>
          )}

          {output && !loading && (
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90">{output}</pre>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2">{label}</p>
      {children}
    </div>
  );
}

function mock(mode: Mode, topic: string, level: string, count: number) {
  if (mode === "quiz") {
    return Array.from({ length: count }).map((_, i) => `Q${i + 1}. About "${topic}" — which statement is most accurate? (${level})
  A) A plausible but incorrect option
  B) The correct, well-supported answer ✓
  C) A common misconception
  D) An unrelated distractor
  Answer: B
`).join("\n");
  }
  if (mode === "summary") {
    return `Summary — ${topic} (${level})

${topic} refers to the cognitive system that holds and manipulates information for short periods. Key components include the phonological loop, visuospatial sketchpad, and central executive. Capacity is limited (~4 chunks) and decays without rehearsal. Implications for learning include chunking, dual-coding, and reducing extraneous load.

Key takeaways:
• Capacity is limited but trainable
• Rehearsal extends retention
• Chunking multiplies effective capacity
• Distraction sharply reduces performance`;
  }
  return `Lesson outline — ${topic} (${level})

1. Hook (3 min) — quick demo: remember a list of 9 items
2. Define working memory and its role (8 min)
3. Components: loop, sketchpad, executive (10 min)
4. Activity: chunking exercise in pairs (10 min)
5. Discuss limits and implications for studying (7 min)
6. Exit ticket: 3 questions on the model (2 min)`;
}
