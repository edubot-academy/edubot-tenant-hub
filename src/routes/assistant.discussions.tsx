import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import "@/lib/assistant/assistant-i18n";
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
import i18n from "@/lib/i18n";

const SUPPORT_STATUSES = ["all", "open", "in_progress", "resolved"] as const;
const SUPPORT_PRIORITIES = ["high", "medium", "low"] as const;
const SUPPORT_OWNER_ROLES = ["assistant", "admin", "instructor"] as const;

export const Route = createFileRoute("/assistant/discussions")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("meta.assistant.discussions")}` }] }),
  component: AssistantDiscussionsPage,
});

function AssistantDiscussionsPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const { context } = useAppContext();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof SUPPORT_STATUSES)[number]>("all");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [newNote, setNewNote] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newPriority, setNewPriority] = useState<(typeof SUPPORT_PRIORITIES)[number]>("medium");
  const [newOwnerRole, setNewOwnerRole] = useState<(typeof SUPPORT_OWNER_ROLES)[number]>("assistant");
  const [newNextAction, setNewNextAction] = useState("");
  const locale = activeI18n.resolvedLanguage || activeI18n.language;
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
      toast.error(t("assistantSupportPage.toast.selectCase"));
      return;
    }
    if (!newNote.trim()) {
      toast.error(t("assistantSupportPage.toast.noteRequired"));
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
      toast.success(t("assistantSupportPage.toast.added"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("assistantSupportPage.toast.addFailed"));
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
      toast.success(t("assistantSupportPage.toast.updated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("assistantSupportPage.toast.updateFailed"));
    }
  };

  return (
    <DashboardShell>
      <TopBar title={t("assistantSupportPage.title")} subtitle={t("assistantSupportPage.subtitle")} showStreak={false} />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("assistantSupportPage.prototype")}
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr] xl:items-start">
          <aside className="rounded-3xl border-2 border-border bg-card chunky-shadow overflow-hidden flex flex-col xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)]">
            <div className="border-b-2 border-border p-3">
              <div className="flex items-center gap-2 rounded-xl bg-muted px-3">
                <Search className="size-4 text-foreground/50" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("assistantSupportPage.search")}
                  className="w-full bg-transparent py-2 text-sm font-medium outline-none"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUPPORT_STATUSES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={`rounded-lg px-3 py-1 text-xs font-black uppercase tracking-wider ${
                      status === value ? "bg-foreground text-background" : "bg-muted text-foreground/60"
                    }`}
                  >
                    {t(`assistantSupportPage.status.${value}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {supportQuery.isLoading ? (
                [0, 1, 2].map((index) => <div key={index} className="h-24 rounded-2xl bg-muted animate-pulse" />)
              ) : items.length === 0 ? (
                <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                  {t("assistantSupportPage.empty")}
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
                        <p className="truncate text-sm font-black">{item.fullName ?? item.email ?? t("assistantSupportPage.studentFallback", { id: item.studentId })}</p>
                        <p className="mt-1 text-xs font-medium text-foreground/55">
                          {item.groupName ?? item.courseTitle ?? t("assistantSupportPage.workspaceFallback")}
                        </p>
                      </div>
                      <span className="rounded-lg bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">
                        {t(`assistantSupportPage.status.${item.supportStatus ?? "open"}`)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.reasons.map((reason) => (
                        <span key={`${item.studentId}-${reason.code}`} className="rounded-lg bg-muted px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/65">
                          {t(`assistantSupportPage.reasons.${reason.code}`)}
                          {reason.count ? ` (${reason.count})` : ""}
                        </span>
                      ))}
                    </div>
                    {item.nextAction ? (
                      <p className="mt-3 text-xs font-medium text-foreground/60">
                        {t("assistantSupportPage.nextAction", { action: item.nextAction })}
                      </p>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="rounded-3xl border-2 border-border bg-card chunky-shadow p-4 sm:p-6">
            {!selectedItem ? (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                {t("assistantSupportPage.selectCase")}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black">{selectedItem.fullName ?? selectedItem.email ?? t("assistantSupportPage.studentFallback", { id: selectedItem.studentId })}</h3>
                    <p className="mt-1 text-sm font-medium text-foreground/65">
                      {selectedItem.groupName ?? selectedItem.courseTitle ?? t("assistantSupportPage.workspaceFallback")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-foreground/55">
                      {selectedItem.email ? <span>{selectedItem.email}</span> : null}
                      {selectedItem.phone ? <span>{selectedItem.phone}</span> : null}
                      <span>
                        {t("assistantSupportPage.guardian.linked", {
                          value: selectedItem.guardianSummary.hasGuardian
                            ? t("assistantSupportPage.guardian.yes")
                            : t("assistantSupportPage.guardian.no"),
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-3">
                    <Metric label={t("assistantSupportPage.summary.studentsNeedingSupport")} value={String(supportQuery.data?.summary.studentsNeedingSupport ?? 0)} />
                    <Metric label={t("assistantSupportPage.summary.pendingEnrollments")} value={String(supportQuery.data?.summary.pendingEnrollments ?? 0)} />
                    <Metric label={t("assistantSupportPage.summary.sessionsWithoutMeeting")} value={String(supportQuery.data?.summary.sessionsWithoutMeeting ?? 0)} />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-border p-4">
                    <h4 className="text-sm font-black uppercase tracking-wider">{t("assistantSupportPage.notes.title")}</h4>
                    <div className="mt-4 space-y-3">
                      {notesQuery.isLoading ? (
                        [0, 1].map((index) => <div key={index} className="h-32 rounded-2xl bg-muted animate-pulse" />)
                      ) : (notesQuery.data ?? []).length === 0 ? (
                        <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                          {t("assistantSupportPage.notes.empty")}
                        </div>
                      ) : (
                        (notesQuery.data ?? []).map((note) => {
                          const draft = noteDrafts.get(note.id) ?? note;
                          return (
                            <article key={note.id} className="rounded-2xl border border-border p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-xs font-medium text-foreground/50">
                                  {formatDateTime(note.createdAt, locale)}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <select
                                    value={draft.status}
                                    onChange={(event) => quickUpdate(note, { status: event.target.value as AssistantSupportNote["status"] })}
                                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold"
                                  >
                                    <option value="open">{t("assistantSupportPage.status.open")}</option>
                                    <option value="in_progress">{t("assistantSupportPage.status.in_progress")}</option>
                                    <option value="resolved">{t("assistantSupportPage.status.resolved")}</option>
                                  </select>
                                  <select
                                    value={draft.priority}
                                    onChange={(event) => quickUpdate(note, { priority: event.target.value as AssistantSupportNote["priority"] })}
                                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold"
                                  >
                                    {SUPPORT_PRIORITIES.map((priority) => (
                                      <option key={priority} value={priority}>{t(`assistantSupportPage.priority.${priority}`)}</option>
                                    ))}
                                  </select>
                                  <select
                                    value={draft.ownerRole}
                                    onChange={(event) => quickUpdate(note, { ownerRole: event.target.value as AssistantSupportNote["ownerRole"] })}
                                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold"
                                  >
                                    {SUPPORT_OWNER_ROLES.map((role) => (
                                      <option key={role} value={role}>{t(`assistantSupportPage.ownerRole.${role}`)}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <p className="mt-3 whitespace-pre-wrap text-sm font-medium text-foreground/75">{note.note}</p>
                              {note.nextAction ? (
                                <p className="mt-3 text-xs font-medium text-foreground/60">
                                  {t("assistantSupportPage.nextAction", { action: note.nextAction })}
                                </p>
                              ) : null}
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => quickUpdate(note, { status: "in_progress", lastContactAt: new Date().toISOString() })}
                                  className="rounded-lg bg-muted px-3 py-1 text-xs font-black uppercase tracking-wider text-foreground/70"
                                >
                                  {t("assistantSupportPage.notes.markInProgress")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => quickUpdate(note, { status: "resolved", lastContactAt: new Date().toISOString() })}
                                  className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary"
                                >
                                  {t("assistantSupportPage.notes.resolve")}
                                </button>
                              </div>
                            </article>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border p-4">
                    <h4 className="text-sm font-black uppercase tracking-wider">{t("assistantSupportPage.form.title")}</h4>
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <input
                          value={newCategory}
                          onChange={(event) => setNewCategory(event.target.value)}
                          placeholder={t("assistantSupportPage.form.category")}
                          className="rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                        />
                        <select
                          value={newPriority}
                          onChange={(event) => setNewPriority(event.target.value as typeof newPriority)}
                          className="rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                        >
                          {SUPPORT_PRIORITIES.map((priority) => (
                            <option key={priority} value={priority}>{t(`assistantSupportPage.priority.${priority}`)}</option>
                          ))}
                        </select>
                        <select
                          value={newOwnerRole}
                          onChange={(event) => setNewOwnerRole(event.target.value as typeof newOwnerRole)}
                          className="rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                        >
                          {SUPPORT_OWNER_ROLES.map((role) => (
                            <option key={role} value={role}>{t(`assistantSupportPage.ownerRole.${role}`)}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={newNote}
                        onChange={(event) => setNewNote(event.target.value)}
                        rows={6}
                        placeholder={t("assistantSupportPage.form.notePlaceholder")}
                        className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary resize-none"
                      />
                      <input
                        value={newNextAction}
                        onChange={(event) => setNewNextAction(event.target.value)}
                        placeholder={t("assistantSupportPage.form.nextAction")}
                        className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={submitNote}
                        disabled={createNoteMutation.isPending}
                        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground disabled:opacity-60"
                      >
                        {createNoteMutation.isPending ? t("assistantSupportPage.form.saving") : t("assistantSupportPage.form.add")}
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

function formatDateTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/30 p-4">
      <div className="text-[10px] font-black uppercase tracking-wider text-foreground/55">{label}</div>
      <div className="mt-2 text-2xl font-black font-mono">{value}</div>
    </div>
  );
}
