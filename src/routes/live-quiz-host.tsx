import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Users, Play, SkipForward, Trophy, Zap, Plus, Trash2, Loader2, BarChart3, Sparkles, Library, Pencil, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "@/lib/app-context";
import {
  useCreateLiveQuiz,
  useLiveQuizState,
  useNextQuestion,
  useRevealAnswer,
  useGenerateLiveQuizDraft,
  type CreateLiveQuizPayload,
} from "@/lib/live-quiz-api";
import { useQuizTemplates, useCreateQuizTemplate } from "@/lib/quiz-bank-api";

export const Route = createFileRoute("/live-quiz-host")({
  head: () => ({ meta: [{ title: "QuestLMS — Live Quiz Host" }] }),
  component: LiveQuizHostPage,
});

const PROTOTYPE_PLAYERS = [
  "Mia", "Ben", "Noor", "Theo", "Aya", "Leo", "Ivy", "Sam", "Zoe", "Kai", "Eli", "Ada",
];
const colors = ["bg-[#e63946]", "bg-[#1d99f3]", "bg-[#f4a261]", "bg-[#52b788]"];
const labels = ["A", "B", "C", "D"];

// ─── Prototype page ───────────────────────────────────────────────────────────

function PrototypeLiveQuizHostPage() {
  const [phase, setPhase] = useState<"lobby" | "question" | "reveal">("lobby");
  const [joined, setJoined] = useState(4);
  const [time, setTime] = useState(20);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const pin = "734 218";

  useEffect(() => {
    if (phase !== "lobby") return;
    const id = setInterval(() => setJoined((j) => Math.min(PROTOTYPE_PLAYERS.length, j + 1)), 1800);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "question") return;
    if (time <= 0) { setPhase("reveal"); return; }
    const id = setInterval(() => {
      setTime((t) => t - 1);
      setCounts((c) => c.map((v) => v + Math.floor(Math.random() * 2)));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, time]);

  const total = counts.reduce((a, b) => a + b, 0) || 1;

  return (
    <DashboardShell>
      <TopBar title="Live Quiz — Host" subtitle="Working Memory · 10 questions" showStreak={false} />

      {phase === "lobby" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
          <section className="bg-card border-2 border-border rounded-3xl p-10 chunky-shadow text-center space-y-6">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-foreground/50">Join at questlms.live</p>
            <p className="text-7xl sm:text-8xl font-black tracking-tight font-mono">{pin}</p>
            <p className="text-sm font-bold text-foreground/60">Enter this code on your device</p>
            <button onClick={() => { setPhase("question"); setTime(20); setCounts([0, 0, 0, 0]); }}
              disabled={joined < 1}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-black chunky-shadow disabled:opacity-50">
              <Play className="size-5" strokeWidth={3} /> Start quiz
            </button>
          </section>
          <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black flex items-center gap-2 mb-4">
              <Users className="size-4 text-primary" strokeWidth={2.5} /> {joined} players joined
            </h3>
            <div className="flex flex-wrap gap-2">
              {PROTOTYPE_PLAYERS.slice(0, joined).map((p, i) => (
                <span key={i} className="px-3 py-1.5 rounded-xl bg-secondary/30 border-2 border-secondary font-black text-sm animate-in fade-in zoom-in-95">
                  {p}
                </span>
              ))}
            </div>
          </aside>
        </div>
      )}

      {phase === "question" && (
        <div className="space-y-5">
          <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-foreground/60">Question 3 of 10</p>
            <div className={`size-16 grid place-items-center rounded-2xl border-4 ${time < 6 ? "border-destructive text-destructive" : "border-primary text-primary"} font-mono font-black text-2xl`}>
              {time}
            </div>
            <p className="text-xs font-black uppercase tracking-wider text-foreground/60">{total - 1} answered</p>
          </div>
          <div className="bg-card border-2 border-border rounded-3xl p-8 chunky-shadow text-center">
            <h2 className="text-2xl sm:text-3xl font-black leading-tight">
              In Baddeley's model, which slave system processes verbal information?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {["Visuospatial sketchpad", "Phonological loop", "Episodic buffer", "Central executive"].map((opt, i) => (
              <div key={i} className={`${colors[i]} text-white rounded-3xl p-6 border-4 border-foreground chunky-shadow flex items-center gap-4`}>
                <span className="size-12 grid place-items-center rounded-2xl bg-white/20 font-black text-xl">{labels[i]}</span>
                <span className="font-black text-lg flex-1 text-left">{opt}</span>
                <span className="font-mono font-black text-sm bg-black/20 px-2 py-1 rounded-lg">{counts[i]}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setPhase("reveal")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-foreground text-background font-bold text-sm chunky-shadow">
            <SkipForward className="size-4" strokeWidth={3} /> Skip to results
          </button>
        </div>
      )}

      {phase === "reveal" && (
        <div className="space-y-5">
          <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <h3 className="font-black text-xl flex items-center gap-2 mb-4">
              <Zap className="size-5 text-primary" strokeWidth={2.5} /> Answer distribution
            </h3>
            <div className="space-y-2">
              {["Visuospatial sketchpad", "Phonological loop", "Episodic buffer", "Central executive"].map((opt, i) => {
                const pct = Math.round((counts[i] / total) * 100);
                const correct = i === 1;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className={correct ? "text-primary" : ""}>{labels[i]}. {opt} {correct && "✓"}</span>
                      <span className="font-mono">{counts[i]} · {pct}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-border">
                      <div className={`h-full ${correct ? "bg-primary" : colors[i]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <h3 className="font-black text-xl flex items-center gap-2 mb-4">
              <Trophy className="size-5 text-secondary" strokeWidth={2.5} /> Top players
            </h3>
            <ul className="space-y-2">
              {[["Mia", 2840], ["Ben", 2510], ["Noor", 2200], ["Theo", 1980], ["Aya", 1740]].map(([name, score], i) => (
                <li key={String(name)} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50">
                  <span className="size-9 grid place-items-center rounded-xl bg-foreground text-background font-black">{i + 1}</span>
                  <span className="font-black flex-1">{name}</span>
                  <span className="font-mono font-black text-primary">{score}</span>
                </li>
              ))}
            </ul>
          </div>
          <button onClick={() => { setPhase("question"); setTime(20); setCounts([0, 0, 0, 0]); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow">
            <SkipForward className="size-4" strokeWidth={3} /> Next question
          </button>
        </div>
      )}
    </DashboardShell>
  );
}

// ─── Backend page ─────────────────────────────────────────────────────────────

type SetupQuestion = { text: string; options: [string, string, string, string]; correctIndex: number };

function emptyQuestion(): SetupQuestion {
  return { text: "", options: ["", "", "", ""], correctIndex: 0 };
}

function BackendLiveQuizHostPage() {
  const navigate = useNavigate({ from: "/live-quiz-host" });
  const [phase, setPhase] = useState<"setup" | "lobby" | "question" | "reveal" | "finished">("setup");
  const [pin, setPin] = useState<string | null>(null);

  const [title, setTitle] = useState("Live Quiz");
  const [secs, setSecs] = useState(20);
  const [setupQuestions, setSetupQuestions] = useState<SetupQuestion[]>([emptyQuestion()]);

  // Setup source tabs
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.status]);

  const handleCreate = async () => {
    const valid = setupQuestions.every((q) => q.text.trim() && q.options.every((o) => o.trim()));
    if (!valid) { toast.error("Fill in all question texts and options."); return; }
    try {
      const payload: CreateLiveQuizPayload = {
        title,
        secondsPerQuestion: secs,
        questions: setupQuestions.map((q) => ({ text: q.text, options: q.options, correctIndex: q.correctIndex })),
      };
      const { pin: newPin } = await createMutation.mutateAsync(payload);
      setPin(newPin);
      setPhase("lobby");
    } catch {
      toast.error("Failed to create session.");
    }
  };

  const handleNext = async () => {
    if (!pin) return;
    try { await nextMutation.mutateAsync(pin); }
    catch { toast.error("Failed to advance question."); }
  };

  const handleReveal = async () => {
    if (!pin) return;
    try { await revealMutation.mutateAsync(pin); }
    catch { toast.error("Failed to reveal answer."); }
  };

  const handleGenerateAi = async () => {
    if (!aiTopic.trim()) { toast.error("Enter a topic first."); return; }
    try {
      const result = await generateAiMutation.mutateAsync({ topic: aiTopic.trim(), questionCount: aiCount });
      setSetupQuestions(result.questions.map((q) => ({ text: q.text, options: q.options, correctIndex: q.correctIndex })));
      setTitle(`${aiTopic.trim()} — Live Quiz`);
      setSourceTab("manual");
      toast.success(`${result.questions.length} questions generated — review before launching.`);
    } catch {
      toast.error("AI generation failed. Check that AI is configured.");
    }
  };

  const handleLoadFromBank = () => {
    const tpl = (templatesQuery.data ?? []).find((t) => t.id === selectedTemplateId);
    if (!tpl) { toast.error("Select a template first."); return; }
    try {
      const parsed = JSON.parse(tpl.content) as { __type?: string; questions?: Array<{ text: string; options: [string,string,string,string]; correctIndex: number }> };
      if (parsed.__type !== "live_quiz" || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        toast.error("This template doesn't have structured questions. Try generating with AI.");
        return;
      }
      setSetupQuestions(parsed.questions.map((q) => ({ text: q.text, options: q.options, correctIndex: q.correctIndex })));
      setTitle(tpl.title);
      setSourceTab("manual");
      toast.success(`Loaded ${parsed.questions.length} questions from "${tpl.title}".`);
    } catch {
      toast.error("This template can't be loaded as questions. Use AI generation instead.");
    }
  };

  const handleSaveToBank = async () => {
    const valid = setupQuestions.every((q) => q.text.trim() && q.options.every((o) => o.trim()));
    if (!valid) { toast.error("Fill in all questions before saving."); return; }
    try {
      await saveToBank.mutateAsync({
        title: title || "Live Quiz",
        content: JSON.stringify({ __type: "live_quiz", questions: setupQuestions }),
        questionCount: setupQuestions.length,
      });
      toast.success("Saved to Quiz Bank.");
    } catch {
      toast.error("Failed to save to bank.");
    }
  };

  const addQuestion = () => setSetupQuestions((qs) => [...qs, emptyQuestion()]);
  const removeQuestion = (i: number) =>
    setSetupQuestions((qs) => (qs.length > 1 ? qs.filter((_, idx) => idx !== i) : qs));
  const updateQuestion = (i: number, patch: Partial<SetupQuestion>) =>
    setSetupQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const updateOption = (qi: number, oi: number, val: string) =>
    setSetupQuestions((qs) =>
      qs.map((q, idx) => {
        if (idx !== qi) return q;
        const opts = [...q.options] as [string, string, string, string];
        opts[oi] = val;
        return { ...q, options: opts };
      }),
    );

  const q = state?.question;
  const qIdx = state?.currentQuestionIndex ?? -1;
  const totalQ = state?.totalQuestions ?? setupQuestions.length;
  const answerCounts = state?.answerCounts ?? [0, 0, 0, 0];
  const totalAnswers = answerCounts.reduce((a, b) => a + b, 0) || 1;

  return (
    <DashboardShell>
      <TopBar
        title="Live Quiz — Host"
        subtitle={phase === "setup" ? "Create your session" : `${state?.title ?? title} · ${totalQ} questions`}
        showStreak={false}
      />

      {/* ── Setup ── */}
      {phase === "setup" && (
        <div className="space-y-5 max-w-2xl">
          {/* Title + timer */}
          <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2">Session title</p>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2">Seconds per question</p>
              <select
                value={secs}
                onChange={(e) => setSecs(+e.target.value)}
                className="px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50"
              >
                {[10, 15, 20, 30, 45, 60].map((s) => <option key={s} value={s}>{s}s</option>)}
              </select>
            </div>
          </div>

          {/* Source tabs */}
          <div className="bg-card border-2 border-border rounded-3xl p-1 chunky-shadow flex gap-1">
            {([
              { id: "manual", label: "Build manually", icon: Pencil },
              { id: "bank", label: "From quiz bank", icon: Library },
              { id: "ai", label: "Generate with AI", icon: Sparkles },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSourceTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-bold text-sm transition-all ${
                  sourceTab === id
                    ? "bg-primary text-primary-foreground chunky-shadow"
                    : "text-foreground/50 hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="size-4 shrink-0" strokeWidth={2.5} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* From quiz bank panel */}
          {sourceTab === "bank" && (
            <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4">
              <p className="text-xs font-black uppercase tracking-wider text-foreground/50">Pick a quiz template</p>
              {templatesQuery.isLoading ? (
                <div className="flex items-center justify-center h-16 text-foreground/40">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : (templatesQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-foreground/40 font-medium py-4 text-center">No saved quizzes yet. Generate with AI and save to the bank.</p>
              ) : (
                <ul className="space-y-1 max-h-60 overflow-y-auto">
                  {(templatesQuery.data ?? []).map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all ${
                          selectedTemplateId === t.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm">{t.title}</p>
                            <p className="text-[11px] text-foreground/50">{t.questionCount} questions{t.courseName ? ` · ${t.courseName}` : ""}</p>
                          </div>
                          {selectedTemplateId === t.id && <Check className="size-4 text-primary shrink-0" strokeWidth={2.5} />}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={handleLoadFromBank}
                disabled={!selectedTemplateId}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary text-secondary-foreground font-bold text-sm disabled:opacity-50"
              >
                <Library className="size-4" strokeWidth={2.5} /> Load questions
              </button>
            </div>
          )}

          {/* Generate with AI panel */}
          {sourceTab === "ai" && (
            <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4">
              <p className="text-xs font-black uppercase tracking-wider text-foreground/50">Generate questions with AI</p>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1.5">Topic</p>
                <input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis, World War II, Python functions…"
                  maxLength={160}
                  className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1.5">Number of questions</p>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(+e.target.value)}
                  className="px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50"
                >
                  {[3, 5, 8, 10, 15, 20].map((n) => <option key={n} value={n}>{n} questions</option>)}
                </select>
              </div>
              <button
                onClick={handleGenerateAi}
                disabled={generateAiMutation.isPending || !aiTopic.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-black chunky-shadow disabled:opacity-50"
              >
                {generateAiMutation.isPending
                  ? <><Loader2 className="size-4 animate-spin" /> Generating…</>
                  : <><Sparkles className="size-4" strokeWidth={2.5} /> Generate</>}
              </button>
            </div>
          )}

          {/* Manual question editor (also used to review AI-generated questions) */}
          {sourceTab === "manual" && (
            <>
              {setupQuestions.map((sq, qi) => (
                <div key={qi} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wider text-foreground/50">Question {qi + 1}</p>
                    {setupQuestions.length > 1 && (
                      <button onClick={() => removeQuestion(qi)} className="text-destructive/70 hover:text-destructive">
                        <Trash2 className="size-4" strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={sq.text}
                    onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                    placeholder="Question text…"
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {sq.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuestion(qi, { correctIndex: oi })}
                          className={`size-7 shrink-0 rounded-lg border-2 font-black text-xs grid place-items-center transition-colors ${
                            sq.correctIndex === oi
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border text-foreground/40 hover:border-primary/50"
                          }`}
                        >
                          {labels[oi]}
                        </button>
                        <input
                          value={opt}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                          placeholder={`Option ${labels[oi]}`}
                          className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-foreground/40 font-bold">Click a letter to mark the correct answer</p>
                </div>
              ))}

              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={addQuestion} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">
                  <Plus className="size-4" strokeWidth={2.5} /> Add question
                </button>
                <button
                  onClick={handleSaveToBank}
                  disabled={saveToBank.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted disabled:opacity-50"
                >
                  {saveToBank.isPending
                    ? <Loader2 className="size-4 animate-spin" />
                    : <Library className="size-4" strokeWidth={2.5} />}
                  Save to bank
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !title.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-black chunky-shadow disabled:opacity-50 ml-auto"
                >
                  {createMutation.isPending
                    ? <><Loader2 className="size-4 animate-spin" /> Creating…</>
                    : <><Play className="size-4" strokeWidth={3} /> Create session</>}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Lobby ── */}
      {phase === "lobby" && pin && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
          <section className="bg-card border-2 border-border rounded-3xl p-10 chunky-shadow text-center space-y-6">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-foreground/50">Join at questlms.live</p>
            <p className="text-7xl sm:text-8xl font-black tracking-tight font-mono">{pin}</p>
            <p className="text-sm font-bold text-foreground/60">Enter this code on your device</p>
            <button
              onClick={handleNext}
              disabled={nextMutation.isPending || (state?.playerCount ?? 0) < 1}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-black chunky-shadow disabled:opacity-50"
            >
              {nextMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-5" strokeWidth={3} />}
              Start quiz
            </button>
          </section>
          <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black flex items-center gap-2 mb-4">
              <Users className="size-4 text-primary" strokeWidth={2.5} /> {state?.playerCount ?? 0} players joined
            </h3>
            <div className="flex flex-wrap gap-2">
              {(state?.players ?? []).map((p, i) => (
                <span key={i} className="px-3 py-1.5 rounded-xl bg-secondary/30 border-2 border-secondary font-black text-sm animate-in fade-in zoom-in-95">
                  {p.nickname}
                </span>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* ── Question ── */}
      {phase === "question" && q && (
        <div className="space-y-5">
          <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-foreground/60">
              Question {qIdx + 1} of {totalQ}
            </p>
            <div className={`size-16 grid place-items-center rounded-2xl border-4 ${(q.timeLeft ?? 20) < 6 ? "border-destructive text-destructive" : "border-primary text-primary"} font-mono font-black text-2xl`}>
              {q.timeLeft}
            </div>
            <p className="text-xs font-black uppercase tracking-wider text-foreground/60">
              {answerCounts.reduce((a, b) => a + b, 0)} answered
            </p>
          </div>

          <div className="bg-card border-2 border-border rounded-3xl p-8 chunky-shadow text-center">
            <h2 className="text-2xl sm:text-3xl font-black leading-tight">{q.text}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {q.options.map((opt, i) => (
              <div key={i} className={`${colors[i]} text-white rounded-3xl p-6 border-4 border-foreground chunky-shadow flex items-center gap-4`}>
                <span className="size-12 grid place-items-center rounded-2xl bg-white/20 font-black text-xl">{labels[i]}</span>
                <span className="font-black text-lg flex-1 text-left">{opt}</span>
                <span className="font-mono font-black text-sm bg-black/20 px-2 py-1 rounded-lg">{answerCounts[i] ?? 0}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleReveal}
            disabled={revealMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-foreground text-background font-bold text-sm chunky-shadow disabled:opacity-50"
          >
            {revealMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <SkipForward className="size-4" strokeWidth={3} />}
            Reveal answer
          </button>
        </div>
      )}

      {/* ── Reveal ── */}
      {phase === "reveal" && q && (
        <div className="space-y-5">
          <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <h3 className="font-black text-xl flex items-center gap-2 mb-4">
              <Zap className="size-5 text-primary" strokeWidth={2.5} /> Answer distribution
            </h3>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const pct = Math.round((answerCounts[i] / totalAnswers) * 100);
                const correct = i === state?.correctIndex;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className={correct ? "text-primary" : ""}>{labels[i]}. {opt} {correct && "✓"}</span>
                      <span className="font-mono">{answerCounts[i]} · {pct}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-border">
                      <div className={`h-full ${correct ? "bg-primary" : colors[i]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {(state?.leaderboard?.length ?? 0) > 0 && (
            <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
              <h3 className="font-black text-xl flex items-center gap-2 mb-4">
                <Trophy className="size-5 text-secondary" strokeWidth={2.5} /> Top players
              </h3>
              <ul className="space-y-2">
                {state!.leaderboard!.map((p, i) => (
                  <li key={p.nickname} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50">
                    <span className="size-9 grid place-items-center rounded-xl bg-foreground text-background font-black">{i + 1}</span>
                    <span className="font-black flex-1">{p.nickname}</span>
                    <span className="font-mono font-black text-primary">{p.score}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleNext}
            disabled={nextMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow disabled:opacity-50"
          >
            {nextMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <SkipForward className="size-4" strokeWidth={3} />}
            Next question
          </button>
        </div>
      )}

      {/* ── Finished ── */}
      {phase === "finished" && (
        <div className="space-y-5">
          <div className="bg-card border-2 border-border rounded-3xl p-8 chunky-shadow text-center space-y-3">
            <Trophy className="size-14 mx-auto text-secondary" strokeWidth={2.5} />
            <h2 className="text-2xl font-black">Quiz complete!</h2>
            <p className="text-sm font-bold text-foreground/60">{state?.playerCount ?? 0} players participated</p>
          </div>

          {(state?.leaderboard?.length ?? 0) > 0 && (
            <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
              <h3 className="font-black text-xl flex items-center gap-2 mb-4">
                <Trophy className="size-5 text-secondary" strokeWidth={2.5} /> Final leaderboard
              </h3>
              <ul className="space-y-2">
                {state!.leaderboard!.map((p, i) => (
                  <li key={p.nickname} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50">
                    <span className="size-9 grid place-items-center rounded-xl bg-foreground text-background font-black">{i + 1}</span>
                    <span className="font-black flex-1">{p.nickname}</span>
                    <span className="font-mono font-black text-primary">{p.score}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            {pin && (
              <button
                onClick={() => navigate({ to: "/quiz-results", search: { pin } })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-secondary text-secondary-foreground font-bold text-sm chunky-shadow"
              >
                <BarChart3 className="size-4" strokeWidth={2.5} /> Full analytics
              </button>
            )}
            <button
              onClick={() => { setPhase("setup"); setPin(null); setSetupQuestions([emptyQuestion()]); setTitle("Live Quiz"); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow"
            >
              <Plus className="size-4" strokeWidth={2.5} /> New session
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function LiveQuizHostPage() {
  const { context } = useAppContext();
  return context.mode === "backend" ? <BackendLiveQuizHostPage /> : <PrototypeLiveQuizHostPage />;
}
