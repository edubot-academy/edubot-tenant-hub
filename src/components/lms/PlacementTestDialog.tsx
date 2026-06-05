import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Plus, Trash2, ClipboardCheck } from "lucide-react";
import {
  useLms,
  savePlacementTest,
  clearPlacementTest,
  getPlacementTest,
  type PlacementMode,
  type PlacementQuestion,
} from "@/lib/lmsStore";
import { flattenLessons, generatePlacementTest } from "@/lib/lmsAi";
import { Shell, Header, Field, Actions } from "./CurriculumImportDialog";

const inputCls = "w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary";

export function PlacementTestDialog({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const state = useLms();
  const course = state.courses.find((c) => c.id === courseId)!;
  const existing = getPlacementTest(state, courseId);
  const flatLessons = useMemo(() => flattenLessons(course), [course]);

  const [mode, setMode] = useState<PlacementMode>(existing?.mode ?? "ai");
  const [enabled, setEnabled] = useState<boolean>(existing?.enabled ?? true);
  const [questions, setQuestions] = useState<PlacementQuestion[]>(existing?.questions ?? []);
  const [bucketMap, setBucketMap] = useState<Record<number, string>>(existing?.bucketToLessonId ?? {});

  const buckets = useMemo(
    () => Array.from(new Set(questions.map((q) => q.bucket))).sort((a, b) => a - b),
    [questions],
  );

  const runAi = () => {
    if (flatLessons.length === 0) {
      toast.error("Add lessons to the course first.");
      return;
    }
    const bp = generatePlacementTest(course);
    setQuestions(bp.questions);
    setBucketMap(bp.bucketToLessonId);
    toast.success(`Generated ${bp.questions.length} questions`);
  };

  const addManual = () => {
    const nextBucket = buckets.length === 0 ? 0 : Math.max(...buckets) + 1;
    setQuestions((q) => [
      ...q,
      {
        id: `q-${Date.now()}`,
        prompt: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        bucket: nextBucket,
      },
    ]);
    if (flatLessons[0] && !bucketMap[nextBucket]) {
      setBucketMap({ ...bucketMap, [nextBucket]: flatLessons[0].id });
    }
  };

  const save = () => {
    if (questions.length === 0) {
      toast.error("Add at least one question.");
      return;
    }
    for (const q of questions) {
      if (!q.prompt.trim() || q.options.some((o) => !o.trim())) {
        toast.error("Every question needs a prompt and four options.");
        return;
      }
    }
    savePlacementTest({
      courseId,
      mode,
      enabled,
      questions,
      bucketToLessonId: bucketMap,
      updatedAt: Date.now(),
    });
    toast.success("Placement test saved");
    onClose();
  };

  const remove = () => {
    clearPlacementTest(courseId);
    toast.success("Placement test removed");
    onClose();
  };

  return (
    <Shell onClose={onClose} wide>
      <Header
        title="Placement test"
        subtitle="Map student answers to a starting lesson based on their level."
        onClose={onClose}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <ModeButton active={mode === "ai"} onClick={() => setMode("ai")} icon={<Sparkles className="size-3.5" />}>
            AI-generated
          </ModeButton>
          <ModeButton active={mode === "manual"} onClick={() => setMode("manual")} icon={<ClipboardCheck className="size-3.5" />}>
            Manual
          </ModeButton>
          <label className="ml-auto inline-flex items-center gap-2 text-xs font-bold">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Required for enrollment
          </label>
        </div>

        {mode === "ai" && (
          <button type="button" onClick={runAi} className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-primary bg-primary/5 text-primary font-bold text-sm hover:bg-primary/10">
            <Sparkles className="size-4" /> {questions.length === 0 ? "Generate from lessons" : "Regenerate questions"}
          </button>
        )}

        {mode === "manual" && (
          <button type="button" onClick={addManual} className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-border font-bold text-sm hover:bg-muted">
            <Plus className="size-4" /> Add question
          </button>
        )}

        {questions.length > 0 && (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {questions.map((q, qi) => (
              <div key={q.id} className="border-2 border-border rounded-2xl p-3 bg-background space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Q{qi + 1} · Level {q.bucket + 1}</span>
                  <button
                    type="button"
                    onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
                    aria-label="Remove question"
                    className="ml-auto cursor-pointer size-7 grid place-items-center rounded-lg hover:bg-muted text-foreground/60"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <input
                  value={q.prompt}
                  onChange={(e) => updateQ(setQuestions, q.id, { prompt: e.target.value })}
                  placeholder="Question prompt"
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border-2 cursor-pointer ${q.correctIndex === oi ? "border-primary bg-primary/5" : "border-border"}`}>
                      <input
                        type="radio"
                        checked={q.correctIndex === oi}
                        onChange={() => updateQ(setQuestions, q.id, { correctIndex: oi })}
                      />
                      <input
                        value={opt}
                        onChange={(e) => {
                          const opts = q.options.slice();
                          opts[oi] = e.target.value;
                          updateQ(setQuestions, q.id, { options: opts });
                        }}
                        placeholder={`Option ${oi + 1}`}
                        className="bg-transparent text-xs flex-1 focus:outline-none"
                      />
                    </label>
                  ))}
                </div>
                <Field label="If this level matches → start at lesson">
                  <select
                    value={bucketMap[q.bucket] ?? ""}
                    onChange={(e) => setBucketMap({ ...bucketMap, [q.bucket]: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">— pick a starting lesson —</option>
                    {flatLessons.map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </Field>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          {existing ? (
            <button type="button" onClick={remove} className="cursor-pointer text-xs font-bold text-destructive hover:underline">Remove test</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">Cancel</button>
            <button type="button" onClick={save} className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90">Save test</button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function updateQ(
  setter: React.Dispatch<React.SetStateAction<PlacementQuestion[]>>,
  id: string,
  patch: Partial<PlacementQuestion>,
) {
  setter((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
}

function ModeButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-bold cursor-pointer ${active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
      {icon} {children}
    </button>
  );
}

// Placement runner — used by the enroll flow.
export function PlacementRunner({
  courseId,
  studentId,
  studentName,
  onClose,
  onComplete,
}: {
  courseId: string;
  studentId: string;
  studentName: string;
  onClose: () => void;
  onComplete: (startLessonId?: string) => void;
}) {
  const state = useLms();
  const test = getPlacementTest(state, courseId);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  if (!test || test.questions.length === 0) {
    return (
      <Shell onClose={onClose}>
        <Header title="No placement test" onClose={onClose} />
        <p className="text-sm text-foreground/70">This course has no placement test yet.</p>
        <Actions onCancel={onClose} submitLabel="Skip" onSubmit={() => onComplete(undefined)} />
      </Shell>
    );
  }

  const submit = () => {
    const total = test.questions.length;
    let score = 0;
    let highestPassedBucket = -1;
    for (const q of test.questions) {
      if (answers[q.id] === q.correctIndex) {
        score++;
        highestPassedBucket = Math.max(highestPassedBucket, q.bucket);
      }
    }
    // Start at the lesson mapped to the highest bucket they answered correctly,
    // falling back to the very first mapped lesson.
    const startLessonId =
      (highestPassedBucket >= 0 && test.bucketToLessonId[highestPassedBucket]) ||
      test.bucketToLessonId[0];

    onComplete(startLessonId);
    return { score, total, startLessonId };
  };

  return (
    <Shell onClose={onClose} wide>
      <Header title={`Placement test — ${studentName}`} subtitle="Answer to find the best starting lesson." onClose={onClose} />
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {test.questions.map((q, qi) => (
          <div key={q.id} className="border-2 border-border rounded-2xl p-3 bg-background space-y-2">
            <p className="font-bold text-sm">{qi + 1}. {q.prompt}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border-2 cursor-pointer text-xs font-medium ${answers[q.id] === oi ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === oi}
                    onChange={() => setAnswers({ ...answers, [q.id]: oi })}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Actions
        onCancel={onClose}
        submitLabel="Submit & enroll"
        onSubmit={() => {
          if (Object.keys(answers).length < test.questions.length) {
            toast.error("Answer every question");
            return;
          }
          const r = submit();
          // recordPlacementResult handled by parent so it can wire enrollment
          toast.success(`Score ${r.score}/${r.total} — placed at recommended lesson`);
        }}
      />
      <p className="text-[10px] text-foreground/50 mt-2">Result is saved to student {studentId.slice(-4)}.</p>
    </Shell>
  );
}
