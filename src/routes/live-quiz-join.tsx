import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Loader2, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppContext } from "@/lib/app-context";
import { useJoinLiveQuiz, useLiveQuizState, useSubmitAnswer } from "@/lib/live-quiz-api";

export const Route = createFileRoute("/live-quiz-join")({
  head: () => ({ meta: [{ title: "QuestLMS — Join Quiz" }] }),
  component: LiveQuizJoinPage,
});

const OPTION_COLORS = ["bg-[#e63946]", "bg-[#1d99f3]", "bg-[#f4a261]", "bg-[#52b788]"];
const OPTION_SHAPES = ["▲", "■", "●", "✦"];
const CONFETTI_COLORS = ["#e63946", "#1d99f3", "#f4a261", "#52b788", "#f7b731", "#a855f7", "#ffffff"];
const labels = ["A", "B", "C", "D"];

function JoinShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-auto p-4 sm:p-6"
      style={{ background: "#0f0f1e", color: "white" }}
    >
      {children}
    </div>
  );
}

function GlassCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`w-full max-w-sm rounded-3xl p-8 space-y-5 text-center chunky-shadow ${className}`}
      style={{ background: "rgba(255,255,255,0.07)", border: "2px solid rgba(255,255,255,0.15)", ...style }}
    >
      {children}
    </div>
  );
}

function BounceDots() {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="size-3 rounded-full bg-white animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.7s" }}
        />
      ))}
    </div>
  );
}

function MiniConfetti({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${Math.round((i / 24) * 100)}%`,
            width: `${6 + (i % 4) * 3}px`,
            height: `${8 + (i % 3) * 4}px`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            borderRadius: i % 3 === 0 ? "50%" : "2px",
            "--confetti-duration": `${1.1 + (i % 5) * 0.2}s`,
            "--confetti-delay": `${(i * 0.05) % 0.7}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── Prototype page ───────────────────────────────────────────────────────────

type ProtoPhase = "pin" | "name" | "waiting" | "answer" | "feedback";

function PrototypeLiveQuizJoinPage() {
  const [phase, setPhase] = useState<ProtoPhase>("pin");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [time, setTime] = useState(15);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const correctIndex = 1;

  useEffect(() => {
    if (phase !== "waiting") return;
    const id = setTimeout(() => { setPhase("answer"); setTime(15); setPicked(null); }, 1800);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "answer") return;
    if (time <= 0 || picked !== null) {
      const t = setTimeout(() => {
        if (picked === correctIndex) {
          setScore((s) => s + 800 + time * 20);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2400);
        }
        setPhase("feedback");
      }, 400);
      return () => clearTimeout(t);
    }
    const id = setInterval(() => setTime((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, time, picked]);

  const isCorrect = picked === correctIndex;

  return (
    <JoinShell>
      <MiniConfetti show={showConfetti} />
      <div className="w-full max-w-sm flex flex-col items-center gap-4">

        {phase === "pin" && (
          <form onSubmit={(e) => { e.preventDefault(); if (pin.trim()) setPhase("name"); }} className="contents">
            <GlassCard>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-black text-xs uppercase tracking-wider mx-auto"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <Sparkles className="size-3.5" strokeWidth={3} /> QuestLMS Live
              </div>
              <h1 className="text-3xl font-black">Enter game PIN</h1>
              <input
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                className="w-full text-5xl text-center font-black font-mono tracking-widest p-5 rounded-2xl outline-none placeholder:opacity-30 focus:ring-2 focus:ring-white/40"
                style={{ background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.2)", color: "white" }}
              />
              <button
                type="submit"
                disabled={!pin}
                className="w-full px-5 py-4 rounded-2xl font-black text-lg chunky-shadow disabled:opacity-40 transition-opacity"
                style={{ background: "var(--primary)", color: "white" }}
              >
                Enter →
              </button>
            </GlassCard>
          </form>
        )}

        {phase === "name" && (
          <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) setPhase("waiting"); }} className="contents">
            <GlassCard>
              <h1 className="text-3xl font-black">Pick a nickname</h1>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 16))}
                placeholder="Your name"
                className="w-full text-2xl text-center font-black p-4 rounded-2xl outline-none placeholder:opacity-30 focus:ring-2 focus:ring-white/40"
                style={{ background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.2)", color: "white" }}
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full px-5 py-4 rounded-2xl font-black text-lg chunky-shadow disabled:opacity-40"
                style={{ background: "var(--primary)", color: "white" }}
              >
                Join game
              </button>
            </GlassCard>
          </form>
        )}

        {phase === "waiting" && (
          <GlassCard>
            <BounceDots />
            <p className="text-2xl font-black">You're in, {name}!</p>
            <p className="text-sm font-bold opacity-60">Get ready — question coming up…</p>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-black text-lg mx-auto"
              style={{ background: "var(--primary)" }}
            >
              <Zap className="size-4" strokeWidth={2.5} /> {score} pts
            </div>
          </GlassCard>
        )}

        {phase === "answer" && (
          <div className="w-full space-y-3">
            <div
              className="flex items-center justify-between px-4 py-3 rounded-2xl chunky-shadow"
              style={{ background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.12)" }}
            >
              <span className="font-black text-sm truncate">{name}</span>
              <span className="font-mono font-black">{score} pts</span>
              <span className={`size-10 grid place-items-center rounded-xl font-mono font-black border-2 ${time < 5 ? "border-red-400 text-red-400" : "border-white/40"}`}>
                {time}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <button
                  key={i}
                  onClick={() => setPicked(i)}
                  disabled={picked !== null}
                  className={`${OPTION_COLORS[i]} rounded-3xl aspect-square grid place-items-center font-black text-white transition-all duration-150 chunky-shadow
                    ${picked === i ? "scale-95 ring-4 ring-white" : "hover:scale-105 active:scale-95"}
                    ${picked !== null && picked !== i ? "opacity-20" : ""}
                  `}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl opacity-90">{OPTION_SHAPES[i]}</span>
                    <span className="text-4xl">{labels[i]}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-xs font-bold opacity-40">Look at the host screen for the question</p>
          </div>
        )}

        {phase === "feedback" && (
          <GlassCard className={isCorrect ? "" : ""} style={{ borderColor: isCorrect ? "rgba(82,183,136,0.4)" : "rgba(230,57,70,0.4)", background: isCorrect ? "rgba(82,183,136,0.12)" : "rgba(230,57,70,0.12)" } as React.CSSProperties}>
            <div className="text-5xl">{isCorrect ? "🎉" : picked === null ? "⏰" : "😬"}</div>
            <p className="text-3xl font-black">{isCorrect ? "Correct!" : picked === null ? "Time up" : "Not quite"}</p>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono font-black text-3xl">{score}</span>
              <span className="text-xs font-bold opacity-50">points</span>
            </div>
            <BounceDots />
            <p className="text-xs font-bold opacity-40">Waiting for next question…</p>
          </GlassCard>
        )}
      </div>
    </JoinShell>
  );
}

// ─── Backend page ─────────────────────────────────────────────────────────────

type BackendPhase = "pin" | "name" | "joining" | "waiting" | "answer" | "feedback" | "finished";

function BackendLiveQuizJoinPage() {
  const [phase, setPhase] = useState<BackendPhase>("pin");
  const [pinInput, setPinInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [score, setScore] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [lastAwarded, setLastAwarded] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const answerSubmitted = useRef(false);

  const joinMutation = useJoinLiveQuiz();
  const submitMutation = useSubmitAnswer();

  const pollingPin = phase !== "pin" && phase !== "name" && phase !== "joining" ? pinInput : null;
  const stateQuery = useLiveQuizState(pollingPin, !!pollingPin);
  const state = stateQuery.data;

  useEffect(() => {
    if (!state || !playerId) return;
    if (state.status === "finished" && phase !== "finished") {
      setPhase("finished");
      return;
    }
    if (state.status === "question" && (phase === "waiting" || phase === "feedback")) {
      setPicked(null);
      answerSubmitted.current = false;
      setPhase("answer");
    }
    if (state.status === "reveal" && phase === "answer" && !answerSubmitted.current) {
      setLastCorrect(false);
      setLastAwarded(0);
      setPhase("feedback");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.status, state?.currentQuestionIndex]);

  const handleJoin = async () => {
    if (!pinInput.trim() || !nameInput.trim()) return;
    setPhase("joining");
    try {
      const result = await joinMutation.mutateAsync({ pin: pinInput, nickname: nameInput });
      setPlayerId(result.playerId);
      setNickname(result.nickname);
      setPhase("waiting");
    } catch {
      setPhase("name");
    }
  };

  const handleAnswer = async (selectedIndex: number) => {
    if (!playerId || !pollingPin || answerSubmitted.current) return;
    setPicked(selectedIndex);
    answerSubmitted.current = true;
    try {
      const result = await submitMutation.mutateAsync({ pin: pollingPin, playerId, selectedIndex });
      setLastCorrect(result.correct);
      setLastAwarded(result.score);
      setScore(result.totalScore);
      if (result.correct) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2400);
      }
      setPhase("feedback");
    } catch {
      setLastCorrect(false);
      setLastAwarded(0);
      setPhase("feedback");
    }
  };

  const timeLeft = state?.question?.timeLeft ?? 0;

  return (
    <JoinShell>
      <MiniConfetti show={showConfetti} />
      <div className="w-full max-w-sm flex flex-col items-center gap-4">

        {phase === "pin" && (
          <form onSubmit={(e) => { e.preventDefault(); if (pinInput.trim()) setPhase("name"); }} className="contents">
            <GlassCard>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-black text-xs uppercase tracking-wider mx-auto"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <Sparkles className="size-3.5" strokeWidth={3} /> QuestLMS Live
              </div>
              <h1 className="text-3xl font-black">Enter game PIN</h1>
              <input
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                className="w-full text-5xl text-center font-black font-mono tracking-widest p-5 rounded-2xl outline-none placeholder:opacity-30 focus:ring-2 focus:ring-white/40"
                style={{ background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.2)", color: "white" }}
              />
              <button
                type="submit"
                disabled={pinInput.length < 6}
                className="w-full px-5 py-4 rounded-2xl font-black text-lg chunky-shadow disabled:opacity-40"
                style={{ background: "var(--primary)", color: "white" }}
              >
                Enter →
              </button>
            </GlassCard>
          </form>
        )}

        {phase === "name" && (
          <form onSubmit={(e) => { e.preventDefault(); handleJoin(); }} className="contents">
            <GlassCard>
              <h1 className="text-3xl font-black">Pick a nickname</h1>
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value.slice(0, 30))}
                placeholder="Your name"
                className="w-full text-2xl text-center font-black p-4 rounded-2xl outline-none placeholder:opacity-30 focus:ring-2 focus:ring-white/40"
                style={{ background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.2)", color: "white" }}
              />
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="w-full px-5 py-4 rounded-2xl font-black text-lg chunky-shadow disabled:opacity-40"
                style={{ background: "var(--primary)", color: "white" }}
              >
                Join game
              </button>
            </GlassCard>
          </form>
        )}

        {phase === "joining" && (
          <GlassCard>
            <Loader2 className="size-12 mx-auto animate-spin opacity-70" strokeWidth={2.5} />
            <p className="text-xl font-black">Joining…</p>
          </GlassCard>
        )}

        {phase === "waiting" && (
          <GlassCard>
            <BounceDots />
            <p className="text-2xl font-black">You're in, {nickname}!</p>
            <p className="text-sm font-bold opacity-60">Get ready — question coming up…</p>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-black text-lg mx-auto"
              style={{ background: "var(--primary)" }}
            >
              <Zap className="size-4" strokeWidth={2.5} /> {score} pts
            </div>
          </GlassCard>
        )}

        {phase === "answer" && (
          <div className="w-full space-y-3">
            <div
              className="flex items-center justify-between px-4 py-3 rounded-2xl chunky-shadow"
              style={{ background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.12)" }}
            >
              <span className="font-black text-sm truncate">{nickname}</span>
              <span className="font-mono font-black">{score} pts</span>
              <span className={`size-10 grid place-items-center rounded-xl font-mono font-black border-2 ${timeLeft < 5 ? "border-red-400 text-red-400" : "border-white/40"}`}>
                {timeLeft}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={picked !== null || submitMutation.isPending}
                  className={`${OPTION_COLORS[i]} rounded-3xl aspect-square grid place-items-center font-black text-white transition-all duration-150 chunky-shadow
                    ${picked === i ? "scale-95 ring-4 ring-white" : "hover:scale-105 active:scale-95"}
                    ${picked !== null && picked !== i ? "opacity-20" : ""}
                  `}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl opacity-90">{OPTION_SHAPES[i]}</span>
                    <span className="text-4xl">{labels[i]}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-xs font-bold opacity-40">Look at the host screen for the question</p>
          </div>
        )}

        {phase === "feedback" && (
          <GlassCard style={{ borderColor: lastCorrect ? "rgba(82,183,136,0.4)" : "rgba(230,57,70,0.4)", background: lastCorrect ? "rgba(82,183,136,0.12)" : "rgba(230,57,70,0.12)" } as React.CSSProperties}>
            <div className="text-5xl">{lastCorrect ? "🎉" : picked === null ? "⏰" : "😬"}</div>
            <p className="text-3xl font-black">
              {lastCorrect ? "Correct!" : picked === null ? "Time up" : "Not quite"}
            </p>
            {lastCorrect && lastAwarded > 0 && (
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono font-black text-sm mx-auto"
                style={{ background: "rgba(82,183,136,0.25)", border: "1px solid rgba(82,183,136,0.5)" }}
              >
                +{lastAwarded} pts this round
              </div>
            )}
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono font-black text-3xl">{score}</span>
              <span className="text-xs font-bold opacity-50">total points</span>
            </div>
            <BounceDots />
            <p className="text-xs font-bold opacity-40">Waiting for next question…</p>
          </GlassCard>
        )}

        {phase === "finished" && (
          <GlassCard>
            <div className="text-5xl">🏆</div>
            <p className="text-3xl font-black">Quiz over!</p>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono font-black text-4xl">{score}</span>
              <span className="text-xs font-bold opacity-50">final score for {nickname}</span>
            </div>
            <button
              onClick={() => { setPhase("pin"); setPinInput(""); setNameInput(""); setScore(0); setPlayerId(null); }}
              className="w-full px-5 py-3 rounded-2xl font-black chunky-shadow"
              style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.2)" }}
            >
              Play again
            </button>
          </GlassCard>
        )}
      </div>
    </JoinShell>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function LiveQuizJoinPage() {
  const { context } = useAppContext();
  return context.mode === "backend" ? <BackendLiveQuizJoinPage /> : <PrototypeLiveQuizJoinPage />;
}
