import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Plus, Trash2, Users, BookOpen, Building2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";
import {
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  type AnnouncementRecord,
  type CreateAnnouncementPayload,
} from "@/lib/announcements-api";
import { useTenantCourseGroups, useAcademicClasses } from "@/lib/lms-core-api";
import { useTenantModel } from "@/lib/app-context";

export const Route = createFileRoute("/instructor/announcements")({
  head: () => ({
    meta: [
      {
        title: i18n.t("instructorAnnouncements.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — Announcements",
        }),
      },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();

  if (context.mode !== "backend") {
    return (
      <DashboardShell>
        <TopBar
          title={t("instructorAnnouncements.topbar.title", { defaultValue: "Announcements" })}
          subtitle={t("instructorAnnouncements.topbar.subtitle", { defaultValue: "Broadcast updates to your classes" })}
        />
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("instructorAnnouncements.state.prototype", { defaultValue: "Prototype mode uses demo class announcements." })}
        </section>
      </DashboardShell>
    );
  }

  return <BackendAnnouncementsPage />;
}

function BackendAnnouncementsPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const listQuery = useAnnouncements();
  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const tenantModel = useTenantModel();
  const groupsQuery = useTenantCourseGroups();
  const classesQuery = useAcademicClasses();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scopeType, setScopeType] = useState<CreateAnnouncementPayload["scopeType"]>("company");
  const [scopeId, setScopeId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleScopeTypeChange = (val: CreateAnnouncementPayload["scopeType"]) => {
    setScopeType(val);
    setScopeId(null);
  };

  const scopeLabel = t(`instructorAnnouncements.scope.${scopeType}`, { defaultValue: scopeType });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (scopeType !== "company" && !scopeId) {
      toast.error(t("instructorAnnouncements.toast.selectScope", { scope: scopeLabel, defaultValue: "Select a specific {{scope}} to target." }));
      return;
    }
    setSubmitting(true);
    try {
      await createMutation.mutateAsync({ title: title.trim(), body: body.trim(), scopeType, scopeId });
      setTitle("");
      setBody("");
      setScopeId(null);
      toast.success(t("instructorAnnouncements.toast.posted", { defaultValue: "Announcement posted" }));
    } catch {
      toast.error(t("instructorAnnouncements.toast.postFailed", { defaultValue: "Failed to post announcement" }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t("instructorAnnouncements.toast.deleted", { defaultValue: "Announcement deleted" }));
    } catch {
      toast.error(t("instructorAnnouncements.toast.deleteFailed", { defaultValue: "Failed to delete announcement" }));
    }
  };

  const items = listQuery.data ?? [];

  const audienceOptions = [
    { value: "company" as const, label: t("instructorAnnouncements.audience.allStudents", { defaultValue: "All students" }), icon: Building2 },
    { value: "group" as const, label: t("instructorAnnouncements.audience.group", { defaultValue: "Group" }), icon: Users },
    ...(tenantModel === "academic" ? [{ value: "class" as const, label: t("instructorAnnouncements.audience.class", { defaultValue: "Class" }), icon: BookOpen }] : []),
  ];

  return (
    <DashboardShell>
      <TopBar
        title={t("instructorAnnouncements.topbar.title", { defaultValue: "Announcements" })}
        subtitle={t("instructorAnnouncements.topbar.subtitle", { defaultValue: "Broadcast updates to your classes" })}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        <section className="space-y-3">
          {listQuery.isLoading ? (
            <div className="space-y-3" aria-label={t("instructorAnnouncements.state.loading", { defaultValue: "Loading announcements…" })}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 rounded-3xl border-2 border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center">
              <Megaphone className="mx-auto size-10 text-foreground/30 mb-3" />
              <p className="font-black">{t("instructorAnnouncements.empty.title", { defaultValue: "No announcements yet" })}</p>
              <p className="text-sm font-medium text-foreground/55 mt-1">
                {t("instructorAnnouncements.empty.body", { defaultValue: "Post your first announcement using the form." })}
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
              <Plus className="size-4 text-primary" /> {t("instructorAnnouncements.form.title", { defaultValue: "New announcement" })}
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/55">
                {t("instructorAnnouncements.form.fields.title", { defaultValue: "Title" })}
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("instructorAnnouncements.form.placeholders.title", { defaultValue: "e.g. Homework due Friday" })}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/55">
                {t("instructorAnnouncements.form.fields.message", { defaultValue: "Message" })}
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("instructorAnnouncements.form.placeholders.message", { defaultValue: "Write your announcement…" })}
                rows={4}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary resize-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/55">
                {t("instructorAnnouncements.form.fields.audience", { defaultValue: "Audience" })}
              </label>
              <div className="flex gap-2">
                {audienceOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleScopeTypeChange(value)}
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

              {scopeType === "group" && (
                <select
                  value={scopeId ?? ""}
                  onChange={(e) => setScopeId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary mt-2"
                >
                  <option value="">{t("instructorAnnouncements.form.placeholders.group", { defaultValue: "Select a group…" })}</option>
                  {(groupsQuery.data ?? []).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}{g.course ? ` — ${g.course.title}` : ""}
                    </option>
                  ))}
                </select>
              )}

              {scopeType === "class" && (
                <select
                  value={scopeId ?? ""}
                  onChange={(e) => setScopeId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary mt-2"
                >
                  <option value="">{t("instructorAnnouncements.form.placeholders.class", { defaultValue: "Select a class…" })}</option>
                  {(classesQuery.data?.items ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.gradeLevel ? ` (${c.gradeLevel})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !title.trim() || !body.trim()}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground disabled:opacity-50"
            >
              {submitting
                ? t("instructorAnnouncements.actions.posting", { defaultValue: "Posting…" })
                : t("instructorAnnouncements.actions.post", { defaultValue: "Post announcement" })}
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
  const { t, i18n: activeI18n } = useTranslation();
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
          aria-label={t("instructorAnnouncements.actions.delete", { defaultValue: "Delete" })}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <p className="text-sm font-medium text-foreground/70 leading-relaxed">{item.body}</p>
      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider text-foreground/45">
        <span className="inline-flex items-center gap-1">
          <ScopeIcon className="size-3" />
          {t(`instructorAnnouncements.scope.${item.scopeType}`, { defaultValue: item.scopeType })}
          {item.scopeId ? ` #${item.scopeId}` : ""}
        </span>
        <span>{new Intl.DateTimeFormat(activeI18n.language).format(new Date(item.createdAt))}</span>
      </div>
    </article>
  );
}
