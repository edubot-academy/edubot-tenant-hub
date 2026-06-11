import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Sparkles, Wand2, FileText, ListChecks, Loader2, Copy, RotateCcw, Save, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { useGeneratedQuizzes } from "@/lib/quizStore";
import { useGenerateFreeFormContent, type FreeFormMode } from "@/lib/ai-tutor-api";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";
import { useCreateQuizTemplate } from "@/lib/quiz-bank-api";

export const Route = createFileRoute("/ai-generator")({
  head: () => ({
    meta: [
      {
        title: i18n.t("aiGeneratorPage.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — AI Content Generator",
        }),
      },
    ],
  }),
  component: AiGeneratorPage,
});

const MODE_ICONS: Record<FreeFormMode, typeof Wand2> = {
  quiz: ListChecks,
  summary: FileText,
  outline: Sparkles,
};

function AiGeneratorPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const isBackend = context.mode === "backend";
  const navigate = useNavigate();
  const { add } = useGeneratedQuizzes();
  const [mode, setMode] = useState<FreeFormMode>("quiz");
  const [topic, setTopic] = useState("Working memory in cognitive psychology");
  const [level, setLevel] = useState("High school");
  const [count, setCount] = useState(5);
  const [course, setCourse] = useState("Cognitive Psychology");
  const [output, setOutput] = useState<string>("");

  const generateMutation = useGenerateFreeFormContent();
  const createTemplate = useCreateQuizTemplate();
  const loading = generateMutation.isPending;

  const modes: { id: FreeFormMode; label: string; icon: typeof Wand2; desc: string }[] = [
    { id: "quiz", label: t("aiGeneratorPage.modes.quiz.label", { defaultValue: "Quiz questions" }), icon: MODE_ICONS.quiz, desc: t("aiGeneratorPage.modes.quiz.desc", { defaultValue: "Generate MCQs with answer keys" }) },
    { id: "summary", label: t("aiGeneratorPage.modes.summary.label", { defaultValue: "Lesson summary" }), icon: MODE_ICONS.summary, desc: t("aiGeneratorPage.modes.summary.desc", { defaultValue: "Tight recap for review" }) },
    { id: "outline", label: t("aiGeneratorPage.modes.outline.label", { defaultValue: "Lesson outline" }), icon: MODE_ICONS.outline, desc: t("aiGeneratorPage.modes.outline.desc", { defaultValue: "Bulleted teaching plan" }) },
  ];

  const run = async () => {
    if (!topic.trim()) return;
    setOutput("");
    if (isBackend) {
      try {
        const result = await generateMutation.mutateAsync({
          mode,
          topic,
          level,
          questionCount: mode === "quiz" ? count : undefined,
        });
        setOutput(result.content);
      } catch {
        toast.error(t("aiGeneratorPage.toast.generateFailed", { defaultValue: "Generation failed. Check that the AI service is configured." }));
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setOutput(mock(mode, topic, level, count, t));
    }
  };

  const handleSave = async () => {
    const title = mode === "quiz"
      ? t("aiGeneratorPage.labels.quizTitle", { topic, defaultValue: "{{topic}} — AI quiz" })
      : t("aiGeneratorPage.labels.contentTitle", { topic, mode, defaultValue: "{{topic}} — AI {{mode}}" });
    const questionCount = mode === "quiz" ? count : 0;

    if (isBackend) {
      try {
        await createTemplate.mutateAsync({ title, content: output, courseName: course || undefined, questionCount });
        toast.success(t("aiGeneratorPage.toast.saved", { defaultValue: "Saved to Quiz Bank" }));
        navigate({ to: "/quiz-bank" });
      } catch {
        toast.error(t("aiGeneratorPage.toast.saveFailed", { defaultValue: "Failed to save quiz." }));
      }
      return;
    }

    const id = `gen-${Date.now()}`;
    add({ id, title, course, questions: questionCount, lastUsed: t("aiGeneratorPage.labels.never", { defaultValue: "Never" }), uses: 0, content: output });
    toast.success(t("aiGeneratorPage.toast.saved", { defaultValue: "Saved to Quiz Bank" }));
    navigate({ to: "/quiz-bank" });
  };

  const handleLaunch = () => {
    toast.success(t("aiGeneratorPage.toast.launching", { defaultValue: "Launching live quiz…" }));
    navigate({ to: "/live-quiz-host" });
  };

  const audienceLevels = [
    { value: "Elementary", label: t("aiGeneratorPage.level.elementary", { defaultValue: "Elementary" }) },
    { value: "Middle school", label: t("aiGeneratorPage.level.middle", { defaultValue: "Middle school" }) },
    { value: "High school", label: t("aiGeneratorPage.level.high", { defaultValue: "High school" }) },
    { value: "University", label: t("aiGeneratorPage.level.university", { defaultValue: "University" }) },
    { value: "Adult learners", label: t("aiGeneratorPage.level.adult", { defaultValue: "Adult learners" }) },
  ];

  return (
    <DashboardShell>
      <TopBar title={t("aiGeneratorPage.topbar.title", { defaultValue: "AI Content Generator" })} subtitle={t("aiGeneratorPage.topbar.subtitle", { defaultValue: "Draft quizzes, summaries, and outlines in seconds." })} showStreak={false} />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-5 h-fit">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2">{t("aiGeneratorPage.fields.mode", { defaultValue: "Mode" })}</p>
            <div className="grid gap-2">
              {modes.map((item) => {
                const Icon = item.icon;
                const active = item.id === mode;
                return (
                  <button key={item.id} onClick={() => setMode(item.id)} className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${active ? "bg-primary text-primary-foreground border-foreground chunky-shadow" : "bg-card border-border hover:bg-muted/50"}`}>
                    <Icon className="size-5 shrink-0" strokeWidth={2.5} />
                    <div className="min-w-0">
                      <p className="font-black text-sm">{item.label}</p>
                      <p className={`text-[11px] font-medium truncate ${active ? "opacity-80" : "text-foreground/55"}`}>{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Field label={t("aiGeneratorPage.fields.topic", { defaultValue: "Topic" })}>
            <textarea value={topic} onChange={(event) => setTopic(event.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50" />
          </Field>

          <Field label={t("aiGeneratorPage.fields.audienceLevel", { defaultValue: "Audience level" })}>
            <select value={level} onChange={(event) => setLevel(event.target.value)} className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50">
              {audienceLevels.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>

          <Field label={t("aiGeneratorPage.fields.course", { defaultValue: "Course" })}>
            <input value={course} onChange={(event) => setCourse(event.target.value)} className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50" />
          </Field>

          {mode === "quiz" && (
            <Field label={t("aiGeneratorPage.fields.questionCount", { count, defaultValue: "Question count · {{count}}" })}>
              <input type="range" min={3} max={15} value={count} onChange={(event) => setCount(+event.target.value)} className="w-full accent-primary" />
            </Field>
          )}

          <button onClick={run} disabled={loading || !topic.trim()} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground border-2 border-foreground chunky-shadow font-black disabled:opacity-50">
            {loading ? <><Loader2 className="size-4 animate-spin" /> {t("aiGeneratorPage.actions.generating", { defaultValue: "Generating…" })}</> : <><Wand2 className="size-4" strokeWidth={2.5} /> {t("aiGeneratorPage.actions.generate", { defaultValue: "Generate" })}</>}
          </button>
        </aside>

        <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow min-h-[480px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-xl flex items-center gap-2"><Sparkles className="size-5 text-primary" strokeWidth={2.5} /> {t("aiGeneratorPage.output.title", { defaultValue: "Output" })}</h3>
            <div className="flex gap-2">
              {mode === "quiz" && output && (
                <>
                  <button onClick={handleSave} disabled={createTemplate.isPending} className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-bold text-xs flex items-center gap-1.5 transition-opacity cursor-pointer disabled:opacity-50">
                    {createTemplate.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    {t("aiGeneratorPage.actions.saveToQuizBank", { defaultValue: "Save to Quiz Bank" })}
                  </button>
                  <button onClick={handleLaunch} className="px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground hover:opacity-90 font-bold text-xs flex items-center gap-1.5 transition-opacity cursor-pointer">
                    <PlayCircle className="size-3.5" /> {t("aiGeneratorPage.actions.launchLive", { defaultValue: "Launch Live" })}
                  </button>
                </>
              )}
              <button onClick={() => navigator.clipboard?.writeText(output)} disabled={!output} className="px-3 py-1.5 rounded-xl bg-muted hover:bg-foreground/10 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer">
                <Copy className="size-3.5" /> {t("aiGeneratorPage.actions.copy", { defaultValue: "Copy" })}
              </button>
              <button onClick={run} disabled={loading || !topic.trim()} className="px-3 py-1.5 rounded-xl bg-muted hover:bg-foreground/10 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer">
                <RotateCcw className="size-3.5" /> {t("aiGeneratorPage.actions.regenerate", { defaultValue: "Regenerate" })}
              </button>
            </div>
          </div>

          {!output && !loading && (
            <div className="grid place-items-center h-[380px] text-center">
              <div className="max-w-sm space-y-2">
                <div className="size-16 mx-auto rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center chunky-shadow border-2 border-foreground"><Wand2 className="size-7" strokeWidth={2.5} /></div>
                <p className="font-black text-lg">{t("aiGeneratorPage.empty.title", { defaultValue: "Pick a mode and click Generate" })}</p>
                <p className="text-sm font-medium text-foreground/55">{t("aiGeneratorPage.empty.body", { defaultValue: "AI drafts content tuned to your topic and audience. Always review before publishing." })}</p>
              </div>
            </div>
          )}

          {loading && <div className="space-y-3 animate-pulse">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-4 rounded-lg bg-muted" style={{ width: `${60 + Math.random() * 40}%` }} />)}</div>}
          {output && !loading && <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90">{output}</pre>}
        </section>
      </div>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2">{label}</p>{children}</div>;
}

function mock(mode: FreeFormMode, topic: string, level: string, count: number, t: ReturnType<typeof useTranslation>["t"]) {
  if (mode === "quiz") {
    return Array.from({ length: count }).map((_, index) => t("aiGeneratorPage.mock.quizItem", {
      number: index + 1,
      topic,
      level,
      defaultValue: "Q{{number}}. About \"{{topic}}\" — which statement is most accurate? ({{level}})\n  A) A plausible but incorrect option\n  B) The correct, well-supported answer ✓\n  C) A common misconception\n  D) An unrelated distractor\n  Answer: B\n",
    })).join("\n");
  }
  if (mode === "summary") {
    return t("aiGeneratorPage.mock.summary", {
      topic,
      level,
      defaultValue: "Summary — {{topic}} ({{level}})\n\n{{topic}} refers to a core concept learners need to understand through examples, practice, and review.\n\nKey takeaways:\n• Start with simple definitions\n• Use examples\n• Check understanding\n• Review with questions",
    });
  }
  return t("aiGeneratorPage.mock.outline", {
    topic,
    level,
    defaultValue: "Lesson outline — {{topic}} ({{level}})\n\n1. Hook (3 min)\n2. Explain the core concept (8 min)\n3. Show examples (10 min)\n4. Practice activity (10 min)\n5. Discuss common mistakes (7 min)\n6. Exit ticket (2 min)",
  });
}
