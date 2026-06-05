import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Trophy, Download, BarChart3, CheckCircle2, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/quiz-results")({
  head: () => ({ meta: [{ title: "QuestLMS — Quiz Results" }] }),
  component: QuizResultsPage,
});

const leaderboard = [
  { name: "Mia", correct: 9, score: 8420, time: "4:12" },
  { name: "Ben", correct: 9, score: 8150, time: "4:38" },
  { name: "Noor", correct: 8, score: 7320, time: "4:55" },
  { name: "Theo", correct: 8, score: 7010, time: "5:02" },
  { name: "Aya", correct: 7, score: 6480, time: "4:20" },
  { name: "Leo", correct: 7, score: 6240, time: "4:48" },
  { name: "Ivy", correct: 6, score: 5510, time: "5:10" },
  { name: "Sam", correct: 5, score: 4280, time: "5:30" },
];

const questions = [
  { id: 1, text: "Define working memory", correct: 92, time: 8 },
  { id: 2, text: "Phonological loop function", correct: 81, time: 12 },
  { id: 3, text: "Capacity limits research (Miller)", correct: 56, time: 18, hard: true },
  { id: 4, text: "Visuospatial sketchpad", correct: 74, time: 14 },
  { id: 5, text: "Central executive role", correct: 41, time: 22, hard: true },
  { id: 6, text: "Chunking definition", correct: 88, time: 9 },
  { id: 7, text: "Episodic buffer (Baddeley 2000)", correct: 38, time: 24, hard: true },
  { id: 8, text: "Word-length effect", correct: 66, time: 16 },
  { id: 9, text: "Articulatory rehearsal", correct: 72, time: 13 },
  { id: 10, text: "Apply: real-world example", correct: 79, time: 17 },
];

function QuizResultsPage() {
  const avg = Math.round(questions.reduce((a, q) => a + q.correct, 0) / questions.length);
  return (
    <DashboardShell>
      <TopBar title="Quiz Results" subtitle="Working Memory · 10 questions · 12 players" showStreak={false} />

      <div className="flex items-center justify-end mb-4">
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border-2 border-border font-bold text-sm chunky-shadow hover:bg-muted transition-colors">
          <Download className="size-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Avg score", value: `${avg}%`, sub: "across all players" },
          { label: "Top score", value: "8,420", sub: "Mia" },
          { label: "Completion", value: "12/12", sub: "all players finished" },
          { label: "Avg time", value: "4:48", sub: "per quiz" },
        ].map((s) => (
          <div key={s.label} className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
            <p className="text-xs font-black uppercase tracking-wider text-foreground/60">{s.label}</p>
            <p className="text-2xl font-black mt-1">{s.value}</p>
            <p className="text-xs font-bold text-foreground/50 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <section className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
          <h3 className="font-black text-xl flex items-center gap-2 mb-4">
            <BarChart3 className="size-5 text-primary" strokeWidth={2.5} /> Per-question analytics
          </h3>
          <ul className="space-y-3">
            {questions.map((q) => (
              <li key={q.id} className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="size-7 grid place-items-center rounded-lg bg-muted font-black text-xs">{q.id}</span>
                  <span className="font-bold flex-1 truncate">{q.text}</span>
                  {q.hard && <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-destructive/20 text-destructive">Hard</span>}
                  <span className="font-mono text-xs font-black w-12 text-right">{q.correct}%</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground/50 w-12 justify-end">
                    <Clock className="size-3" /> {q.time}s
                  </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden border-2 border-border">
                  <div className={`h-full ${q.correct >= 70 ? "bg-primary" : q.correct >= 50 ? "bg-accent" : "bg-destructive"}`} style={{ width: `${q.correct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow h-fit">
          <h3 className="font-black text-xl flex items-center gap-2 mb-4">
            <Trophy className="size-5 text-secondary" strokeWidth={2.5} /> Leaderboard
          </h3>
          <ul className="space-y-2">
            {leaderboard.map((p, i) => (
              <li key={p.name} className={`flex items-center gap-3 p-3 rounded-2xl ${i < 3 ? "bg-primary/10 border-2 border-primary/30" : "bg-muted/50"}`}>
                <span className={`size-9 grid place-items-center rounded-xl font-black ${i === 0 ? "bg-yellow-400 text-black" : i === 1 ? "bg-gray-300 text-black" : i === 2 ? "bg-amber-600 text-white" : "bg-foreground text-background"}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-black truncate">{p.name}</p>
                  <p className="text-[10px] font-bold text-foreground/50 inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-0.5"><CheckCircle2 className="size-3 text-primary" /> {p.correct}</span>
                    <span className="inline-flex items-center gap-0.5"><XCircle className="size-3 text-destructive" /> {10 - p.correct}</span>
                    <span className="inline-flex items-center gap-0.5"><Clock className="size-3" /> {p.time}</span>
                  </p>
                </div>
                <span className="font-mono font-black text-sm">{p.score.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </DashboardShell>
  );
}
