import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useCreateTenantCourseGroup } from "@/lib/lms-core-api";

interface Props {
  courseId: number;
  courseTitle?: string;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateGroupDialog({ courseId, courseTitle, onClose, onCreated }: Props) {
  const createMutation = useCreateTenantCourseGroup();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [seatLimit, setSeatLimit] = useState("");
  const [startDate, setStartDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Group name is required"); return; }
    if (!code.trim()) { toast.error("Group code is required"); return; }
    try {
      await createMutation.mutateAsync({
        courseId,
        name: name.trim(),
        code: code.trim(),
        seatLimit: seatLimit ? Number(seatLimit) : undefined,
        startDate: startDate || undefined,
      });
      toast.success(`Group "${name.trim()}" created`);
      onCreated?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create group");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">New group</h2>
            {courseTitle && <p className="text-xs text-foreground/60 mt-0.5">{courseTitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Group name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning Cohort"
            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. MTH-101-A"
            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Seat limit</span>
            <input
              type="number"
              min={0}
              value={seatLimit}
              onChange={(e) => setSeatLimit(e.target.value)}
              placeholder="e.g. 20"
              className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? "Creating…" : "Create group"}
          </button>
        </div>
      </form>
    </div>
  );
}
