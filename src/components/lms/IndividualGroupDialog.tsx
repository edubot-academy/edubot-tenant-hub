import { useState, useMemo } from "react";
import { toast } from "sonner";
import { X, Plus, Trash2, Search } from "lucide-react";
import { useCreateIndividualCourseGroup } from "@/lib/lms-core-api";
import { useInstructorStudents } from "@/lib/instructor/instructor-grading-api";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEETING_PROVIDERS = [
  { value: "", label: "No meeting link" },
  { value: "zoom", label: "Zoom" },
  { value: "google_meet", label: "Google Meet" },
  { value: "custom", label: "Custom link" },
];

type ScheduleBlock = { day: string; startTime: string; endTime: string };

interface Props {
  courseId: number;
  courseTitle?: string;
  onClose: () => void;
  onCreated?: () => void;
}

export function IndividualGroupDialog({ courseId, courseTitle, onClose, onCreated }: Props) {
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const createMutation = useCreateIndividualCourseGroup();

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [meetingProvider, setMeetingProvider] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [createFirstSession, setCreateFirstSession] = useState(true);

  const studentsQuery = useInstructorStudents(
    backendEnabled ? { q: studentSearch || undefined, limit: 20 } : undefined,
  );

  const uniqueStudents = useMemo(() => {
    const seen = new Set<number>();
    return (studentsQuery.data?.items ?? []).filter((item) => {
      if (seen.has(item.userId)) return false;
      seen.add(item.userId);
      return true;
    });
  }, [studentsQuery.data?.items]);

  const addBlock = () =>
    setScheduleBlocks((prev) => [...prev, { day: "Monday", startTime: "09:00", endTime: "10:00" }]);

  const updateBlock = (index: number, patch: Partial<ScheduleBlock>) =>
    setScheduleBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));

  const removeBlock = (index: number) =>
    setScheduleBlocks((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!selectedStudentId) {
      toast.error("Select a student first");
      return;
    }
    try {
      await createMutation.mutateAsync({
        courseId,
        studentId: selectedStudentId,
        name: selectedStudentName ? `${selectedStudentName} — ${courseTitle ?? `Course #${courseId}`}` : undefined,
        meetingProvider: meetingProvider || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
        startDate: startDate || undefined,
        scheduleBlocks: scheduleBlocks.length > 0 ? scheduleBlocks : undefined,
        createFirstSession: scheduleBlocks.length > 0 ? createFirstSession : false,
      });
      toast.success("Individual group created");
      onCreated?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create individual group");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">New individual group</h2>
            {courseTitle && <p className="text-xs text-foreground/60 mt-0.5">{courseTitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        {/* Student picker */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wide text-foreground/60">Student</label>
          {selectedStudentId ? (
            <div className="flex items-center justify-between rounded-xl border-2 border-primary bg-primary/5 px-3 py-2.5">
              <span className="text-sm font-bold text-primary">{selectedStudentName}</span>
              <button
                type="button"
                onClick={() => { setSelectedStudentId(null); setSelectedStudentName(""); }}
                className="cursor-pointer size-6 grid place-items-center rounded-md hover:bg-primary/20 text-primary"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" />
                <input
                  autoFocus
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search students…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-border bg-background text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>
              {uniqueStudents.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-xl border-2 border-border bg-background divide-y divide-border">
                  {uniqueStudents.map((student) => (
                    <button
                      key={student.userId}
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(student.userId);
                        setSelectedStudentName(student.fullName ?? student.email ?? `Student #${student.userId}`);
                        setStudentSearch("");
                      }}
                      className="cursor-pointer w-full text-left px-3 py-2 hover:bg-muted text-sm"
                    >
                      <p className="font-bold">{student.fullName ?? "(no name)"}</p>
                      <p className="text-xs text-foreground/60">{student.email}</p>
                    </button>
                  ))}
                </div>
              )}
              {studentSearch && uniqueStudents.length === 0 && !studentsQuery.isLoading && (
                <p className="text-xs text-foreground/50 text-center py-2">No students found</p>
              )}
            </div>
          )}
        </div>

        {/* Meeting */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wide text-foreground/60">Meeting</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground/60">Provider</span>
              <select
                value={meetingProvider}
                onChange={(e) => setMeetingProvider(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background text-sm font-medium focus:outline-none focus:border-primary"
              >
                {MEETING_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground/60">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          {meetingProvider && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground/60">Meeting URL</span>
              <input
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://zoom.us/j/…"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Schedule blocks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wide text-foreground/60">Weekly schedule</label>
            <button
              type="button"
              onClick={addBlock}
              className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <Plus className="size-3.5" strokeWidth={3} /> Add slot
            </button>
          </div>
          {scheduleBlocks.length === 0 ? (
            <p className="text-xs text-foreground/50 italic">No recurring slots — add one above</p>
          ) : (
            <div className="space-y-2">
              {scheduleBlocks.map((block, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                  <select
                    value={block.day}
                    onChange={(e) => updateBlock(index, { day: e.target.value })}
                    className="px-2 py-2 rounded-xl border-2 border-border bg-background text-xs font-bold focus:outline-none focus:border-primary"
                  >
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input
                    type="time"
                    value={block.startTime}
                    onChange={(e) => updateBlock(index, { startTime: e.target.value })}
                    className="px-2 py-2 rounded-xl border-2 border-border bg-background text-xs font-bold focus:outline-none focus:border-primary"
                  />
                  <input
                    type="time"
                    value={block.endTime}
                    onChange={(e) => updateBlock(index, { endTime: e.target.value })}
                    className="px-2 py-2 rounded-xl border-2 border-border bg-background text-xs font-bold focus:outline-none focus:border-primary"
                  />
                  <button type="button" onClick={() => removeBlock(index)} className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted text-foreground/60">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
              <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 mt-1">
                <input
                  type="checkbox"
                  checked={createFirstSession}
                  onChange={(e) => setCreateFirstSession(e.target.checked)}
                />
                Auto-create first session from schedule
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedStudentId || createMutation.isPending}
            className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? "Creating…" : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
}
