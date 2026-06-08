import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Plus, Trash2, Users, BookOpen, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import {
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  type AnnouncementRecord,
  type CreateAnnouncementPayload,
} from "@/lib/announcements-api";

export const Route = createFileRoute("/instructor/announcements")({
  head: () => ({ meta: [{ title: "QuestLMS — Announcements" }] }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { context } = useAppContext();

  if (context.mode !== "backend") {
    return (
      <DashboardShell>
        <TopBar title="Announcements" subtitle="Broadcast updates to your classes" />
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses demo class announcements.
        </section>
      </DashboardShell>
    );
  }

  return <BackendAnnouncementsPage />;
}

function BackendAnnouncementsPage() {
  const listQuery = useAnnouncements();
  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scopeType, setScopeType] = useState<CreateAnnouncementPayload["scopeType"]>("company");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      await createMutation.mutateAsync({ title: title.trim(), body: body.trim(), scopeType });
      setTitle("");
      setBody("");
      toast.success("Announcement posted");
    } catch {
      toast.error("Failed to post announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Announcement deleted");
    } catch {
      toast.error("Failed to delete announcement");
    }
  };

  const items = listQuery.data ?? [];

  return (
    <DashboardShell>
      <TopBar title="Announcements" subtitle="Broadcast updates to your classes" />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        <section className="space-y-3">
          {listQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 rounded-3xl border-2 border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center">
              <Megaphone className="mx-auto size-10 text-foreground/30 mb-3" />
              <p className="font-black">No announcements yet</p>
              <p className="text-sm font-medium text-foreground/55 mt-1">
                Post your first announcement using the form.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <AnnouncementCard key={item.id} item={item} onDelete={handleDelete} />
            ))
          )}
        </section>

        <aside>
          <form
            onSubmit={handleCreate}
            className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4 sticky top-4"
          >
            <h3 className="flex items-center gap-2 font-black">
              <Plus className="size-4 text-primary" /> New announcement
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/55">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Homework due Friday"
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/55">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your announcement…"
                rows={4}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary resize-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/55">
                Audience
              </label>
              <div className="flex gap-2">
                {(
                  [
                    { value: "company", label: "All students", icon: Building2 },
                    { value: "group", label: "Group", icon: Users },
                    { value: "class", label: "Class", icon: BookOpen },
                  ] as const
                ).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScopeType(value)}
                    className={`flex-1 flex flex-col items-center gap-1 rounded-xl border-2 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                      scopeType === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground/50 hover:bg-muted"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !title.trim() || !body.trim()}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground disabled:opacity-50"
            >
              {submitting ? "Posting…" : "Post announcement"}
            </button>
          </form>
        </aside>
      </div>
    </DashboardShell>
  );
}

function AnnouncementCard({
  item,
  onDelete,
}: {
  item: AnnouncementRecord;
  onDelete: (id: number) => void;
}) {
  const ScopeIcon =
    item.scopeType === "company"
      ? Building2
      : item.scopeType === "group"
        ? Users
        : BookOpen;

  return (
    <article className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-primary/10 p-1.5 text-primary">
            <Megaphone className="size-4" />
          </span>
          <p className="font-black">{item.title}</p>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 rounded-lg hover:bg-muted text-foreground/40 hover:text-destructive"
          aria-label="Delete"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <p className="text-sm font-medium text-foreground/70 leading-relaxed">{item.body}</p>
      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider text-foreground/45">
        <span className="inline-flex items-center gap-1">
          <ScopeIcon className="size-3" />
          {item.scopeType}
          {item.scopeId ? ` #${item.scopeId}` : ""}
        </span>
        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
      </div>
    </article>
  );
}
