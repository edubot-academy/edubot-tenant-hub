import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/live-quiz-join")({
  head: () => ({ meta: [{ title: "QuestLMS — Join Quiz" }] }),
  component: LiveQuizJoinPage,
});

const colors = ["bg-[#e63946]", "bg-[#1d99f3]", "bg-[#f4a261]", "bg-[#52b788]"];
const labels = ["A", "B", "C", "D"];

type Phase = "pin" | "name" | "waiting" | "answer" | "feedback";

function LiveQuizJoinPage() {
  const [phase, setPhase] = useState<Phase>("pin");
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
