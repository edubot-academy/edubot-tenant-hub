import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  AlertTriangle, BookOpen, Calendar, Loader2, MoreVertical,
  Pencil, Plus, RefreshCw, Trash2, Users, X,
} from "lucide-react";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import {
  useTenantCourseGroups,
  useCreateTenantCourseGroup,
  useUpdateTenantCourseGroup,
  useDeleteTenantCourseGroup,
  useTenantCourses,
  type TenantCourseGroupRecord,
} from "@/lib/lms-core-api";

export const Route = createFileRoute("/groups")({
  head: () => ({ meta: [{ title: "QuestLMS — Groups" }] }),
  component: GroupsPage,
});

/* ─── helpers ──────────────────────────────────────────────────── */

function compactToken(value: string, fallback: string) {
  const token = value
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.slice(0, 3))
    .join("");
  return token || fallback;
}

function generateCodeSuffix() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

const STATUS_LABELS: Record<string, string> = {
  planned: "Planned", open: "Open", active: "Active",
  completed: "Completed", cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-slate-100 text-slate-600",
  open: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

/* ─── Create Dialog ─────────────────────────────────────────────── */

function CreateGroupDialog({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateTenantCourseGroup();
  const coursesQuery = useTenantCourses();
  const courses = (coursesQuery.data?.items ?? []).filter(
    (course) =>
      course.isPublished &&
      course.status === "approved" &&
      course.courseType !== "video",
  );

  const [courseId, setCourseId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [seatLimit, setSeatLimit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [codeSuffix, setCodeSuffix] = useState(() => generateCodeSuffix());

  const selectedCourse = courses.find((c) => c.id === courseId);

  const code = useMemo(() => {
    const courseToken = compactToken(selectedCourse?.title ?? "", "CRS");
    const nameToken = compactToken(name, "GRP");
    return `${courseToken}-${nameToken}-${codeSuffix}`;
  }, [codeSuffix, selectedCourse, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) { toast.error("Select a course first"); return; }
    if (!name.trim()) { toast.error("Group name is required"); return; }
    if (startDate && endDate && endDate < startDate) { toast.error("End date must be after start date"); return; }
    try {
      await createMutation.mutateAsync({
        courseId: Number(courseId),
        name: name.trim(),
        code,
        seatLimit: seatLimit ? Number(seatLimit) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      toast.success(`Group "${name.trim()}" created`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create group");
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
          <h2 className="text-xl font-black">New Group</h2>
          <button type="button" onClick={onClose} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Course</span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
          >
            <option value="">Select a course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Group name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning Batch A"
            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Code</span>
          <div className="flex items-center gap-2">
            <input
              value={code}
              readOnly
              className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-muted font-medium text-sm text-foreground/70"
            />
            <button
              type="button"
              onClick={() => setCodeSuffix(generateCodeSuffix())}
              className="cursor-pointer shrink-0 size-11 grid place-items-center rounded-xl border-2 border-border bg-background hover:bg-muted"
              title="Regenerate code"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Seats</span>
            <input
              type="number" min={0} value={seatLimit}
              onChange={(e) => setSeatLimit(e.target.value)}
              placeholder="∞"
              className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Start</span>
            <input
              type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">End</span>
            <input
              type="date" value={endDate} min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">
            Cancel
          </button>
          <button type="submit" disabled={createMutation.isPending}
            className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 disabled:opacity-50">
            {createMutation.isPending ? "Creating…" : "Create Group"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Edit Dialog ───────────────────────────────────────────────── */

function EditGroupDialog({ group, onClose }: { group: TenantCourseGroupRecord; onClose: () => void }) {
  const updateMutation = useUpdateTenantCourseGroup();
  const [name, setName] = useState(group.name);
  const [status, setStatus] = useState(group.status);
  const [startDate, setStartDate] = useState(group.startDate ?? "");
  const [endDate, setEndDate] = useState(group.endDate ?? "");
  const [seatLimit, setSeatLimit] = useState(group.seatLimit != null ? String(group.seatLimit) : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Group name is required"); return; }
    if (startDate && endDate && endDate < startDate) { toast.error("End date must be after start date"); return; }
    try {
      await updateMutation.mutateAsync({
        groupId: group.id,
        name: name.trim(),
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        seatLimit: seatLimit ? Number(seatLimit) : undefined,
      });
      toast.success("Group updated");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update group");
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
            <h2 className="text-xl font-black">Edit Group</h2>
            <p className="text-xs text-foreground/50 mt-0.5">{group.code}</p>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Group name</span>
          <input
            autoFocus value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
          >
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Seats</span>
            <input
              type="number" min={0} value={seatLimit}
              onChange={(e) => setSeatLimit(e.target.value)}
              placeholder="∞"
              className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Start</span>
            <input
              type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">End</span>
            <input
              type="date" value={endDate} min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">
            Cancel
          </button>
          <button type="submit" disabled={updateMutation.isPending}
            className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 disabled:opacity-50">
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Delete Confirm Dialog ─────────────────────────────────────── */

function DeleteGroupDialog({ group, onClose }: { group: TenantCourseGroupRecord; onClose: () => void }) {
  const deleteMutation = useDeleteTenantCourseGroup();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ groupId: group.id, courseId: group.courseId });
      toast.success(`Group "${group.name}" deleted`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete group");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 size-10 rounded-xl bg-destructive/10 grid place-items-center">
            <AlertTriangle className="size-5 text-destructive" />
          </div>
          <div>
            <h2 className="font-black text-lg">Delete group?</h2>
            <p className="text-sm text-foreground/60 mt-0.5">
              <span className="font-bold text-foreground">{group.name}</span> and all its sessions
              will be permanently deleted. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="cursor-pointer px-4 py-2.5 rounded-2xl bg-destructive text-destructive-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Group Card ────────────────────────────────────────────────── */

function GroupCard({
  group,
  onEdit,
  onDelete,
}: {
  group: TenantCourseGroupRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow hover:border-primary/40 hover:-translate-y-0.5 transition-all">
      {/* Card header */}
      <Link to="/groups/$groupId" params={{ groupId: String(group.id) }} className="block">
        <div className="h-20 bg-gradient-to-br from-primary to-secondary relative flex items-end px-4 pb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/80 absolute top-3 left-4">
            {group.code}
          </span>
          {group.deliveryMode === "individual" && (
            <span className="absolute top-3 right-10 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-white/20 text-white border-white/30">
              1-on-1
            </span>
          )}
        </div>
      </Link>

      {/* Action menu button — sits on top of the header */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
          className="size-7 grid place-items-center rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
        >
          <MoreVertical className="size-3.5" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-20 min-w-[130px] rounded-xl border-2 border-border bg-card chunky-shadow py-1 text-sm font-bold">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onEdit(); }}
                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted text-left"
              >
                <Pencil className="size-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDelete(); }}
                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted text-destructive text-left"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Card body */}
      <Link to="/groups/$groupId" params={{ groupId: String(group.id) }} className="block p-4 space-y-3">
        <div>
          <h3 className="font-black text-base leading-tight truncate group-hover:text-primary transition-colors">
            {group.name}
          </h3>
          <p className="text-xs text-foreground/50 font-medium mt-0.5 truncate">
            {group.course?.title ?? "Course"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${STATUS_COLORS[group.status] ?? "bg-muted text-muted-foreground"}`}>
            {STATUS_LABELS[group.status] ?? group.status}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-bold text-foreground/55 pt-2 border-t border-border/60">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" /> {group.activeStudentCount ?? 0}
          </span>
          <span className="inline-flex items-center gap-1.5 truncate">
            <Calendar className="size-3.5 shrink-0" />
            {group.startDate ? new Date(group.startDate).toLocaleDateString() : "No date"}
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5">
            <BookOpen className="size-3.5" />
            {group.seatLimit != null ? `${group.activeStudentCount ?? 0}/${group.seatLimit}` : "Open"}
          </span>
        </div>
      </Link>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */

function GroupsPage() {
  const childMatches = useChildMatches();
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const groupsQuery = useTenantCourseGroups();

  const [showCreate, setShowCreate] = useState(false);
  const [editGroup, setEditGroup] = useState<TenantCourseGroupRecord | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<TenantCourseGroupRecord | null>(null);

  if (childMatches.length > 0) return <Outlet />;

  const groups = groupsQuery.data ?? [];

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <TopBar
          title="Groups"
          subtitle="Course groups and their sessions."
          showStreak={false}
        />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-bold text-foreground/50">
            {backendEnabled && !groupsQuery.isLoading
              ? `${groups.length} group${groups.length === 1 ? "" : "s"}`
              : ""}
          </p>
          {backendEnabled && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow hover:-translate-y-0.5 transition-transform"
            >
              <Plus className="size-4" />
              New Group
            </button>
          )}
        </div>

        {!backendEnabled ? (
          <EmptyState onCreateClick={() => setShowCreate(true)} showButton={false} />
        ) : groupsQuery.isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-7 animate-spin text-foreground/30" />
          </div>
        ) : groupsQuery.isError ? (
          <div className="rounded-2xl border-2 border-dashed border-destructive/40 bg-card p-10 text-center">
            <p className="font-bold text-destructive">Could not load groups</p>
            <p className="text-sm text-foreground/50 mt-1">The request failed. Try refreshing.</p>
          </div>
        ) : groups.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreate(true)} showButton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onEdit={() => setEditGroup(group)}
                onDelete={() => setDeleteGroup(group)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateGroupDialog onClose={() => setShowCreate(false)} />}
      {editGroup && <EditGroupDialog group={editGroup} onClose={() => setEditGroup(null)} />}
      {deleteGroup && <DeleteGroupDialog group={deleteGroup} onClose={() => setDeleteGroup(null)} />}
    </DashboardShell>
  );
}

function EmptyState({ onCreateClick, showButton }: { onCreateClick: () => void; showButton: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 flex flex-col items-center gap-3 text-center">
      <Users className="size-10 text-foreground/20" strokeWidth={1.5} />
      <p className="text-sm font-bold text-foreground/50">No groups yet</p>
      <p className="text-xs text-foreground/40">Create a group to start organizing course sessions.</p>
      {showButton && (
        <button
          type="button"
          onClick={onCreateClick}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow hover:-translate-y-0.5 transition-transform"
        >
          <Plus className="size-4" />
          New Group
        </button>
      )}
    </div>
  );
}
