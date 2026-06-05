import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { setSchedule, clearSchedule, type LessonSchedule, type LessonType } from "@/lib/lmsStore";

interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  lessonId: string;
  lessonTitle: string;
  lessonType: LessonType;
  initial?: LessonSchedule;
}

function combine(date: Date | undefined, time: string): string | undefined {
  if (!date) return undefined;
  const [h, m] = (time || "00:00").split(":").map((v) => parseInt(v, 10) || 0);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function splitIso(iso?: string): { date?: Date; time: string } {
  if (!iso) return { time: "" };
  const d = new Date(iso);
  return {
    date: d,
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

export function ScheduleDialog({ open, onClose, classId, lessonId, lessonTitle, lessonType, initial }: ScheduleDialogProps) {
  const startInit = splitIso(initial?.startAt);
  const dueInit = splitIso(initial?.dueAt);
  const [startDate, setStartDate] = useState<Date | undefined>(startInit.date);
  const [startTime, setStartTime] = useState(startInit.time || "09:00");
  const [dueDate, setDueDate] = useState<Date | undefined>(dueInit.date);
  const [dueTime, setDueTime] = useState(dueInit.time || "23:59");

  const showDue = lessonType === "assignment" || lessonType === "quiz";

  if (!open) return null;

  const save = () => {
    const startAt = startDate ? combine(startDate, startTime) : null;
    const dueAt = showDue && dueDate ? combine(dueDate, dueTime) : null;
    if (!startAt && !dueAt) {
      clearSchedule(classId, lessonId);
      toast.success("Schedule cleared");
    } else {
      setSchedule(classId, lessonId, { startAt, dueAt });
      toast.success("Schedule saved");
    }
    onClose();
  };

  const reset = () => {
    setStartDate(undefined);
    setDueDate(undefined);
    clearSchedule(classId, lessonId);
    toast.success("Schedule cleared");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Schedule</p>
            <h2 className="text-base font-black truncate">{lessonTitle}</h2>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <DateTimeField
          label="Starts on"
          date={startDate}
          time={startTime}
          onDateChange={setStartDate}
          onTimeChange={setStartTime}
        />

        {showDue && (
          <DateTimeField
            label="Due by"
            date={dueDate}
            time={dueTime}
            onDateChange={setDueDate}
            onTimeChange={setDueTime}
          />
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
            <Button
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-medium border-2",
                !date && "text-muted-foreground",
              )}
            >
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
