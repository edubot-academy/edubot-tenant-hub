import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Bot, Check, X, Loader2, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";

export const Route = createFileRoute("/ai-grading")({
  head: () => ({ meta: [{ title: "QuestLMS — AI Grading Assistant" }] }),
  component: AiGradingPage,
});

type Item = {
  id: string;
  student: string;
  question: string;
  answer: string;
  expected: string;
  aiScore?: number;
  aiFeedback?: string;
  approved?: boolean;
};

const SEED: Item[] = [
  { id: "1", student: "Mia Chen", question: "Define working memory.", expected: "A limited-capacity system that temporarily holds & manipulates info.", answer: "Working memory is a short-term store that lets us hold and use information for a few seconds while thinking." },
  { id: "2", student: "Leo Park", question: "Name the components of Baddeley's model.", expected: "Phonological loop, visuospatial sketchpad, central executive, episodic buffer.", answer: "The loop and sketchpad with a central executive." },
  { id: "3", student: "Ava Diaz", question: "Why is chunking useful?", expected: "Chunking groups items so capacity holds more information.", answer: "Because it makes things easier to remember by grouping them." },
  { id: "4", student: "Sam Cole", question: "What is the typical capacity of WM?", expected: "About 4 chunks (Cowan).", answer: "7 plus or minus 2." },
];

export default function AiGradingPage() {
  const [items, setItems] = useState<Item[]>(SEED);
  const [running, setRunning] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);

  const grade = (id: string) => {
    setRunning(id);
    setTimeout(() => {
      setItems(prev => prev.map(it => it.id === id ? { ...it, ...mockGrade(it) } : it));
      setRunning(null);
    }, 700);
  };

  const gradeAll = () => {
    setBulk(true);
    setItems(prev => prev.map(it => ({ ...it, ...mockGrade(it) })));
    setTimeout(() => setBulk(false), 800);
  };

  const setApproved = (id: string, ok: boolean) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, approved: ok } : it));

  const graded = items.filter(i => i.aiScore !== undefined).length;
  const approved = items.filter(i => i.approved === true).length;

  return (
    <DashboardShell>
      <TopBar title="AI Grading Assistant" subtitle="Auto-score short answers, then approve or override." showStreak={false} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Submissions" value={`${items.length}`} />
        <Stat label="Auto-graded" value={`${graded}/${items.length}`} />
        <Stat label="Approved" value={`${approved}`} />
        <Stat label="Avg confidence" value={graded ? "87%" : "—"} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-foreground/60">Review AI scores before publishing grades.</p>
        <button onClick={gradeAll} disabled={bulk}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow font-black text-sm disabled:opacity-50">
          {bulk ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" strokeWidth={2.5} />}
          Grade all with AI
        </button>
      </div>

      <div className="space-y-3">
        {items.map(it => (
          <article key={it.id} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-black text-base">{it.student}</p>
                <p className="text-sm font-bold text-foreground/70 mt-0.5">{it.question}</p>
              </div>
              {it.aiScore !== undefined && (
                <div className={`px-3 py-1.5 rounded-xl font-black text-sm border-2 ${
                  it.aiScore >= 80 ? "bg-primary/15 text-primary border-primary/40" :
                  it.aiScore >= 50 ? "bg-accent/20 text-accent-foreground border-accent/40" :
                  "bg-destructive/15 text-destructive border-destructive/40"
                }`}>
                  {it.aiScore}/100
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Box label="Student answer">{it.answer}</Box>
              <Box label="Expected" muted>{it.expected}</Box>
            </div>

            {it.aiFeedback && (
              <div className="mt-3 p-3 rounded-2xl bg-primary/5 border-2 border-primary/20 flex gap-3">
                <div className="size-8 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0">
                  <Bot className="size-4" strokeWidth={2.5} />
                </div>
                <div className="text-sm font-medium text-foreground/85">{it.aiFeedback}</div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button onClick={() => grade(it.id)} disabled={running === it.id}
                className="px-3 py-2 rounded-xl bg-muted hover:bg-foreground/10 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50">
                {running === it.id ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                {it.aiScore !== undefined ? "Regrade" : "Grade with AI"}
              </button>

              {it.aiScore !== undefined && (
                <div className="flex gap-2">
                  <button onClick={() => setApproved(it.id, false)}
                    className={`px-3 py-2 rounded-xl border-2 font-bold text-xs flex items-center gap-1.5 ${
                      it.approved === false ? "bg-destructive text-destructive-foreground border-destructive" : "bg-card border-border hover:bg-muted"
                    }`}>
                    <ThumbsDown className="size-3.5" /> Override
                  </button>
                  <button onClick={() => setApproved(it.id, true)}
                    className={`px-3 py-2 rounded-xl border-2 font-bold text-xs flex items-center gap-1.5 ${
                      it.approved ? "bg-primary text-primary-foreground border-foreground chunky-shadow" : "bg-card border-border hover:bg-muted"
                    }`}>
                    <ThumbsUp className="size-3.5" /> Approve
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}

function Box({ label, children, muted }: { label: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <div className={`p-3 rounded-2xl border-2 border-border ${muted ? "bg-muted/50" : "bg-background"}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1">{label}</p>
      <p className="text-sm font-medium">{children}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}

function mockGrade(it: Item): Partial<Item> {
  // Simple heuristic: similarity ratio of word overlap
  const a = new Set(it.answer.toLowerCase().split(/\W+/).filter(Boolean));
  const b = new Set(it.expected.toLowerCase().split(/\W+/).filter(Boolean));
  const overlap = [...a].filter(x => b.has(x)).length;
  const score = Math.min(100, Math.round((overlap / b.size) * 110));
  const feedback = score >= 80
    ? "Strong answer that captures the core idea. Minor wording differences."
    : score >= 50
    ? "Partially correct. Missing one or two key components — see expected answer."
    : "Off-target. Recommend revisiting the lesson and resubmitting.";
  return { aiScore: score, aiFeedback: feedback };
}
