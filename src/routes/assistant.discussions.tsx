import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  useAssistantSupport,
  useAssistantSupportNotes,
  useCreateAssistantSupportNote,
  useUpdateAssistantSupportNote,
  type AssistantSupportNote,
} from "@/lib/assistant/assistant-api";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/assistant/discussions")({
  head: () => ({ meta: [{ title: "QuestLMS — Discussions" }] }),
  component: AssistantDiscussionsPage,
});

function AssistantDiscussionsPage() {
  const { context } = useAppContext();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [newNote, setNewNote] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newOwnerRole, setNewOwnerRole] = useState<"assistant" | "admin" | "instructor">("assistant");
  const [newNextAction, setNewNextAction] = useState("");
  const supportQuery = useAssistantSupport({ q: query, status });
  const createNoteMutation = useCreateAssistantSupportNote();

  const items = useMemo(() => supportQuery.data?.items ?? [], [supportQuery.data]);
  const selectedItem = useMemo(
    () => items.find((item) => item.studentId === selectedStudentId) ?? items[0] ?? null,
    [items, selectedStudentId],
  );
  const notesQuery = useAssistantSupportNotes(selectedItem?.studentId ?? null);
  const updateNoteMutation = useUpdateAssistantSupportNote(selectedItem?.studentId ?? null);

  useEffect(() => {
    if (!items.length) {
      setSelectedStudentId(null);
      return;
    }
    if (selectedStudentId === null || !items.some((item) => item.studentId === selectedStudentId)) {
      setSelectedStudentId(items[0].studentId);
    }
  }, [items, selectedStudentId]);

  const noteDrafts = useMemo(() => {
    const map = new Map<number, AssistantSupportNote>();
    for (const note of notesQuery.data ?? []) {
      map.set(note.id, note);
    }
    return map;
  }, [notesQuery.data]);

  const submitNote = async () => {
    if (!selectedItem) {
      toast.error("Select a support case");
      return;
    }
    if (!newNote.trim()) {
      toast.error("Support note is required");
      return;
    }
    try {
      await createNoteMutation.mutateAsync({
        studentId: selectedItem.studentId,
        category: newCategory.trim() || "general",
        priority: newPriority,
        ownerRole: newOwnerRole,
        note: newNote.trim(),
        nextAction: newNextAction.trim() || null,
      });
      setNewNote("");
      setNewNextAction("");
      toast.success("Support note added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add support note");
    }
  };

  const quickUpdate = async (note: AssistantSupportNote, patch: Partial<AssistantSupportNote>) => {
    try {
      await updateNoteMutation.mutateAsync({
        noteId: note.id,
        status: patch.status,
        priority: patch.priority,
        ownerRole: patch.ownerRole,
        nextAction: patch.nextAction,
        note: patch.note,
        lastContactAt: patch.lastContactAt,
      });
      toast.success("Support note updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update support note");
    }
  };

  return (
    <DashboardShell>
      <TopBar title="Discussions & Tickets" subtitle="Student support cases and operational follow-up." showStreak={false} />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses local moderation and ticket queues.
        </section>
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4 min-h-[540px]">
          <aside className="rounded-3xl border-2 border-border bg-card chunky-shadow overflow-hidden flex flex-col">
            <div className="border-b-2 border-border p-3">
              <div className="flex items-center gap-2 rounded-xl bg-muted px-3">
                <Search className="size-4 text-foreground/50" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search support cases…"
                  className="w-full bg-transparent py-2 text-sm font-medium outline-none"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["all", "open", "in_progress", "resolved"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={`rounded-lg px-3 py-1 text-xs font-black uppercase tracking-wider ${
                      status === value ? "bg-foreground text-background" : "bg-muted text-foreground/60"
                    }`}
                  >
                    {value.replaceAll("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {supportQuery.isLoading ? (
                [0, 1, 2].map((index) => <div key={index} className="h-24 rounded-2xl bg-muted animate-pulse" />)
              ) : items.length === 0 ? (
                <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                  No support cases found.
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.studentId}
                    type="button"
                    onClick={() => setSelectedStudentId(item.studentId)}
                    className={`block w-full rounded-2xl border-2 p-4 text-left ${
                      selectedItem?.studentId === item.studentId ? "border-primary bg-primary/5" : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{item.fullName ?? item.email ?? `Student #${item.studentId}`}</p>
                        <p className="mt-1 text-xs font-medium text-foreground/55">
                          {item.groupName ?? item.courseTitle ?? "Tenant workspace"}
                        </p>
                      </div>
                      <span className="rounded-lg bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">
                        {item.supportStatus ?? "open"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.reasons.map((reason) => (
                        <span key={`${item.studentId}-${reason.code}`} className="rounded-lg bg-muted px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/65">
                          {reason.code.replaceAll("_", " ")}
                          {reason.count ? ` (${reason.count})` : ""}
                        </span>
                      ))}
                    </div>
                    {item.nextAction ? (
                      <p className="mt-3 text-xs font-medium text-foreground/60">Next action: {item.nextAction}</p>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="rounded-3xl border-2 border-border bg-card chunky-shadow p-6">
            {!selectedItem ? (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                Select a support case to inspect notes and actions.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black">{selectedItem.fullName ?? selectedItem.email ?? `Student #${selectedItem.studentId}`}</h3>
                    <p className="mt-1 text-sm font-medium text-foreground/65">
                      {selectedItem.groupName ?? selectedItem.courseTitle ?? "Tenant workspace"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-foreground/55">
                      {selectedItem.email ? <span>{selectedItem.email}</span> : null}
                      {selectedItem.phone ? <span>{selectedItem.phone}</span> : null}
                      <span>Guardian linked: {selectedItem.guardianSummary.hasGuardian ? "yes" : "no"}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Metric label="Students needing support" value={String(supportQuery.data?.summary.studentsNeedingSupport ?? 0)} />
                    <Metric label="Pending enrollments" value={String(supportQuery.data?.summary.pendingEnrollments ?? 0)} />
                    <Metric label="Sessions without meeting" value={String(supportQuery.data?.summary.sessionsWithoutMeeting ?? 0)} />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
                  <div className="rounded-2xl border border-border p-4">
                    <h4 className="text-sm font-black uppercase tracking-wider">Support notes</h4>
                    <div className="mt-4 space-y-3">
                      {notesQuery.isLoading ? (
                        [0, 1].map((index) => <div key={index} className="h-32 rounded-2xl bg-muted animate-pulse" />)
                      ) : (notesQuery.data ?? []).length === 0 ? (
                        <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                          No support notes recorded yet.
                        </div>
                      ) : (
                        (notesQuery.data ?? []).map((note) => {
                          const draft = noteDrafts.get(note.id) ?? note;
                          return (
                            <article key={note.id} className="rounded-2xl border border-border p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-xs font-medium text-foreground/50">
                                  {new Date(note.createdAt).toLocaleString()}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <select
                                    value={draft.status}
                                    onChange={(event) => quickUpdate(note, { status: event.target.value as AssistantSupportNote["status"] })}
                                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold"
                                  >
                                    <option value="open">open</option>
                                    <option value="in_progress">in progress</option>
                                    <option value="resolved">resolved</option>
                                  </select>
                                  <select
                                    value={draft.priority}
                                    onChange={(event) => quickUpdate(note, { priority: event.target.value as AssistantSupportNote["priority"] })}
                                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold"
                                  >
                                    <option value="high">high</option>
                                    <option value="medium">medium</option>
                                    <option value="low">low</option>
                                  </select>
                                  <select
                                    value={draft.ownerRole}
                                    onChange={(event) => quickUpdate(note, { ownerRole: event.target.value as AssistantSupportNote["ownerRole"] })}
                                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold"
                                  >
                                    <option value="assistant">assistant</option>
                                    <option value="admin">admin</option>
                                    <option value="instructor">instructor</option>
                                  </select>
                                </div>
                              </div>
                              <p className="mt-3 whitespace-pre-wrap text-sm font-medium text-foreground/75">{note.note}</p>
                              {note.nextAction ? (
                                <p className="mt-3 text-xs font-medium text-foreground/60">Next action: {note.nextAction}</p>
                              ) : null}
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => quickUpdate(note, { status: "in_progress", lastContactAt: new Date().toISOString() })}
                                  className="rounded-lg bg-muted px-3 py-1 text-xs font-black uppercase tracking-wider text-foreground/70"
                                >
                                  Mark in progress
                                </button>
                                <button
                                  type="button"
                                  onClick={() => quickUpdate(note, { status: "resolved", lastContactAt: new Date().toISOString() })}
                                  className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary"
                                >
                                  Resolve
                                </button>
                              </div>
                            </article>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border p-4">
                    <h4 className="text-sm font-black uppercase tracking-wider">Add support note</h4>
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <input
                          value={newCategory}
                          onChange={(event) => setNewCategory(event.target.value)}
                          placeholder="Category"
                          className="rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                        />
                        <select
                          value={newPriority}
                          onChange={(event) => setNewPriority(event.target.value as typeof newPriority)}
                          className="rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                        >
                          <option value="high">High priority</option>
                          <option value="medium">Medium priority</option>
                          <option value="low">Low priority</option>
                        </select>
                        <select
                          value={newOwnerRole}
                          onChange={(event) => setNewOwnerRole(event.target.value as typeof newOwnerRole)}
                          className="rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                        >
                          <option value="assistant">Assistant</option>
                          <option value="admin">Admin</option>
                          <option value="instructor">Instructor</option>
                        </select>
                      </div>
                      <textarea
                        value={newNote}
                        onChange={(event) => setNewNote(event.target.value)}
                        rows={6}
                        placeholder="Write the support note…"
                        className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary resize-none"
                      />
                      <input
                        value={newNextAction}
                        onChange={(event) => setNewNextAction(event.target.value)}
                        placeholder="Next action"
                        className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={submitNote}
                        disabled={createNoteMutation.isPending}
                        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground disabled:opacity-60"
                      >
                        {createNoteMutation.isPending ? "Saving…" : "Add note"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </section>
      )}
    </DashboardShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/30 p-4">
      <div className="text-[10px] font-black uppercase tracking-wider text-foreground/55">{label}</div>
      <div className="mt-2 text-2xl font-black font-mono">{value}</div>
    </div>
  );
}
