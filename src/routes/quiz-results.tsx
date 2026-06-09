import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Trophy, BarChart3, CheckCircle2, XCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import { useAppContext } from "@/lib/app-context";
import { useLiveQuizResults, type LiveQuizResultsResponse } from "@/lib/live-quiz-api";

export const Route = createFileRoute("/quiz-results")({
  head: () => ({ meta: [{ title: "QuestLMS — Quiz Results" }] }),
  validateSearch: z.object({ pin: z.string().optional() }),
  component: QuizResultsPage,
});

// ─── Static prototype data ────────────────────────────────────────────────────

const PROTO_LEADERBOARD = [
  { rank: 1, nickname: "Mia",  score: 8420, correct: 9, total: 10 },
  { rank: 2, nickname: "Ben",  score: 8150, correct: 9, total: 10 },
  { rank: 3, nickname: "Noor", score: 7320, correct: 8, total: 10 },
  { rank: 4, nickname: "Theo", score: 7010, correct: 8, total: 10 },
  { rank: 5, nickname: "Aya",  score: 6480, correct: 7, total: 10 },
  { rank: 6, nickname: "Leo",  score: 6240, correct: 7, total: 10 },
  { rank: 7, nickname: "Ivy",  score: 5510, correct: 6, total: 10 },
  { rank: 8, nickname: "Sam",  score: 4280, correct: 5, total: 10 },
];

const PROTO_QUESTIONS = [
  { index: 0, text: "Define working memory",              correctPercent: 92, totalAnswered: 8, options: ["A","B","C","D"], correctIndex: 1, answerCounts: [0,7,1,0] },
  { index: 1, text: "Phonological loop function",         correctPercent: 81, totalAnswered: 8, options: ["A","B","C","D"], correctIndex: 0, answerCounts: [6,1,1,0] },
  { index: 2, text: "Capacity limits research (Miller)",  correctPercent: 56, totalAnswered: 8, options: ["A","B","C","D"], correctIndex: 2, answerCounts: [2,1,4,1] },
  { index: 3, text: "Visuospatial sketchpad",             correctPercent: 74, totalAnswered: 8, options: ["A","B","C","D"], correctIndex: 1, answerCounts: [1,6,1,0] },
  { index: 4, text: "Central executive role",             correctPercent: 41, totalAnswered: 8, options: ["A","B","C","D"], correctIndex: 3, answerCounts: [3,2,0,3] },
  { index: 5, text: "Chunking definition",                correctPercent: 88, totalAnswered: 8, options: ["A","B","C","D"], correctIndex: 0, answerCounts: [7,0,1,0] },
  { index: 6, text: "Episodic buffer (Baddeley 2000)",    correctPercent: 38, totalAnswered: 8, options: ["A","B","C","D"], correctIndex: 2, answerCounts: [2,3,3,0] },
  { index: 7, text: "Word-length effect",                 correctPercent: 66, totalAnswered: 8, options: ["A","B","C","D"], correctIndex: 1, answerCounts: [1,5,2,0] },
  { index: 8, text: "Articulatory rehearsal",             correctPercent: 72, totalAnswered: 8, options: ["A","B","C","D"], correctIndex: 0, answerCounts: [6,1,1,0] },
  { index: 9, text: "Apply: real-world example",          correctPercent: 79, totalAnswered: 8, options: ["A","B","C","D"], correctIndex: 3, answerCounts: [1,0,1,6] },
];

function PrototypeQuizResultsPage() {
  const avgScore = Math.round(PROTO_QUESTIONS.reduce((a, q) => a + q.correctPercent, 0) / PROTO_QUESTIONS.length);
  return (
    <ResultsLayout
      title="Working Memory"
      subtitle={`${PROTO_QUESTIONS.length} questions · ${PROTO_LEADERBOARD.length} players`}
      avgScore={`${avgScore}%`}
      topScore={PROTO_LEADERBOARD[0].score.toLocaleString()}
      topName={PROTO_LEADERBOARD[0].nickname}
      completion={`${PROTO_LEADERBOARD.length}/${PROTO_LEADERBOARD.length}`}
      playerCount={PROTO_LEADERBOARD.length}
      leaderboard={PROTO_LEADERBOARD}
      questions={PROTO_QUESTIONS}
    />
  );
}

// ─── Backend page ─────────────────────────────────────────────────────────────

function BackendQuizResultsPage({ pin }: { pin: string }) {
  const resultsQuery = useLiveQuizResults(pin);

  if (resultsQuery.isLoading) {
    return (
      <DashboardShell>
        <TopBar title="Quiz Results" subtitle="Loading…" showStreak={false} />
        <div className="flex items-center justify-center h-64 text-foreground/40">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  if (resultsQuery.isError || !resultsQuery.data) {
    return (
      <DashboardShell>
        <TopBar title="Quiz Results" subtitle={`PIN ${pin}`} showStreak={false} />
        <div className="bg-card border-2 border-border rounded-3xl p-10 chunky-shadow text-center max-w-md mx-auto mt-10">
          <AlertCircle className="size-10 mx-auto text-destructive mb-2" strokeWidth={1.5} />
          <p className="font-black text-lg">Session not found</p>
          <p className="text-sm font-medium text-foreground/50 mt-1">
            PIN {pin} may have expired or never existed.
          </p>
        </div>
      </DashboardShell>
    );
  }

  const data = resultsQuery.data;
  const avgPct = data.questions.length
    ? Math.round(data.questions.reduce((a, q) => a + q.correctPercent, 0) / data.questions.length)
    : 0;

  return (
    <ResultsLayout
      title={data.title}
      subtitle={`${data.questions.length} questions · ${data.playerCount} players · PIN ${pin}`}
      avgScore={`${avgPct}%`}
      topScore={data.topScore.toLocaleString()}
      topName={data.leaderboard[0]?.nickname ?? "—"}
      completion={`${data.playerCount}/${data.playerCount}`}
      playerCount={data.playerCount}
      leaderboard={data.leaderboard.map((p) => ({
        rank: p.rank,
        nickname: p.nickname,
        score: p.score,
        correct: null,
        total: data.questions.length,
      }))}
      questions={data.questions}
    />
  );
}

// ─── Shared layout ────────────────────────────────────────────────────────────

type LeaderboardEntry = { rank: number; nickname: string; score: number; correct: number | null; total: number };
type QuestionStat = {
  index: number;
  text: string;
  options: string[];
  correctIndex: number;
  answerCounts: number[];
  correctPercent: number;
  totalAnswered: number;
};

function ResultsLayout({
  title,
  subtitle,
  avgScore,
  topScore,
  topName,
  completion,
  playerCount,
  leaderboard,
  questions,
}: {
  title: string;
  subtitle: string;
  avgScore: string;
  topScore: string;
  topName: string;
  completion: string;
  playerCount: number;
  leaderboard: LeaderboardEntry[];
  questions: QuestionStat[];
}) {
  return (
    <DashboardShell>
      <TopBar title="Quiz Results" subtitle={`${title} · ${subtitle}`} showStreak={false} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Avg correct", value: avgScore,    sub: "across all players" },
          { label: "Top score",   value: topScore,    sub: topName },
          { label: "Completion",  value: completion,  sub: "all players finished" },
          { label: "Players",     value: String(playerCount), sub: "total joined" },
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
            {questions.map((q, i) => {
              const hard = q.correctPercent < 50;
              return (
                <li key={q.index} className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="size-7 shrink-0 grid place-items-center rounded-lg bg-muted font-black text-xs">{i + 1}</span>
                    <span className="font-bold flex-1 truncate">{q.text}</span>
                    {hard && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-destructive/20 text-destructive shrink-0">Hard</span>
                    )}
                    <span className="font-mono text-xs font-black w-12 text-right">{q.correctPercent}%</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground/50 w-16 justify-end shrink-0">
                      <Clock className="size-3" /> {q.totalAnswered} ans
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden border-2 border-border">
                    <div
                      className={`h-full transition-all ${q.correctPercent >= 70 ? "bg-primary" : q.correctPercent >= 50 ? "bg-accent" : "bg-destructive"}`}
                      style={{ width: `${q.correctPercent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow h-fit">
          <h3 className="font-black text-xl flex items-center gap-2 mb-4">
            <Trophy className="size-5 text-secondary" strokeWidth={2.5} /> Leaderboard
          </h3>
          <ul className="space-y-2">
            {leaderboard.map((p) => (
              <li key={p.rank} className={`flex items-center gap-3 p-3 rounded-2xl ${p.rank <= 3 ? "bg-primary/10 border-2 border-primary/30" : "bg-muted/50"}`}>
                <span className={`size-9 shrink-0 grid place-items-center rounded-xl font-black ${
                  p.rank === 1 ? "bg-yellow-400 text-black" : p.rank === 2 ? "bg-gray-300 text-black" : p.rank === 3 ? "bg-amber-600 text-white" : "bg-foreground text-background"
                }`}>
                  {p.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-black truncate">{p.nickname}</p>
                  {p.total > 0 && p.correct !== null && (
                    <p className="text-[10px] font-bold text-foreground/50 inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-0.5"><CheckCircle2 className="size-3 text-primary" /> {p.correct}</span>
                      <span className="inline-flex items-center gap-0.5"><XCircle className="size-3 text-destructive" /> {p.total - p.correct}</span>
                    </p>
                  )}
                </div>
                <span className="font-mono font-black text-sm shrink-0">{p.score.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </DashboardShell>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function QuizResultsPage() {
  const { context } = useAppContext();
  const { pin } = Route.useSearch();

  if (context.mode === "backend" && pin) {
    return <BackendQuizResultsPage pin={pin} />;
  }
  return <PrototypeQuizResultsPage />;
}
