import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  Search,
  Bookmark,
  Highlighter,
  StickyNote,
  BookOpen,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useAppContext } from "@/lib/app-context";
import {
  useStudentNotes,
  useCreateStudentNote,
  useDeleteStudentNote,
  type StudentNote,
  type CreateNotePayload,
} from "@/lib/student-notes-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/student/notes")({
  head: () => ({ meta: [{ title: i18n.t("studentPages.notes.metaTitle", { appName: i18n.t("app.name") }) }] }),
  component: NotesPage,
});

const KIND_FILTERS = [
  { key: "all", labelKey: "studentPages.notes.filters.all", icon: BookOpen },
  { key: "note", labelKey: "studentPages.notes.filters.note", icon: StickyNote },
  { key: "highlight", labelKey: "studentPages.notes.filters.highlight", icon: Highlighter },
  { key: "bookmark", labelKey: "studentPages.notes.filters.bookmark", icon: Bookmark },
] as const;

const KIND_COLORS: Record<string, string> = {
  highlight: "bg-yellow-200 dark:bg-yellow-900/40",
  note: "bg-muted/50",
  bookmark: "bg-primary/10",
};

function NotesPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);

  const notesQuery = useStudentNotes(
    filter !== "all" ? { kind: filter } : undefined,
  );
  const createMutation = useCreateStudentNote();
  const deleteMutation = useDeleteStudentNote();

  if (context.mode !== "backend") {
    return <PrototypeNotesPage />;
  }

  const items = (notesQuery.data ?? []).filter((n) =>
    n.body.toLowerCase().includes(q.toLowerCase()),
  );

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t("studentPages.notes.noteDeleted"));
    } catch {
      toast.error(t("studentPages.notes.deleteFailed"));
    }
  };

  return (
    <DashboardShell>
      <TopBar
        title={t("studentPages.notes.title")}
        subtitle={t("studentPages.notes.subtitle")}
      />

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-card border-2 border-border rounded-2xl px-4 chunky-shadow">
          <Search className="size-4 text-foreground/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("studentPages.notes.searchPlaceholder")}
            className="bg-transparent outline-none flex-1 py-3 text-sm font-medium"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-primary bg-primary px-5 py-3 text-sm font-black text-primary-foreground chunky-shadow"
        >
          <Plus className="size-4" /> {t("studentPages.notes.addNote")}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {KIND_FILTERS.map((f) => {
          const Icon = f.icon;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-black border-2 inline-flex items-center gap-2 transition-all ${
                active
                  ? "bg-primary text-primary-foreground border-foreground chunky-shadow"
                  : "bg-card border-border hover:-translate-y-0.5"
              }`}
            >
              <Icon className="size-3.5" strokeWidth={2.5} />
              {t(f.labelKey)}
            </button>
          );
        })}
      </div>

      {showForm && (
        <AddNoteForm
          onClose={() => setShowForm(false)}
          onSave={async (payload) => {
            await createMutation.mutateAsync(payload);
            setShowForm(false);
            toast.success(t("studentPages.notes.noteSaved"));
          }}
        />
      )}

      {notesQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 rounded-3xl border-2 border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center">
          <StickyNote className="mx-auto size-10 text-foreground/30 mb-3" />
          <p className="font-black">{t("studentPages.notes.noNotesTitle")}</p>
          <p className="text-sm font-medium text-foreground/55 mt-1">
            {t("studentPages.notes.noNotesBody")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function NoteCard({
  note,
  onDelete,
}: {
  note: StudentNote;
  onDelete: (id: number) => void;
}) {
  const { t } = useTranslation();
  const Icon =
    note.kind === "note"
      ? StickyNote
      : note.kind === "highlight"
        ? Highlighter
        : Bookmark;
  const colorClass = note.color ?? KIND_COLORS[note.kind] ?? "bg-muted/50";

  return (
    <article className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="size-8 grid place-items-center rounded-xl bg-muted">
            <Icon className="size-4 text-primary" strokeWidth={2.5} />
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
            {t(`studentPages.notes.kind.${note.kind}`, { defaultValue: note.kind })}
          </span>
        </div>
        <button
          onClick={() => onDelete(note.id)}
          className="p-1.5 rounded-lg hover:bg-muted text-foreground/40 hover:text-destructive"
          aria-label={t("studentPages.notes.delete")}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <p
        className={`mt-3 text-sm font-medium leading-relaxed rounded-xl px-3 py-2 ${colorClass}`}
      >
        {note.body}
      </p>
      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40 mt-3">
        {new Date(note.createdAt).toLocaleDateString()}
      </p>
    </article>
  );
}

function AddNoteForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: CreateNotePayload) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<CreateNotePayload["kind"]>("note");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    try {
      await onSave({ kind, body: body.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-5 rounded-3xl border-2 border-primary/30 bg-card p-5 chunky-shadow space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-black flex items-center gap-2">
          <Plus className="size-4 text-primary" /> {t("studentPages.notes.newNote")}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted text-foreground/40"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex gap-2">
        {(["note", "highlight", "bookmark"] as const).map((k) => {
          const Icon = k === "note" ? StickyNote : k === "highlight" ? Highlighter : Bookmark;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                kind === k
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground/50 hover:bg-muted"
              }`}
            >
              <Icon className="size-3.5" />
              {t(`studentPages.notes.kind.${k}`)}
            </button>
          );
        })}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("studentPages.notes.writePlaceholder")}
        rows={3}
        className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary resize-none"
        required
        autoFocus
      />

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border-2 border-border text-sm font-bold"
        >
          {t("studentPages.notes.cancel")}
        </button>
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-black disabled:opacity-50"
        >
          {saving ? t("studentPages.notes.saving") : t("studentPages.notes.save")}
        </button>
      </div>
    </form>
  );
}

function PrototypeNotesPage() {
  const { t } = useTranslation();
  const seed = [
    {
      id: "1",
      kind: "highlight" as const,
      body: "The phonological loop has a capacity of roughly 2 seconds of speech.",
      createdAt: new Date().toISOString(),
      color: "bg-yellow-200 dark:bg-yellow-900/40",
    },
    {
      id: "2",
      kind: "note" as const,
      body: "Remember: SN1 = carbocation intermediate; SN2 = one-step backside attack.",
      createdAt: new Date().toISOString(),
      color: null,
    },
  ];

  return (
    <DashboardShell>
      <TopBar
        title={t("studentPages.notes.title")}
        subtitle={t("studentPages.notes.subtitle")}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {seed.map((e) => {
          const Icon =
            e.kind === "note" ? StickyNote : e.kind === "highlight" ? Highlighter : Bookmark;
          return (
            <article
              key={e.id}
              className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="size-8 grid place-items-center rounded-xl bg-muted">
                  <Icon className="size-4 text-primary" strokeWidth={2.5} />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
                  {t(`studentPages.notes.kind.${e.kind}`)}
                </span>
              </div>
              <p className={`text-sm font-medium leading-relaxed rounded-xl px-3 py-2 ${e.color ?? "bg-muted/50"}`}>
                {e.body}
              </p>
            </article>
          );
        })}
      </div>
    </DashboardShell>
  );
}
