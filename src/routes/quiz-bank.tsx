import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, Library, Search, PlayCircle, Copy } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/quiz-bank")({
  head: () => ({ meta: [{ title: "QuestLMS — Quiz Bank" }] }),
  component: QuizBankPage,
});

const quizzes = [
  { id: "q1", title: "Working memory — chapter quiz", course: "Cognitive Psychology", questions: 18, lastUsed: "2d ago", uses: 12 },
  { id: "q2", title: "Attention models pop quiz", course: "Cognitive Psychology", questions: 8, lastUsed: "1w ago", uses: 5 },
  { id: "q3", title: "Nucleophilic substitution", course: "Organic Chemistry II", questions: 22, lastUsed: "3d ago", uses: 9 },
  { id: "q4", title: "Stereochemistry basics", course: "Organic Chemistry II", questions: 15, lastUsed: "2w ago", uses: 7 },
  { id: "q5", title: "Lab safety refresher", course: "Organic Chemistry II", questions: 10, lastUsed: "Yesterday", uses: 3 },
  { id: "q6", title: "Modern era — vocabulary", course: "World History", questions: 30, lastUsed: "Never", uses: 0 },
];

function QuizBankPage() {

  const [q, setQ] = useState("");
  const filtered = quizzes.filter((x) => x.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <DashboardShell>
      <TopBar title="Quiz Bank" subtitle="Reusable quizzes you can launch live or assign as homework." showStreak={false} />

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3 p-3 bg-card border-2 border-border rounded-2xl chunky-shadow flex-1 min-w-[240px] max-w-xl">
          <Search className="size-4 text-foreground/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search quizzes…"
            className="flex-1 bg-transparent outline-none text-sm font-medium"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 transition-opacity">
          <Plus className="size-4" strokeWidth={3} /> New quiz
        </button>
      </div>

      <section className="bg-card border-2 border-border rounded-3xl p-3 sm:p-5 chunky-shadow">
        <h3 className="font-black text-xl flex items-center gap-2 mb-3 px-2">
          <Library className="size-5 text-primary" strokeWidth={2.5} /> {filtered.length} quizzes
        </h3>
        <ul className="divide-y divide-border">
          {filtered.map((qz) => (
            <li key={qz.id} className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-2xl transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-black truncate">{qz.title}</p>
                <p className="text-xs text-foreground/50 font-medium mt-0.5">
                  {qz.course} · {qz.questions} questions · used {qz.uses}× · last {qz.lastUsed}
                </p>
              </div>
              <button className="size-9 grid place-items-center rounded-xl bg-muted hover:bg-foreground/10 transition-colors" aria-label="Duplicate">
                <Copy className="size-4" />
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground font-bold text-xs">
                <PlayCircle className="size-4" strokeWidth={2.5} /> Launch
              </button>
            </li>
          ))}
        </ul>
      </section>
    </DashboardShell>
  );
}
