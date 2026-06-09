import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Trophy, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppContext } from "@/lib/app-context";
import { useJoinLiveQuiz, useLiveQuizState, useSubmitAnswer } from "@/lib/live-quiz-api";

export const Route = createFileRoute("/live-quiz-join")({
  head: () => ({ meta: [{ title: "QuestLMS — Join Quiz" }] }),
  component: LiveQuizJoinPage,
});

const colors = ["bg-[#e63946]", "bg-[#1d99f3]", "bg-[#f4a261]", "bg-[#52b788]"];
const labels = ["A", "B", "C", "D"];

// ─── Prototype page ───────────────────────────────────────────────────────────

type ProtoPhase = "pin" | "name" | "waiting" | "answer" | "feedback";

function PrototypeLiveQuizJoinPage() {
  const [phase, setPhase] = useState<ProtoPhase>("pin");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [time, setTime] = useState(15);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (phase !== "waiting") return;
    const id = setTimeout(() => { setPhase("answer"); setTime(15); setPicked(null); }, 1800);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "answer") return;
    if (time <= 0 || picked !== null) {
      const t = setTimeout(() => {
        if (picked === 1) setScore((s) => s + 800 + time * 20);
        setPhase("feedback");
      }, 400);
      return () => clearTimeout(t);
    }
    const id = setInterval(() => setTime((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, time, picked]);

  return (
    <div className="min-h-svh w-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 grid place-items-center p-6">
      <div className="w-full max-w-md">
        {phase === "pin" && (
          <form onSubmit={(e) => { e.preventDefault(); if (pin.trim()) setPhase("name"); }}
            className="bg-card border-4 border-foreground rounded-3xl p-8 chunky-shadow space-y-5 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary font-black text-xs uppercase tracking-wider">
              <Sparkles className="size-3.5" strokeWidth={3} /> QuestLMS Live
            </div>
            <h1 className="text-3xl font-black">Enter game PIN</h1>
            <input
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              className="w-full text-5xl text-center font-black font-mono tracking-widest p-5 bg-background border-4 border-border rounded-2xl outline-none focus:border-primary"
            />
            <button type="submit" disabled={!pin}
              className="w-full px-5 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg chunky-shadow disabled:opacity-50">
              Enter
            </button>
          </form>
        )}

        {phase === "name" && (
          <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) setPhase("waiting"); }}
            className="bg-card border-4 border-foreground rounded-3xl p-8 chunky-shadow space-y-5 text-center">
            <h1 className="text-3xl font-black">Pick a nickname</h1>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 16))}
              placeholder="Your name"
              className="w-full text-2xl text-center font-black p-4 bg-background border-4 border-border rounded-2xl outline-none focus:border-primary"
            />
            <button type="submit" disabled={!name.trim()}
              className="w-full px-5 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg chunky-shadow disabled:opacity-50">
              Join game
            </button>
          </form>
        )}

        {phase === "waiting" && (
          <div className="bg-card border-4 border-foreground rounded-3xl p-10 chunky-shadow text-center space-y-4">
            <div className="size-16 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-2xl font-black">You're in, {name}!</p>
            <p className="text-sm font-bold text-foreground/60">Waiting for host to start the next question…</p>
          </div>
        )}

        {phase === "answer" && (
          <div className="space-y-4">
            <div className="bg-card border-4 border-foreground rounded-2xl p-4 chunky-shadow flex items-center justify-between">
              <span className="font-black text-sm">{name}</span>
              <span className="font-mono font-black text-primary">{score} pts</span>
              <span className={`size-10 grid place-items-center rounded-xl border-4 font-mono font-black ${time < 5 ? "border-destructive text-destructive" : "border-primary text-primary"}`}>{time}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <button key={i}
                  onClick={() => setPicked(i)}
                  disabled={picked !== null}
                  className={`${colors[i]} text-white rounded-3xl aspect-square border-4 border-foreground chunky-shadow grid place-items-center font-black text-5xl transition-transform ${picked === i ? "scale-95 ring-4 ring-white" : "hover:scale-105"} ${picked !== null && picked !== i ? "opacity-30" : ""}`}>
                  {labels[i]}
                </button>
              ))}
            </div>
            <p className="text-center text-xs font-bold text-foreground/60">Look at the host screen for the question</p>
          </div>
        )}

        {phase === "feedback" && (
          <div className={`border-4 border-foreground rounded-3xl p-10 chunky-shadow text-center space-y-4 ${picked === 1 ? "bg-primary/20" : "bg-destructive/20"}`}>
            <Trophy className={`size-16 mx-auto ${picked === 1 ? "text-primary" : "text-destructive"}`} strokeWidth={2.5} />
            <p className="text-3xl font-black">{picked === 1 ? "Correct!" : picked === null ? "Time up" : "Not quite"}</p>
            <p className="font-mono font-black text-2xl text-primary">{score} pts</p>
            <p className="text-sm font-bold text-foreground/60">You're in 4th place</p>
            <button onClick={() => setPhase("waiting")}
              className="px-5 py-3 rounded-2xl bg-foreground text-background font-black chunky-shadow">
              Next question
            </button>
          </div>
        )}
      </div>
    </div>
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
      setPhase("feedback");
    } catch {
      setLastCorrect(false);
      setLastAwarded(0);
      setPhase("feedback");
    }
  };

  const timeLeft = state?.question?.timeLeft ?? 0;

  return (
    <div className="min-h-svh w-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 grid place-items-center p-6">
      <div className="w-full max-w-md">

        {phase === "pin" && (
          <form onSubmit={(e) => { e.preventDefault(); if (pinInput.trim()) setPhase("name"); }}
            className="bg-card border-4 border-foreground rounded-3xl p-8 chunky-shadow space-y-5 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary font-black text-xs uppercase tracking-wider">
              <Sparkles className="size-3.5" strokeWidth={3} /> QuestLMS Live
            </div>
            <h1 className="text-3xl font-black">Enter game PIN</h1>
            <input
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              className="w-full text-5xl text-center font-black font-mono tracking-widest p-5 bg-background border-4 border-border rounded-2xl outline-none focus:border-primary"
            />
            <button type="submit" disabled={pinInput.length < 6}
              className="w-full px-5 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg chunky-shadow disabled:opacity-50">
              Enter
            </button>
          </form>
        )}

        {phase === "name" && (
          <form onSubmit={(e) => { e.preventDefault(); handleJoin(); }}
            className="bg-card border-4 border-foreground rounded-3xl p-8 chunky-shadow space-y-5 text-center">
            <h1 className="text-3xl font-black">Pick a nickname</h1>
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value.slice(0, 30))}
              placeholder="Your name"
              className="w-full text-2xl text-center font-black p-4 bg-background border-4 border-border rounded-2xl outline-none focus:border-primary"
            />
            <button type="submit" disabled={!nameInput.trim()}
              className="w-full px-5 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg chunky-shadow disabled:opacity-50">
              Join game
            </button>
          </form>
        )}

        {phase === "joining" && (
          <div className="bg-card border-4 border-foreground rounded-3xl p-10 chunky-shadow text-center space-y-4">
            <Loader2 className="size-12 mx-auto animate-spin text-primary" strokeWidth={2.5} />
            <p className="text-xl font-black">Joining…</p>
          </div>
        )}

        {phase === "waiting" && (
          <div className="bg-card border-4 border-foreground rounded-3xl p-10 chunky-shadow text-center space-y-4">
            <div className="size-16 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-2xl font-black">You're in, {nickname}!</p>
            <p className="text-sm font-bold text-foreground/60">Waiting for host to start the next question…</p>
            <p className="font-mono font-black text-primary">{score} pts</p>
          </div>
        )}

        {phase === "answer" && (
          <div className="space-y-4">
            <div className="bg-card border-4 border-foreground rounded-2xl p-4 chunky-shadow flex items-center justify-between">
              <span className="font-black text-sm">{nickname}</span>
              <span className="font-mono font-black text-primary">{score} pts</span>
              <span className={`size-10 grid place-items-center rounded-xl border-4 font-mono font-black ${timeLeft < 5 ? "border-destructive text-destructive" : "border-primary text-primary"}`}>
                {timeLeft}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <button key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={picked !== null || submitMutation.isPending}
                  className={`${colors[i]} text-white rounded-3xl aspect-square border-4 border-foreground chunky-shadow grid place-items-center font-black text-5xl transition-transform ${picked === i ? "scale-95 ring-4 ring-white" : "hover:scale-105"} ${picked !== null && picked !== i ? "opacity-30" : ""}`}>
                  {labels[i]}
                </button>
              ))}
            </div>
            <p className="text-center text-xs font-bold text-foreground/60">Look at the host screen for the question</p>
          </div>
        )}

        {phase === "feedback" && (
          <div className={`border-4 border-foreground rounded-3xl p-10 chunky-shadow text-center space-y-4 ${lastCorrect ? "bg-primary/20" : "bg-destructive/20"}`}>
            <Trophy className={`size-16 mx-auto ${lastCorrect ? "text-primary" : "text-destructive"}`} strokeWidth={2.5} />
            <p className="text-3xl font-black">
              {lastCorrect ? "Correct!" : picked === null ? "Time up" : "Not quite"}
            </p>
            {lastCorrect && lastAwarded > 0 && (
              <p className="text-sm font-bold text-foreground/60">+{lastAwarded} pts</p>
            )}
            <p className="font-mono font-black text-2xl text-primary">{score} pts</p>
            <div className="size-8 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-xs font-bold text-foreground/50">Waiting for next question…</p>
          </div>
        )}

        {phase === "finished" && (
          <div className="bg-card border-4 border-foreground rounded-3xl p-10 chunky-shadow text-center space-y-4">
            <Trophy className="size-16 mx-auto text-secondary" strokeWidth={2.5} />
            <p className="text-3xl font-black">Quiz over!</p>
            <p className="font-mono font-black text-2xl text-primary">{score} pts</p>
            <p className="text-sm font-bold text-foreground/60">Final score for {nickname}</p>
            <button
              onClick={() => { setPhase("pin"); setPinInput(""); setNameInput(""); setScore(0); setPlayerId(null); }}
              className="px-5 py-3 rounded-2xl bg-foreground text-background font-black chunky-shadow"
            >
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function LiveQuizJoinPage() {
  const { context } = useAppContext();
  return context.mode === "backend" ? <BackendLiveQuizJoinPage /> : <PrototypeLiveQuizJoinPage />;
}
