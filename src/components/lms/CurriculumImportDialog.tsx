import { useState } from "react";
import { toast } from "sonner";
import { X, Sparkles, FileUp, Wand2, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { parseCurriculum, type CurriculumDraft } from "@/lib/lmsAi";
import { importCurriculumIntoCourse } from "@/lib/lmsStore";
import type { LessonType } from "@/lib/lmsStore";

const LESSON_TYPES: LessonType[] = ["video", "reading", "quiz", "assignment", "live"];

function recount(d: CurriculumDraft): CurriculumDraft {
  return { ...d, totalLessons: d.modules.reduce((s, m) => s + m.lessons.length, 0) };
}

async function extractPdfText(file: File): Promise<string> {
  // @ts-expect-error - pdfjs-dist subpath has no types
  const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs");
  const worker: any = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const lines: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let buffer = "";
    for (const item of content.items as any[]) {
      const y = item.transform?.[5] ?? 0;
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (buffer.trim()) lines.push(buffer.trim());
        buffer = "";
      }
      buffer += (buffer ? " " : "") + (item.str ?? "");
      lastY = y;
    }
    if (buffer.trim()) lines.push(buffer.trim());
    lines.push("");
  }
  return lines.join("\n");
}


export function CurriculumImportDialog({
  courseId,
  onClose,
}: {
  courseId: string;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [draft, setDraft] = useState<CurriculumDraft | null>(null);
  const [parsing, setParsing] = useState(false);

  const onFile = async (file: File) => {
    if (file.size > 10_000_000) {
      toast.error("File too large (max 10 MB)");
      return;
    }
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    try {
      setParsing(true);
      if (isPdf) {
        const t = await extractPdfText(file);
        if (!t.trim()) {
          toast.error("No selectable text found in the PDF (scanned image?)");
          return;
        }
        setText(t);
      } else {
        setText(await file.text());
      }
      toast.success(`Loaded ${file.name}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to read file");
    } finally {
      setParsing(false);
    }
  };

  const analyze = () => {
    if (!text.trim()) {
      toast.error("Paste or upload a curriculum first");
      return;
    }
    const d = parseCurriculum(text);
    if (d.totalLessons === 0) {
      toast.error("Couldn't detect any lessons. Try one item per line.");
      return;
    }
    if (startDate && endDate) {
      const weeks = Math.max(
        1,
        Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (7 * 86400000)),
      );
      d.perWeek = +(d.totalLessons / weeks).toFixed(1);
    }
    setDraft(d);
  };

  const commit = () => {
    if (!draft) return;
    importCurriculumIntoCourse(courseId, draft);
    toast.success(`Imported ${draft.totalLessons} lessons across ${draft.modules.length} modules`);
    onClose();
  };

  return (
    <Shell onClose={onClose} wide>
      <Header title="Generate lessons from curriculum" subtitle="Paste or upload a program. AI organizes it into modules and lessons." onClose={onClose} />

      {!draft && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Start date">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="End date">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="Curriculum text">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder={"Unit 1: Foundations\n- Intro lecture (15 min)\n- Reading: chapter 1\n- Quiz on basics\n\nUnit 2: Practice\n- Lab exercise\n..."}
              className={`${inputCls} font-mono text-xs`}
            />
          </Field>

          <div className="flex items-center justify-between gap-2">
            <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-border text-xs font-bold cursor-pointer hover:bg-muted ${parsing ? "opacity-50 pointer-events-none" : ""}`}>
              <FileUp className="size-3.5" /> {parsing ? "Reading…" : "Upload PDF / .txt / .md"}
              <input
                type="file"
                accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </label>
            <button type="button" onClick={analyze} className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90">
              <Wand2 className="size-4" /> Generate lessons
            </button>
          </div>
        </div>
      )}

      {draft && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <Stat label="Modules" value={draft.modules.length} />
              <Stat label="Lessons" value={draft.totalLessons} />
              {draft.perWeek > 0 && <Stat label="≈ per week" value={draft.perWeek} />}
            </div>
            <p className="text-[11px] text-foreground/50 font-medium">Review and edit before importing.</p>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-2xl border-2 border-border divide-y divide-border bg-background">
            {draft.modules.map((m, mi) => {
              const updateModule = (patch: Partial<typeof m>) =>
                setDraft(recount({ ...draft, modules: draft.modules.map((x, i) => (i === mi ? { ...x, ...patch } : x)) }));
              const moveModule = (dir: -1 | 1) => {
                const ni = mi + dir;
                if (ni < 0 || ni >= draft.modules.length) return;
                const next = [...draft.modules];
                [next[mi], next[ni]] = [next[ni], next[mi]];
                setDraft({ ...draft, modules: next });
              };
              const deleteModule = () =>
                setDraft(recount({ ...draft, modules: draft.modules.filter((_, i) => i !== mi) }));
              const addLesson = () =>
                updateModule({
                  lessons: [...m.lessons, { title: "New lesson", type: "reading", durationMin: 20 }],
                });

              return (
                <div key={mi} className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-primary shrink-0" />
                    <input
                      value={m.title}
                      onChange={(e) => updateModule({ title: e.target.value })}
                      className="flex-1 min-w-0 px-2 py-1 rounded-lg border-2 border-transparent hover:border-border focus:border-primary bg-transparent font-black text-sm focus:outline-none"
                    />
                    <IconBtn title="Move up" onClick={() => moveModule(-1)}><ArrowUp className="size-3.5" /></IconBtn>
                    <IconBtn title="Move down" onClick={() => moveModule(1)}><ArrowDown className="size-3.5" /></IconBtn>
                    <IconBtn title="Delete module" onClick={deleteModule}><Trash2 className="size-3.5" /></IconBtn>
                  </div>

                  <ol className="space-y-1 pl-5 list-decimal text-xs text-foreground/80">
                    {m.lessons.map((l, li) => {
                      const updateLesson = (patch: Partial<typeof l>) =>
                        updateModule({ lessons: m.lessons.map((x, i) => (i === li ? { ...x, ...patch } : x)) });
                      const moveLesson = (dir: -1 | 1) => {
                        const ni = li + dir;
                        if (ni < 0 || ni >= m.lessons.length) return;
                        const next = [...m.lessons];
                        [next[li], next[ni]] = [next[ni], next[li]];
                        updateModule({ lessons: next });
                      };
                      const deleteLesson = () =>
                        setDraft(recount({
                          ...draft,
                          modules: draft.modules.map((x, i) =>
                            i === mi ? { ...x, lessons: x.lessons.filter((_, j) => j !== li) } : x,
                          ),
                        }));
                      return (
                        <li key={li}>
                          <div className="flex items-center gap-1.5 -ml-1">
                            <input
                              value={l.title}
                              onChange={(e) => updateLesson({ title: e.target.value })}
                              className="flex-1 min-w-0 px-2 py-1 rounded-lg border-2 border-transparent hover:border-border focus:border-primary bg-transparent font-medium text-xs focus:outline-none"
                            />
                            <select
                              value={l.type}
                              onChange={(e) => updateLesson({ type: e.target.value as LessonType })}
                              className="px-1.5 py-1 rounded-lg border-2 border-border bg-background text-[11px] font-bold focus:outline-none focus:border-primary"
                            >
                              {LESSON_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min={1}
                              value={l.durationMin}
                              onChange={(e) => updateLesson({ durationMin: Math.max(1, Number(e.target.value) || 1) })}
                              className="w-14 px-1.5 py-1 rounded-lg border-2 border-border bg-background text-[11px] font-bold text-right focus:outline-none focus:border-primary"
                            />
                            <span className="text-[10px] text-foreground/50">m</span>
                            <IconBtn title="Move up" onClick={() => moveLesson(-1)}><ArrowUp className="size-3" /></IconBtn>
                            <IconBtn title="Move down" onClick={() => moveLesson(1)}><ArrowDown className="size-3" /></IconBtn>
                            <IconBtn title="Delete lesson" onClick={deleteLesson}><Trash2 className="size-3" /></IconBtn>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  <button
                    type="button"
                    onClick={addLesson}
                    className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded-lg border-2 border-dashed border-border text-[11px] font-bold hover:bg-muted"
                  >
                    <Plus className="size-3" /> Add lesson
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() =>
              setDraft({
                ...draft,
                modules: [...draft.modules, { title: `Module ${draft.modules.length + 1}`, lessons: [] }],
              })
            }
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-dashed border-border text-xs font-bold hover:bg-muted"
          >
            <Plus className="size-3.5" /> Add module
          </button>

          <Actions
            onCancel={() => setDraft(null)}
            cancelLabel="Back"
            submitLabel="Import into course"
            onSubmit={commit}
            disabled={draft.totalLessons === 0}
          />
        </div>
      )}
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="px-2.5 py-1 rounded-lg bg-muted">
      {label}: <span className="text-primary">{value}</span>
    </span>
  );
}

// --- shared modal primitives (kept local to avoid cross-file churn) ---
const inputCls = "w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary";

export function Shell({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full ${wide ? "max-w-xl" : "max-w-md"} bg-card border-2 border-border rounded-3xl p-6 chunky-shadow max-h-[90vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}
export function Header({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-xl font-black">{title}</h2>
        {subtitle && <p className="text-xs text-foreground/60 mt-1">{subtitle}</p>}
      </div>
      <button type="button" onClick={onClose} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
        <X className="size-4" />
      </button>
    </div>
  );
}
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{label}</span>
      {children}
    </label>
  );
}
export function Actions({
  onCancel, cancelLabel = "Cancel", submitLabel, onSubmit, disabled,
}: { onCancel: () => void; cancelLabel?: string; submitLabel: string; onSubmit: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">{cancelLabel}</button>
      <button type="button" onClick={onSubmit} disabled={disabled} className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">{submitLabel}</button>
    </div>
  );
}
