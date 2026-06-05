import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  setGroupSchedule,
  clearGroupSchedule,
  type GroupSchedule,
  type GroupScheduleMode,
  type Course,
} from "@/lib/lmsStore";

interface Props {
  open: boolean;
  onClose: () => void;
  classId: string;
  course: Course;
  initial?: GroupSchedule;
}

function combine(date: Date | undefined, time: string): string | undefined {
  if (!date) return undefined;
  const [h, m] = (time || "00:00").split(":").map((v) => parseInt(v, 10) || 0);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function splitIso(iso?: string): { date?: Date; time: string } {
  if (!iso) return { time: "09:00" };
  const d = new Date(iso);
  return {
    date: d,
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

const MODES: { value: GroupScheduleMode; label: string; hint: string }[] = [
  { value: "inherit", label: "Inherit", hint: "All lessons share the same start (and due, for assignments)." },
  { value: "distribute", label: "Distribute", hint: "Spread lessons evenly between start and end date." },
  { value: "offset", label: "Offset", hint: "Course starts on a date; each lesson offset by N days." },
];

export function GroupScheduleDialog({ open, onClose, classId, course, initial }: Props) {
  const [mode, setMode] = useState<GroupScheduleMode>(initial?.mode ?? "distribute");
  const s = splitIso(initial?.startAt);
  const e = splitIso(initial?.endAt);
  const d = splitIso(initial?.dueAt);
  const [startDate, setStartDate] = useState<Date | undefined>(s.date);
  const [startTime, setStartTime] = useState(s.time);
  const [endDate, setEndDate] = useState<Date | undefined>(e.date);
  const [endTime, setEndTime] = useState(e.time);
  const [dueDate, setDueDate] = useState<Date | undefined>(d.date);
  const [dueTime, setDueTime] = useState(d.time === "09:00" ? "23:59" : d.time);

  const orderedLessons = useMemo(() => {
    const list: { id: string; title: string }[] = [];
    for (const m of course.modules) for (const l of m.lessons) list.push({ id: l.id, title: `${m.title} · ${l.title}` });
    for (const l of course.lessons) list.push({ id: l.id, title: l.title });
    return list;
  }, [course]);

  const [offsets, setOffsets] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    orderedLessons.forEach((l, i) => {
      init[l.id] = initial?.lessonOffsets?.[l.id] ?? i;
    });
    return init;
  });

  if (!open) return null;

  const save = () => {
    const startAt = combine(startDate, startTime);
    if (!startAt) {
      toast.error("Pick a start date");
      return;
    }
    const next: GroupSchedule = {
      classId,
      courseId: course.id,
      mode,
      startAt,
      endAt: mode === "distribute" ? combine(endDate, endTime) : undefined,
      dueAt: mode === "inherit" ? combine(dueDate, dueTime) : undefined,
      lessonOffsets: mode === "offset" ? offsets : undefined,
    };
    if (mode === "distribute" && !next.endAt) {
      toast.error("Pick an end date for distribute mode");
      return;
    }
    setGroupSchedule(next);
    toast.success("Course schedule saved");
    onClose();
  };

  const reset = () => {
    clearGroupSchedule(classId, course.id);
    toast.success("Course schedule cleared");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(ev) => ev.stopPropagation()} className="w-full max-w-lg bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4 my-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Course schedule</p>
            <h2 className="text-base font-black truncate">{course.title}</h2>
            <p className="text-[11px] text-foreground/60 mt-0.5">Lessons inherit unless individually overridden.</p>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Mode</span>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={cn(
                  "p-2 rounded-xl border-2 cursor-pointer text-left transition-colors",
                  mode === m.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-foreground/70",
                )}
              >
                <p className="text-xs font-black">{m.label}</p>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-foreground/60">{MODES.find((m) => m.value === mode)?.hint}</p>
        </div>

        <DateTimeField label={mode === "offset" ? "Course start" : "Starts on"} date={startDate} time={startTime} onDateChange={setStartDate} onTimeChange={setStartTime} />

        {mode === "distribute" && (
          <DateTimeField label="Ends on" date={endDate} time={endTime} onDateChange={setEndDate} onTimeChange={setEndTime} />
        )}

        {mode === "inherit" && (
          <DateTimeField label="Due by (assignments / quizzes)" date={dueDate} time={dueTime} onDateChange={setDueDate} onTimeChange={setDueTime} />
        )}

        {mode === "offset" && (
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Day offsets from start</span>
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {orderedLessons.map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <span className="flex-1 truncate text-xs">{l.title}</span>
                  <input
                    type="number"
                    min={0}
                    value={offsets[l.id] ?? 0}
                    onChange={(ev) =>
                      setOffsets((o) => ({ ...o, [l.id]: Math.max(0, parseInt(ev.target.value, 10) || 0) }))
                    }
                    className="w-20 px-2 py-1.5 rounded-lg border-2 border-border bg-background font-medium text-xs focus:outline-none focus:border-primary"
                  />
                  <span className="text-[11px] text-foreground/60 w-6">d</span>
                </div>
              ))}
              {orderedLessons.length === 0 && (
                <p className="text-xs text-foreground/60">No lessons in this course yet.</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <button type="button" onClick={reset} className="cursor-pointer px-3 py-2 rounded-xl text-xs font-bold text-foreground/60 hover:text-foreground hover:bg-muted">
            Clear
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">
              Cancel
            </button>
            <button type="button" onClick={save} className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DateTimeField({
  label, date, time, onDateChange, onTimeChange,
}: {
  label: string;
  date: Date | undefined;
  time: string;
  onDateChange: (d: Date | undefined) => void;
  onTimeChange: (t: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{label}</span>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("flex-1 justify-start text-left font-medium border-2", !date && "text-muted-foreground")}>
              <CalendarIcon className="size-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={onDateChange} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        <input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-28 px-3 py-2 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}
