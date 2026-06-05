import { useMemo, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Users } from "lucide-react";
import {
  useLms,
  createStudent,
  enrollStudent,
  unenroll,
  enrollmentsForCourse,
  recordPlacementResult,
  getPlacementTest,
} from "@/lib/lmsStore";
import { flattenLessons } from "@/lib/lmsAi";
import { Shell, Header, Field, Actions } from "./CurriculumImportDialog";
import { PlacementRunner } from "./PlacementTestDialog";

const inputCls = "w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary";

export function EnrollIndividualDialog({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const state = useLms();
  const course = state.courses.find((c) => c.id === courseId)!;
  const enrollments = enrollmentsForCourse(state, courseId).filter((e) => !e.classId);
  const placement = getPlacementTest(state, courseId);
  const flatLessons = useMemo(() => flattenLessons(course), [course]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [startAt, setStartAt] = useState("");
  const [manualLessonId, setManualLessonId] = useState("");
  const [pendingStudent, setPendingStudent] = useState<{ id: string; name: string } | null>(null);

  const studentLookup = useMemo(
    () => Object.fromEntries(state.students.map((s) => [s.id, s])),
    [state.students],
  );
  const lessonLookup = useMemo(
    () => Object.fromEntries(flatLessons.map((l) => [l.id, l])),
    [flatLessons],
  );

  const submit = () => {
    if (!name.trim()) {
      toast.error("Student name is required");
      return;
    }
    const student = createStudent({ name, email });
    if (placement && placement.enabled && placement.questions.length > 0) {
      setPendingStudent({ id: student.id, name: student.name });
      return;
    }
    enrollStudent({
      studentId: student.id,
      courseId,
      startLessonId: manualLessonId || flatLessons[0]?.id,
      startAt: startAt || undefined,
    });
    toast.success(`${student.name} enrolled`);
    reset();
  };

  const finishPlacement = (startLessonId?: string) => {
    if (!pendingStudent) return;
    const test = placement!;
    recordPlacementResult({
      studentId: pendingStudent.id,
      courseId,
      score: 0, // PlacementRunner computes the meaningful lesson; we keep a row for history
      total: test.questions.length,
      startLessonId,
    });
    enrollStudent({
      studentId: pendingStudent.id,
      courseId,
      startLessonId: startLessonId ?? flatLessons[0]?.id,
      startAt: startAt || undefined,
    });
    toast.success(`${pendingStudent.name} enrolled`);
    setPendingStudent(null);
    reset();
  };

  const reset = () => {
    setName("");
    setEmail("");
    setStartAt("");
    setManualLessonId("");
  };

  if (pendingStudent) {
    return (
      <PlacementRunner
        courseId={courseId}
        studentId={pendingStudent.id}
        studentName={pendingStudent.name}
        onClose={() => setPendingStudent(null)}
        onComplete={finishPlacement}
      />
    );
  }

  return (
    <Shell onClose={onClose} wide>
      <Header
        title="Individual enrollments"
        subtitle="Enroll a student directly into this course (no class cohort required)."
        onClose={onClose}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Field label="Student name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aliya N." className={inputCls} />
        </Field>
        <Field label="Email (optional)">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aliya@example.com" className={inputCls} />
        </Field>
        <Field label="Personal start date">
          <input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={inputCls} />
        </Field>
        {!placement?.enabled && (
          <Field label="Start at lesson (optional)">
            <select value={manualLessonId} onChange={(e) => setManualLessonId(e.target.value)} className={inputCls}>
              <option value="">— first lesson —</option>
              {flatLessons.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {placement?.enabled && (
        <p className="text-xs text-foreground/60 mb-4">
          This course requires a placement test. The student will take it right after you click Enroll.
        </p>
      )}

      <div className="flex justify-end gap-2 mb-6">
        <button type="button" onClick={onClose} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">Close</button>
        <button type="button" onClick={submit} className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90">
          <UserPlus className="size-4" /> Enroll
        </button>
      </div>

      <div className="border-t-2 border-border pt-4">
        <p className="text-xs font-black uppercase tracking-widest text-foreground/50 mb-2 inline-flex items-center gap-1.5">
          <Users className="size-3.5" /> Enrolled ({enrollments.length})
        </p>
        {enrollments.length === 0 ? (
          <p className="text-sm text-foreground/60 italic">No individual enrollments yet.</p>
        ) : (
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {enrollments.map((e) => {
              const s = studentLookup[e.studentId];
              const lesson = e.startLessonId ? lessonLookup[e.startLessonId] : undefined;
              return (
                <li key={e.id} className="flex items-center gap-2 text-xs bg-background border-2 border-border rounded-xl px-3 py-2">
                  <span className="font-bold">{s?.name ?? "Unknown"}</span>
                  {s?.email && <span className="text-foreground/50">· {s.email}</span>}
                  {lesson && <span className="text-foreground/60">· starts at "{lesson.title}"</span>}
                  {e.startAt && <span className="text-foreground/60">· {new Date(e.startAt).toLocaleDateString()}</span>}
                  <button
                    type="button"
                    onClick={() => { unenroll(e.id); toast.success("Unenrolled"); }}
                    className="ml-auto cursor-pointer text-foreground/60 hover:text-destructive font-bold"
                  >
                    remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Shell>
  );
}
