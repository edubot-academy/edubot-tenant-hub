import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  X as XIcon,
  Clock,
  Shield,
  UserPlus,
  Trash2,
  RotateCcw,
  Flame,
} from "lucide-react";
import {
  useLms,
  ensureClassRoster,
  getClassRoster,
  addRosterStudent,
  removeRosterStudent,
  markAttendance,
  clearAttendance,
  bulkMarkAttendance,
  getAttendanceMap,
  attendanceStatsForClass,
  attendanceStreakForStudent,
  todayKey,
  type AttendanceStatus,
} from "@/lib/lmsStore";

const STATUS_META: Record<
  AttendanceStatus,
  { label: string; short: string; icon: typeof Check; cls: string }
> = {
  present: { label: "Present", short: "P", icon: Check, cls: "bg-primary text-primary-foreground border-primary" },
  late:    { label: "Late",    short: "L", icon: Clock, cls: "bg-accent text-accent-foreground border-accent" },
  absent:  { label: "Absent",  short: "A", icon: XIcon, cls: "bg-destructive text-destructive-foreground border-destructive" },
  excused: { label: "Excused", short: "E", icon: Shield, cls: "bg-secondary text-secondary-foreground border-secondary" },
};

const STATUSES: AttendanceStatus[] = ["present", "late", "absent", "excused"];

export function ClassAttendance({ classId }: { classId: string }) {
  const state = useLms();
  const [date, setDate] = useState<string>(todayKey());
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  // Lazily seed a roster the first time this view mounts.
  useEffect(() => { ensureClassRoster(classId); }, [classId]);

  const roster = useMemo(() => getClassRoster(state, classId), [state, classId]);
  const todayMap = useMemo(() => getAttendanceMap(state, classId, date), [state, classId, date]);
  const stats = useMemo(() => attendanceStatsForClass(state, classId), [state, classId]);

  const markedToday = roster.filter((s) => todayMap[s.id]).length;

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    if (todayMap[studentId] === status) {
      clearAttendance(classId, studentId, date);
    } else {
      markAttendance(classId, studentId, date, status);
    }
  };

  const markAll = (status: AttendanceStatus) => {
    bulkMarkAttendance(classId, date, status);
    toast.success(`Marked everyone ${STATUS_META[status].label.toLowerCase()}`);
  };

  const resetDay = () => {
    roster.forEach((s) => clearAttendance(classId, s.id, date));
    toast.success("Day cleared");
  };

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const s = addRosterStudent(classId, newName);
    if (s) {
      setNewName("");
      setAdding(false);
      toast.success(`Added ${s.name}`);
    }
  };

  return (
    <section className="space-y-4 mt-10">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-black">Attendance</h3>
          <p className="text-xs text-foreground/60 mt-0.5">
            One-tap status per student. Auto-tracks streaks and class rate.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || todayKey())}
            className="px-3 py-2 rounded-xl border-2 border-border bg-card font-bold text-xs focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setDate(todayKey())}
            className="cursor-pointer px-3 py-2 rounded-xl border-2 border-border bg-card font-bold text-xs hover:bg-muted"
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Class rate" value={`${Math.round(stats.attendanceRate * 100)}%`} />
        <Stat label="Marked today" value={`${markedToday}/${roster.length}`} />
        <Stat label="Days recorded" value={String(stats.recordedDays)} />
        <Stat label="Students" value={String(roster.length)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => markAll("present")}
          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs chunky-shadow hover:opacity-90"
        >
          <Check className="size-3.5" strokeWidth={3} /> Mark all present
        </button>
        <button
          type="button"
          onClick={() => markAll("absent")}
          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-border bg-card font-bold text-xs hover:bg-muted"
        >
          <XIcon className="size-3.5" strokeWidth={3} /> Mark all absent
        </button>
        <button
          type="button"
          onClick={resetDay}
          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-border bg-card font-bold text-xs hover:bg-muted"
        >
          <RotateCcw className="size-3.5" strokeWidth={3} /> Reset day
        </button>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="cursor-pointer ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-dashed border-border font-bold text-xs hover:bg-muted"
        >
          <UserPlus className="size-3.5" strokeWidth={3} /> Add student
        </button>
      </div>

      {adding && (
        <form onSubmit={onAdd} className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Student name"
            autoFocus
            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="cursor-pointer px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90"
          >
            Add
          </button>
        </form>
      )}

      {roster.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
          <p className="font-bold">No students on the roster yet.</p>
          <p className="text-sm text-foreground/60">Add students to start tracking attendance.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border-2 border-border bg-card overflow-hidden">
          {roster.map((s) => {
            const current = todayMap[s.id];
            const streak = attendanceStreakForStudent(state, classId, s.id);
            return (
              <li key={s.id} className="flex items-center gap-3 p-3 flex-wrap">
                <div className="size-9 rounded-full bg-muted grid place-items-center font-black text-xs shrink-0">
                  {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{s.name}</p>
                  {s.email && <p className="text-[11px] text-foreground/50 truncate">{s.email}</p>}
                </div>
                {streak > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[11px] font-black">
                    <Flame className="size-3 text-accent" /> {streak}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  {STATUSES.map((st) => {
                    const meta = STATUS_META[st];
                    const Icon = meta.icon;
                    const active = current === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(s.id, st)}
                        aria-label={`Mark ${meta.label}`}
                        title={meta.label}
                        className={`cursor-pointer size-9 grid place-items-center rounded-lg border-2 font-black text-xs transition ${
                          active
                            ? `${meta.cls} chunky-shadow`
                            : "border-border bg-background text-foreground/60 hover:bg-muted"
                        }`}
                      >
                        <Icon className="size-3.5" strokeWidth={3} />
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove ${s.name} from the roster?`)) {
                        removeRosterStudent(classId, s.id);
                        toast.success("Removed from roster");
                      }
                    }}
                    aria-label="Remove from roster"
                    className="cursor-pointer size-9 grid place-items-center rounded-lg border-2 border-border text-foreground/50 hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{label}</p>
      <p className="font-black text-xl mt-0.5">{value}</p>
    </div>
  );
}
