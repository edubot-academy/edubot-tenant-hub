import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  Users, Play, SkipForward, Trophy, Zap, Plus, Trash2, Loader2,
  BarChart3, Sparkles, Library, Pencil, Check,
} from "lucide-react";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";
import {
  useCreateLiveQuiz, useLiveQuizState, useNextQuestion, useRevealAnswer,
  useGenerateLiveQuizDraft, type CreateLiveQuizPayload,
} from "@/lib/live-quiz-api";
import { useQuizTemplates, useCreateQuizTemplate } from "@/lib/quiz-bank-api";

export const Route = createFileRoute("/live-quiz-host")({
  head: () => ({ meta: [{ title: i18n.t("liveQuizHostPage.metaTitle", { appName: i18n.t("app.name"), defaultValue: "{{appName}} — Live Quiz Host" }) }] }),
  component: LiveQuizHostPage,
});

const PLAYERS = ["Mia", "Ben", "Noor", "Theo", "Aya", "Leo", "Ivy", "Sam", "Zoe", "Kai", "Eli", "Ada"];
const OPTION_COLORS = ["bg-[#e63946]", "bg-[#1d99f3]", "bg-[#f4a261]", "bg-[#52b788]"];
const OPTION_BAR_HEX = ["#e63946", "#1d99f3", "#f4a261", "#52b788"];
const CONFETTI_COLORS = ["#e63946", "#1d99f3", "#f4a261", "#52b788", "#f7b731", "#a855f7", "#ffffff"];
const labels = ["A", "B", "C", "D"];

type SetupQuestion = { text: string; options: [string, string, string, string]; correctIndex: number };
const emptyQuestion = (): SetupQuestion => ({ text: "", options: ["", "", "", ""], correctIndex: 0 });

// ─── Shell: full-viewport dark overlay for game phases ──────────────────────

function FullScreenQuizShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-auto"
      style={{ background: "#0f0f1e", color: "white" }}
    >
      {children}
    </div>
  );
}

// ─── Confetti ───────────────────────────────────────────────────────────────

function Confetti({ count = 32 }: { count?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${Math.round((i / count) * 100)}%`,
            width: `${6 + (i % 4) * 3}px`,
            height: `${8 + (i % 3) * 4}px`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            borderRadius: i % 3 === 0 ? "50%" : "2px",
            "--confetti-duration": `${1.1 + (i % 7) * 0.22}s`,
            "--confetti-delay": `${(i * 0.065) % 0.9}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── SVG countdown ring ──────────────────────────────────────────────────────

function CountdownRing({ time, totalTime }: { time: number; totalTime: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, time / totalTime);
  const offset = circ * (1 - pct);
  const urgent = time < 6;
  return (
    <svg viewBox="0 0 100 100" className="size-16 sm:size-20 shrink-0">
      <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
      <circle
        cx="50" cy="50" r={r}
        stroke={urgent ? "#ef4444" : "white"}
        strokeWidth="10"
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dashoffset 0.95s linear, stroke 0.3s ease" }}
      />
      <text
        x="50" y="57"
        textAnchor="middle"
        fill={urgent ? "#ef4444" : "white"}
        fontSize="26"
        fontWeight="900"
        fontFamily="ui-monospace, monospace"
      >
        {time}
      </text>
    </svg>
  );
}

// ─── Lobby ──────────────────────────────────────────────────────────────────

function Lobby({ pin, playerCount, players, onStart, loading }: {
  pin: string; playerCount: number; players: { nickname: string }[];
  onStart: () => void; loading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <FullScreenQuizShell>
      <div className="flex flex-col items-center justify-center min-h-full gap-8 p-6 text-center">
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/40">
            {t("liveQuizHostPage.lobby.joinAt", { defaultValue: "Join at questlms.live" })}
          </p>
          <p className="text-xs font-medium text-white/25">
            {t("liveQuizHostPage.lobby.enterCode", { defaultValue: "Enter this code on your device" })}
          </p>
        </div>

        <div
          className="rounded-3xl px-10 py-7"
          style={{ background: "rgba(255,255,255,0.07)", border: "2px solid rgba(255,255,255,0.18)", backdropFilter: "blur(12px)" }}
        >
          <p
            className="font-black font-mono tracking-widest text-white"
            style={{ fontSize: "clamp(3rem, 10vw, 6rem)", textShadow: "0 0 48px rgba(255,255,255,0.22)" }}
          >
            {pin}
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-white/60">
          <Users className="size-5" strokeWidth={2.5} />
          <span className="text-lg font-black">
            {t("liveQuizHostPage.lobby.playersJoined", { count: playerCount, defaultValue: "{{count}} players joined" })}
          </span>
        </div>

        {players.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center max-w-xl">
            {players.map((p, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-xl font-bold text-sm animate-bounce-in"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                {p.nickname}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={onStart}
          disabled={loading || playerCount < 1}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg chunky-shadow hover:scale-105 transition-transform disabled:opacity-40 disabled:scale-100 cursor-pointer"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5" />}
          {t("liveQuizHostPage.actions.startQuiz", { defaultValue: "Start quiz" })}
        </button>
      </div>
    </FullScreenQuizShell>
  );
}

// ─── Question View ───────────────────────────────────────────────────────────

function QuestionView({ index, total, time, totalTime, answered, text, options, counts, onReveal, revealLabel, loading }: {
  index: number; total: number; time: number; totalTime: number; answered: number;
  text: string; options: string[]; counts: number[];
  onReveal: () => void; revealLabel: string; loading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <FullScreenQuizShell>
      {/* Top strip */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ background: "rgba(0,0,0,0.35)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span className="text-sm font-black text-white/55 min-w-[90px]">
          {t("liveQuizHostPage.labels.questionProgress", { current: index + 1, total, defaultValue: "Q {{current}} / {{total}}" })}
        </span>
        <CountdownRing time={time} totalTime={totalTime} />
        <span className="text-sm font-black text-white/55 min-w-[90px] text-right">
          {t("liveQuizHostPage.labels.answered", { count: answered, defaultValue: "{{count}} answered" })}
        </span>
      </div>

      {/* Question text */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-center leading-tight max-w-3xl">
          {text}
        </h2>
      </div>

      {/* Answer blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 sm:p-5 shrink-0">
        {options.map((opt, i) => (
          <div
            key={i}
            className={`${OPTION_COLORS[i]} rounded-2xl p-5 sm:p-6 flex items-center gap-4 chunky-shadow`}
            style={{ border: "3px solid rgba(0,0,0,0.15)" }}
          >
            <span
              className="size-12 sm:size-14 grid place-items-center rounded-xl font-black text-xl sm:text-2xl shrink-0 text-white"
              style={{ background: "rgba(0,0,0,0.22)" }}
            >
              {labels[i]}
            </span>
            <span className="font-black text-base sm:text-xl flex-1 text-left leading-snug text-white">
              {opt}
            </span>
            <span
              className="font-mono font-black text-sm shrink-0 px-2.5 py-1 rounded-lg text-white"
              style={{ background: "rgba(0,0,0,0.28)" }}
            >
              {counts[i] ?? 0}
            </span>
          </div>
        ))}
      </div>

      {/* Reveal button */}
      <div className="px-5 pb-5 flex justify-end shrink-0">
        <button
          onClick={onReveal}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-40"
          style={{ background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.20)", color: "white" }}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <SkipForward className="size-4" />}
          {revealLabel}
        </button>
      </div>
    </FullScreenQuizShell>
  );
}

// ─── Reveal View ─────────────────────────────────────────────────────────────

function RevealView({ options, counts, total, correctIndex, leaderboard, onNext, loading }: {
  options: string[]; counts: number[]; total: number; correctIndex: number | undefined;
  leaderboard: { nickname: string; score: number }[];
  onNext: () => void; loading: boolean;
}) {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <FullScreenQuizShell>
      {showConfetti && <Confetti />}
      <div className="flex flex-col gap-4 p-4 sm:p-6 overflow-auto min-h-full">

        {/* Correct answer banner */}
        {correctIndex !== undefined && (
          <div
            className={`${OPTION_COLORS[correctIndex]} rounded-2xl p-4 sm:p-5 flex items-center gap-4 chunky-shadow animate-bounce-in`}
            style={{ border: "3px solid rgba(0,0,0,0.12)" }}
          >
            <span
              className="size-12 grid place-items-center rounded-xl font-black text-xl shrink-0 text-white"
              style={{ background: "rgba(0,0,0,0.20)" }}
            >
              {labels[correctIndex]}
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.60)" }}>
                {t("liveQuizHostPage.sections.correctAnswer", { defaultValue: "Correct answer" })}
              </p>
              <p className="font-black text-lg text-white">{options[correctIndex]}</p>
            </div>
            <Check className="size-7 ml-auto shrink-0 text-white" strokeWidth={3} />
          </div>
        )}

        {/* Answer distribution */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.07)" }}>
          <h3 className="text-xs font-black uppercase tracking-wider text-white/50 flex items-center gap-2">
            <Zap className="size-4 text-primary" strokeWidth={2.5} />
            {t("liveQuizHostPage.sections.answerDistribution", { defaultValue: "Answer distribution" })}
          </h3>
          {options.map((opt, i) => {
            const pct = Math.round(((counts[i] ?? 0) / total) * 100);
            const correct = i === correctIndex;
            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className={`flex items-center gap-1.5 ${correct ? "text-white" : "text-white/50"}`}>
                    {correct && <Check className="size-3.5 text-emerald-400" strokeWidth={3} />}
                    {labels[i]}. {opt}
                  </span>
                  <span className="font-mono text-xs text-white/45">{counts[i] ?? 0} · {pct}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.10)" }}>
                  <div
                    className="h-full rounded-full animate-answer-bar"
                    style={{
                      width: `${pct}%`,
                      background: correct ? "#4ade80" : OPTION_BAR_HEX[i],
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {leaderboard.length > 0 && (
          <QuizLeaderboard title={t("liveQuizHostPage.sections.topPlayers", { defaultValue: "Top players" })} players={leaderboard} />
        )}

        <div className="flex justify-end mt-auto pt-2">
          <button
            onClick={onNext}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-black chunky-shadow hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <SkipForward className="size-4" />}
            {t("liveQuizHostPage.actions.nextQuestion", { defaultValue: "Next question" })}
          </button>
        </div>
      </div>
    </FullScreenQuizShell>
  );
}

// ─── Finished ────────────────────────────────────────────────────────────────

function Finished({ playerCount, leaderboard, pin, onAnalytics, onNew }: {
  playerCount: number; leaderboard: { nickname: string; score: number }[];
  pin: string | null; onAnalytics: () => void; onNew: () => void;
}) {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  // Podium: 2nd | 1st | 3rd
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : [];
  const podiumHeights = ["h-16", "h-24", "h-12"];
  const podiumBg = ["bg-zinc-300", "bg-yellow-400", "bg-amber-600"];
  const podiumEmoji = ["🥈", "🥇", "🥉"];
  const compactRanks = leaderboard.length < 3 ? leaderboard : [];

  return (
    <FullScreenQuizShell>
      {showConfetti && <Confetti count={48} />}
      <div className="flex flex-col items-center justify-center min-h-full gap-7 p-6 text-center">

        <div className="space-y-3 animate-bounce-in">
          <div
            className="size-24 mx-auto rounded-3xl grid place-items-center"
            style={{ background: "rgba(250,204,21,0.15)", border: "2px solid rgba(250,204,21,0.30)" }}
          >
            <Trophy className="size-14 text-yellow-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black">
            {t("liveQuizHostPage.finished.title", { defaultValue: "Quiz complete!" })}
          </h2>
          <p className="text-white/50 font-bold">
            {t("liveQuizHostPage.finished.players", { count: playerCount, defaultValue: "{{count}} players participated" })}
          </p>
        </div>

        {/* Podium */}
        {podiumOrder.length === 3 && (
          <div className="flex items-end justify-center gap-3 w-full max-w-xs">
            {podiumOrder.map((p, idx) => (
              <div key={p.nickname} className="flex flex-col items-center gap-1 flex-1">
                <span className="font-black text-xs text-white/80 truncate max-w-full px-1">{p.nickname}</span>
                <span className="text-[10px] font-mono text-white/35">{p.score.toLocaleString()}</span>
                <div className={`w-full ${podiumHeights[idx]} ${podiumBg[idx]} rounded-t-xl grid place-items-center`}>
                  <span className="text-2xl">{podiumEmoji[idx]}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {compactRanks.length > 0 && (
          <div className="w-full max-w-xs rounded-2xl p-4 space-y-1.5" style={{ background: "rgba(255,255,255,0.07)" }}>
            {compactRanks.map((p, i) => (
              <div key={p.nickname} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                <span className="size-7 grid place-items-center rounded-lg font-black text-xs text-white" style={{ background: "rgba(255,255,255,0.12)" }}>{i + 1}</span>
                <span className="font-black flex-1 text-left text-sm">{p.nickname}</span>
                <span className="font-mono text-xs text-white/45">{p.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {rest.length > 0 && (
          <div className="w-full max-w-xs rounded-2xl p-4 space-y-1.5" style={{ background: "rgba(255,255,255,0.07)" }}>
            {rest.map((p, i) => (
              <div key={p.nickname} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                <span className="size-7 grid place-items-center rounded-lg font-black text-xs text-white" style={{ background: "rgba(255,255,255,0.12)" }}>{i + 4}</span>
                <span className="font-black flex-1 text-left text-sm">{p.nickname}</span>
                <span className="font-mono text-xs text-white/45">{p.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 flex-wrap justify-center">
          {pin && (
            <button
              onClick={onAnalytics}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity"
              style={{ background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.20)", color: "white" }}
            >
              <BarChart3 className="size-4" />
              {t("liveQuizHostPage.actions.fullAnalytics", { defaultValue: "Full analytics" })}
            </button>
          )}
          <button
            onClick={onNew}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-black chunky-shadow hover:scale-105 transition-transform cursor-pointer"
          >
            <Plus className="size-4" />
            {t("liveQuizHostPage.actions.newSession", { defaultValue: "New session" })}
          </button>
        </div>
      </div>
    </FullScreenQuizShell>
  );
}

// ─── Leaderboard (dark context) ──────────────────────────────────────────────

function QuizLeaderboard({ title, players }: { title: string; players: { nickname: string; score: number }[] }) {
  return (
    <div className="rounded-2xl p-5 space-y-2" style={{ background: "rgba(255,255,255,0.07)" }}>
      <h3 className="text-xs font-black uppercase tracking-wider text-white/50 flex items-center gap-2">
        <Trophy className="size-4 text-yellow-400" strokeWidth={2.5} /> {title}
      </h3>
      <ul className="space-y-1.5">
        {players.slice(0, 5).map((p, i) => (
          <li key={p.nickname} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.06)" }}>
            <span
              className={`size-8 grid place-items-center rounded-lg font-black text-sm ${
                i === 0 ? "bg-yellow-400 text-black" :
                i === 1 ? "bg-zinc-300 text-black" :
                i === 2 ? "bg-amber-600 text-white" : "text-white"
              }`}
              style={i >= 3 ? { background: "rgba(255,255,255,0.12)" } : {}}
            >
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
            </span>
            <span className="font-black flex-1">{p.nickname}</span>
            <span className="font-mono font-black text-primary text-sm">{p.score.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Setup-phase sub-components (unchanged layout) ───────────────────────────

function SetupHeader({ title, setTitle, secs, setSecs }: { title: string; setTitle: (v: string) => void; secs: number; setSecs: (v: number) => void }) {
  const { t } = useTranslation();
  return (
    <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
      <Field label={t("liveQuizHostPage.fields.sessionTitle", { defaultValue: "Session title" })}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50" />
      </Field>
      <Field label={t("liveQuizHostPage.fields.seconds", { defaultValue: "Seconds per question" })}>
        <select value={secs} onChange={(e) => setSecs(+e.target.value)} className="px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50">
          {[10, 15, 20, 30, 45, 60].map((s) => <option key={s} value={s}>{s}s</option>)}
        </select>
      </Field>
    </div>
  );
}

function SourceTabs({ value, onChange, showAi = true }: { value: "manual" | "bank" | "ai"; onChange: (v: "manual" | "bank" | "ai") => void; showAi?: boolean }) {
  const { t } = useTranslation();
  const tabs = [
    { id: "manual" as const, label: t("liveQuizHostPage.tabs.manual", { defaultValue: "Build manually" }), icon: Pencil },
    { id: "bank" as const, label: t("liveQuizHostPage.tabs.bank", { defaultValue: "From quiz bank" }), icon: Library },
    { id: "ai" as const, label: t("liveQuizHostPage.tabs.ai", { defaultValue: "Generate with AI" }), icon: Sparkles },
  ];
  const visibleTabs = showAi ? tabs : tabs.filter((tab) => tab.id !== "ai");
  return (
    <div className="bg-card border-2 border-border rounded-3xl p-1 chunky-shadow flex gap-1">
      {visibleTabs.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onChange(id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${value === id ? "bg-primary text-primary-foreground chunky-shadow" : "text-foreground/50 hover:text-foreground hover:bg-muted"}`}>
          <Icon className="size-4" /><span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

function BankPanel({ templates, loading, selectedTemplateId, setSelectedTemplateId, onLoad }: { templates: { id: number; title: string; questionCount: number; courseName?: string | null }[]; loading: boolean; selectedTemplateId: number | null; setSelectedTemplateId: (id: number) => void; onLoad: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4">
      <p className="text-xs font-black uppercase tracking-wider text-foreground/50">{t("liveQuizHostPage.fields.pickTemplate", { defaultValue: "Pick a quiz template" })}</p>
      {loading ? <Loader2 className="size-5 animate-spin" /> : templates.length === 0 ? (
        <p className="text-sm text-foreground/40 font-medium py-4 text-center">{t("liveQuizHostPage.empty.noSaved", { defaultValue: "No saved quizzes yet. Generate with AI and save to the bank." })}</p>
      ) : (
        <ul className="space-y-1 max-h-60 overflow-y-auto">
          {templates.map((tpl) => (
            <li key={tpl.id}>
              <button onClick={() => setSelectedTemplateId(tpl.id)} className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer ${selectedTemplateId === tpl.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{tpl.title}</p>
                    <p className="text-[11px] text-foreground/50">{t("liveQuizHostPage.labels.questionCount", { count: tpl.questionCount, defaultValue: "{{count}} questions" })}{tpl.courseName ? ` · ${tpl.courseName}` : ""}</p>
                  </div>
                  {selectedTemplateId === tpl.id && <Check className="size-4 text-primary" />}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={onLoad} disabled={!selectedTemplateId} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary text-secondary-foreground font-bold text-sm disabled:opacity-50 cursor-pointer">
        <Library className="size-4" /> {t("liveQuizHostPage.actions.loadQuestions", { defaultValue: "Load questions" })}
      </button>
    </div>
  );
}

function AiPanel({ topic, setTopic, count, setCount, loading, onGenerate }: { topic: string; setTopic: (v: string) => void; count: number; setCount: (v: number) => void; loading: boolean; onGenerate: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4">
      <p className="text-xs font-black uppercase tracking-wider text-foreground/50">{t("liveQuizHostPage.fields.generateWithAi", { defaultValue: "Generate questions with AI" })}</p>
      <Field label={t("liveQuizHostPage.fields.topic", { defaultValue: "Topic" })}>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t("liveQuizHostPage.placeholders.topic", { defaultValue: "e.g. Photosynthesis, World War II, Python functions…" })} maxLength={160} className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50" />
      </Field>
      <Field label={t("liveQuizHostPage.fields.numberOfQuestions", { defaultValue: "Number of questions" })}>
        <select value={count} onChange={(e) => setCount(+e.target.value)} className="px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50">
          {[3, 5, 8, 10, 15, 20].map((n) => <option key={n} value={n}>{t("liveQuizHostPage.labels.questionCount", { count: n, defaultValue: "{{count}} questions" })}</option>)}
        </select>
      </Field>
      <button onClick={onGenerate} disabled={loading || !topic.trim()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-black chunky-shadow disabled:opacity-50 cursor-pointer">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {loading ? t("liveQuizHostPage.actions.generating", { defaultValue: "Generating…" }) : t("liveQuizHostPage.actions.generate", { defaultValue: "Generate" })}
      </button>
    </div>
  );
}

function QuestionEditor({ questions, setQuestions, updateQuestion, updateOption }: { questions: SetupQuestion[]; setQuestions: (v: SetupQuestion[]) => void; updateQuestion: (i: number, patch: Partial<SetupQuestion>) => void; updateOption: (qi: number, oi: number, val: string) => void }) {
  const { t } = useTranslation();
  return (
    <>
      {questions.map((sq, qi) => (
        <div key={qi} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-foreground/50">{t("liveQuizHostPage.labels.questionNumber", { number: qi + 1, defaultValue: "Question {{number}}" })}</p>
            {questions.length > 1 && <button onClick={() => setQuestions(questions.filter((_, i) => i !== qi))} className="text-destructive/70 hover:text-destructive cursor-pointer"><Trash2 className="size-4" /></button>}
          </div>
          <textarea value={sq.text} onChange={(e) => updateQuestion(qi, { text: e.target.value })} placeholder={t("liveQuizHostPage.placeholders.questionText", { defaultValue: "Question text…" })} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50" />
          <div className="grid grid-cols-2 gap-2">
            {sq.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <button onClick={() => updateQuestion(qi, { correctIndex: oi })} className={`size-7 shrink-0 rounded-lg border-2 font-black text-xs grid place-items-center transition-colors cursor-pointer ${sq.correctIndex === oi ? "bg-primary border-primary text-primary-foreground" : "border-border text-foreground/40 hover:border-primary/50"}`}>{labels[oi]}</button>
                <input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={t("liveQuizHostPage.placeholders.option", { label: labels[oi], defaultValue: "Option {{label}}" })} className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50" />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-foreground/40 font-bold">{t("liveQuizHostPage.help.correctAnswer", { defaultValue: "Click a letter to mark the correct answer" })}</p>
        </div>
      ))}
    </>
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

// ─── Prototype page ───────────────────────────────────────────────────────────

function PrototypeLiveQuizHostPage() {
  const { t } = useTranslation();
  const SECONDS = 20;
  const [phase, setPhase] = useState<"lobby" | "question" | "reveal">("lobby");
  const [joined, setJoined] = useState(4);
  const [time, setTime] = useState(SECONDS);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const pin = "734 218";
  const options = [
    t("liveQuizHostPage.prototype.optionA", { defaultValue: "Visuospatial sketchpad" }),
    t("liveQuizHostPage.prototype.optionB", { defaultValue: "Phonological loop" }),
    t("liveQuizHostPage.prototype.optionC", { defaultValue: "Episodic buffer" }),
    t("liveQuizHostPage.prototype.optionD", { defaultValue: "Central executive" }),
  ] as [string, string, string, string];

  useEffect(() => {
    if (phase !== "lobby") return;
    const id = setInterval(() => setJoined((j) => Math.min(PLAYERS.length, j + 1)), 1800);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "question") return;
    if (time <= 0) { setPhase("reveal"); return; }
    const id = setInterval(() => {
      setTime((v) => v - 1);
      setCounts((c) => c.map((v) => v + Math.floor(Math.random() * 2)));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, time]);

  const total = counts.reduce((a, b) => a + b, 0) || 1;

  if (phase === "lobby") {
    return (
      <Lobby
        pin={pin}
        playerCount={joined}
        players={PLAYERS.slice(0, joined).map((nickname) => ({ nickname }))}
        onStart={() => { setPhase("question"); setTime(SECONDS); setCounts([0, 0, 0, 0]); }}
        loading={false}
      />
    );
  }
  if (phase === "question") {
    return (
      <QuestionView
        index={2} total={10} time={time} totalTime={SECONDS} answered={total - 1}
        text={t("liveQuizHostPage.prototype.question", { defaultValue: "In Baddeley's model, which slave system processes verbal information?" })}
        options={options} counts={counts}
        onReveal={() => setPhase("reveal")}
        revealLabel={t("liveQuizHostPage.actions.skipToResults", { defaultValue: "Skip to results" })}
        loading={false}
      />
    );
  }
  return (
    <RevealView
      options={options} counts={counts} total={total} correctIndex={1}
      leaderboard={PLAYERS.slice(0, 5).map((nickname, index) => ({ nickname, score: 2800 - index * 250 }))}
      onNext={() => { setPhase("question"); setTime(SECONDS); setCounts([0, 0, 0, 0]); }}
      loading={false}
    />
  );
}

// ─── Backend page ─────────────────────────────────────────────────────────────

function BackendLiveQuizHostPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const aiEnabled = Boolean(context.featureFlags.ai);
  const navigate = useNavigate({ from: "/live-quiz-host" });
  const [phase, setPhase] = useState<"setup" | "lobby" | "question" | "reveal" | "finished">("setup");
  const [pin, setPin] = useState<string | null>(null);
  const [title, setTitle] = useState("Live Quiz");
  const [secs, setSecs] = useState(20);
  const [setupQuestions, setSetupQuestions] = useState<SetupQuestion[]>([emptyQuestion()]);
  const [sourceTab, setSourceTab] = useState<"manual" | "bank" | "ai">("manual");
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const createMutation = useCreateLiveQuiz();
  const nextMutation = useNextQuestion();
  const revealMutation = useRevealAnswer();
  const generateAiMutation = useGenerateLiveQuizDraft();
  const saveToBank = useCreateQuizTemplate();
  const templatesQuery = useQuizTemplates();
  const stateQuery = useLiveQuizState(pin, phase !== "setup");
  const state = stateQuery.data;

  useEffect(() => {
    if (!state) return;
    if (state.status === "question" && phase !== "question") setPhase("question");
    else if (state.status === "reveal" && phase !== "reveal") setPhase("reveal");
    else if (state.status === "finished" && phase !== "finished") setPhase("finished");
  }, [state?.status]);

  useEffect(() => {
    if (!aiEnabled && sourceTab === "ai") setSourceTab("manual");
  }, [aiEnabled, sourceTab]);

  const handleCreate = async () => {
    if (!setupQuestions.every((q) => q.text.trim() && q.options.every((o) => o.trim()))) return toast.error(t("liveQuizHostPage.toast.fillQuestions", { defaultValue: "Fill in all question texts and options." }));
    try {
      const payload: CreateLiveQuizPayload = { title, secondsPerQuestion: secs, questions: setupQuestions.map((q) => ({ text: q.text, options: q.options, correctIndex: q.correctIndex })) };
      const { pin: newPin } = await createMutation.mutateAsync(payload);
      setPin(newPin); setPhase("lobby");
    } catch { toast.error(t("liveQuizHostPage.toast.createFailed", { defaultValue: "Failed to create session." })); }
  };
  const handleNext = async () => { if (!pin) return; try { await nextMutation.mutateAsync(pin); } catch { toast.error(t("liveQuizHostPage.toast.nextFailed", { defaultValue: "Failed to advance question." })); } };
  const handleReveal = async () => { if (!pin) return; try { await revealMutation.mutateAsync(pin); } catch { toast.error(t("liveQuizHostPage.toast.revealFailed", { defaultValue: "Failed to reveal answer." })); } };
  const handleGenerateAi = async () => {
    if (!aiTopic.trim()) return toast.error(t("liveQuizHostPage.toast.enterTopic", { defaultValue: "Enter a topic first." }));
    try {
      const result = await generateAiMutation.mutateAsync({ topic: aiTopic.trim(), questionCount: aiCount });
      setSetupQuestions(result.questions.map((q) => ({ text: q.text, options: q.options, correctIndex: q.correctIndex })));
      setTitle(t("liveQuizHostPage.labels.aiTitle", { topic: aiTopic.trim(), defaultValue: "{{topic}} — Live Quiz" }));
      setSourceTab("manual");
      toast.success(t("liveQuizHostPage.toast.generated", { count: result.questions.length, defaultValue: "{{count}} questions generated — review before launching." }));
    } catch { toast.error(t("liveQuizHostPage.toast.aiFailed", { defaultValue: "AI generation failed. Check that AI is configured." })); }
  };
  const handleLoadFromBank = () => {
    const tpl = (templatesQuery.data ?? []).find((item) => item.id === selectedTemplateId);
    if (!tpl) return toast.error(t("liveQuizHostPage.toast.selectTemplate", { defaultValue: "Select a template first." }));
    try {
      const parsed = JSON.parse(tpl.content) as { __type?: string; questions?: SetupQuestion[] };
      if (parsed.__type !== "live_quiz" || !Array.isArray(parsed.questions) || parsed.questions.length === 0) return toast.error(t("liveQuizHostPage.toast.badTemplate", { defaultValue: "This template doesn't have structured questions. Try generating with AI." }));
      setSetupQuestions(parsed.questions); setTitle(tpl.title); setSourceTab("manual");
      toast.success(t("liveQuizHostPage.toast.loaded", { count: parsed.questions.length, title: tpl.title, defaultValue: "Loaded {{count}} questions from \"{{title}}\"." }));
    } catch { toast.error(t("liveQuizHostPage.toast.loadFailed", { defaultValue: "This template can't be loaded as questions. Use AI generation instead." })); }
  };
  const handleSaveToBank = async () => {
    if (!setupQuestions.every((q) => q.text.trim() && q.options.every((o) => o.trim()))) return toast.error(t("liveQuizHostPage.toast.fillBeforeSave", { defaultValue: "Fill in all questions before saving." }));
    try {
      await saveToBank.mutateAsync({ title: title || "Live Quiz", content: JSON.stringify({ __type: "live_quiz", questions: setupQuestions }), questionCount: setupQuestions.length });
      toast.success(t("liveQuizHostPage.toast.saved", { defaultValue: "Saved to Quiz Bank." }));
    } catch { toast.error(t("liveQuizHostPage.toast.saveFailed", { defaultValue: "Failed to save to bank." })); }
  };
  const updateQuestion = (i: number, patch: Partial<SetupQuestion>) => setSetupQuestions((qs) => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const updateOption = (qi: number, oi: number, val: string) => setSetupQuestions((qs) => qs.map((q, idx) => { if (idx !== qi) return q; const options = [...q.options] as SetupQuestion["options"]; options[oi] = val; return { ...q, options }; }));

  const q = state?.question;
  const counts = state?.answerCounts ?? [0, 0, 0, 0];
  const totalAnswers = counts.reduce((a, b) => a + b, 0) || 1;
  const revealCorrectIndex = state?.correctIndex ?? (
    state?.currentQuestionIndex !== undefined
      ? setupQuestions[state.currentQuestionIndex]?.correctIndex
      : undefined
  );
  const topSubtitle = phase === "setup"
    ? t("liveQuizHostPage.topbar.setup", { defaultValue: "Create your session" })
    : t("liveQuizHostPage.topbar.running", { title: state?.title ?? title, count: state?.totalQuestions ?? setupQuestions.length, defaultValue: "{{title}} · {{count}} questions" });

  // Setup stays inside DashboardShell; game phases go full-screen
  if (phase === "setup") {
    return (
      <DashboardShell>
        <TopBar title={t("liveQuizHostPage.topbar.title", { defaultValue: "Live Quiz — Host" })} subtitle={topSubtitle} showStreak={false} />
        <div className="space-y-5 max-w-2xl">
          <SetupHeader title={title} setTitle={setTitle} secs={secs} setSecs={setSecs} />
          <SourceTabs value={sourceTab} onChange={setSourceTab} showAi={aiEnabled} />
          {sourceTab === "bank" && <BankPanel templates={templatesQuery.data ?? []} loading={templatesQuery.isLoading} selectedTemplateId={selectedTemplateId} setSelectedTemplateId={setSelectedTemplateId} onLoad={handleLoadFromBank} />}
          {aiEnabled && sourceTab === "ai" && <AiPanel topic={aiTopic} setTopic={setAiTopic} count={aiCount} setCount={setAiCount} loading={generateAiMutation.isPending} onGenerate={handleGenerateAi} />}
          {sourceTab === "manual" && (
            <>
              <QuestionEditor questions={setupQuestions} setQuestions={setSetupQuestions} updateQuestion={updateQuestion} updateOption={updateOption} />
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setSetupQuestions((qs) => [...qs, emptyQuestion()])} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted cursor-pointer"><Plus className="size-4" /> {t("liveQuizHostPage.actions.addQuestion", { defaultValue: "Add question" })}</button>
                <button onClick={handleSaveToBank} disabled={saveToBank.isPending} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted disabled:opacity-50 cursor-pointer">{saveToBank.isPending ? <Loader2 className="size-4 animate-spin" /> : <Library className="size-4" />} {t("liveQuizHostPage.actions.saveToBank", { defaultValue: "Save to bank" })}</button>
                <button onClick={handleCreate} disabled={createMutation.isPending || !title.trim()} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-black chunky-shadow disabled:opacity-50 ml-auto cursor-pointer">{createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} {createMutation.isPending ? t("liveQuizHostPage.actions.creating", { defaultValue: "Creating…" }) : t("liveQuizHostPage.actions.createSession", { defaultValue: "Create session" })}</button>
              </div>
            </>
          )}
        </div>
      </DashboardShell>
    );
  }

  if (phase === "lobby" && pin) {
    return <Lobby pin={pin} playerCount={state?.playerCount ?? 0} players={state?.players ?? []} onStart={handleNext} loading={nextMutation.isPending} />;
  }
  if (phase === "question" && q) {
    return <QuestionView index={state?.currentQuestionIndex ?? 0} total={state?.totalQuestions ?? setupQuestions.length} time={q.timeLeft ?? secs} totalTime={secs} answered={counts.reduce((a, b) => a + b, 0)} text={q.text} options={q.options} counts={counts} onReveal={handleReveal} revealLabel={t("liveQuizHostPage.actions.revealAnswer", { defaultValue: "Reveal answer" })} loading={revealMutation.isPending} />;
  }
  if (phase === "reveal" && q) {
    return <RevealView options={q.options} counts={counts} total={totalAnswers} correctIndex={revealCorrectIndex} leaderboard={state?.leaderboard ?? []} onNext={handleNext} loading={nextMutation.isPending} />;
  }
  if (phase === "finished") {
    return <Finished playerCount={state?.playerCount ?? 0} leaderboard={state?.leaderboard ?? []} pin={pin} onAnalytics={() => pin && navigate({ to: "/quiz-results", search: { pin } })} onNew={() => { setPhase("setup"); setPin(null); setSetupQuestions([emptyQuestion()]); setTitle("Live Quiz"); }} />;
  }
  return null;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function LiveQuizHostPage() {
  const { context } = useAppContext();
  return context.mode === "backend" ? <BackendLiveQuizHostPage /> : <PrototypeLiveQuizHostPage />;
}
