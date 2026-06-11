import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Edit3, Globe, Save, Star, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ApiError, isBackendApiEnabled } from "@/lib/api/client";
import i18n from "@/lib/i18n";
import { useInstructorProfile, useUpdateInstructorProfile } from "@/lib/profile/profile-api";

export const Route = createFileRoute("/instructor/profile")({
  head: () => ({
    meta: [
      {
        title: i18n.t("instructorProfile.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — Instructor Profile",
        }),
      },
    ],
  }),
  component: InstructorProfile,
});

const fallbackCourses = [
  { id: 1, titleKey: "instructorProfile.preview.course1", title: "Когнитивдик психология", studentsCount: 124, ratingAverage: 4.9, ratingCount: 28, status: "published" },
  { id: 2, titleKey: "instructorProfile.preview.course2", title: "Эске киришүү", studentsCount: 412, ratingAverage: 4.8, ratingCount: 46, status: "published" },
  { id: 3, titleKey: "instructorProfile.preview.course3", title: "Көңүл жана кабыл алуу", studentsCount: 89, ratingAverage: 4.7, ratingCount: 16, status: "published" },
];

const fallbackReviews = [
  { id: 1, studentName: "Айгерим С.", comment: "Түшүндүрмөлөрү абдан так жана сабактар түзүмдүү.", courseTitle: "Когнитивдик психология" },
  { id: 2, studentName: "Нурсултан Б.", comment: "Практикалык мисалдар көп болгондуктан материал бат сиңет.", courseTitle: "Эске киришүү" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "IN";
}

function normalizeTagInput(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

type ProfileForm = {
  headline: string;
  bio: string;
  yearsOfExperience: string;
  expertiseTags: string;
  website: string;
  linkedin: string;
  instagram: string;
  telegram: string;
  github: string;
  youtube: string;
};

function InstructorProfile() {
  const { t } = useTranslation();
  const backendEnabled = isBackendApiEnabled();
  const { data, isError, isLoading } = useInstructorProfile();
  const updateInstructorProfile = useUpdateInstructorProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    headline: "",
    bio: "",
    yearsOfExperience: "",
    expertiseTags: "",
    website: "",
    linkedin: "",
    instagram: "",
    telegram: "",
    github: "",
    youtube: "",
  });

  const user = data?.user;
  const publicProfile = data?.publicProfile;
  const prototypeMode = !backendEnabled;

  useEffect(() => {
    if (!data) return;
    setForm({
      headline: data.publicProfile.headline ?? "",
      bio: data.publicProfile.bio ?? "",
      yearsOfExperience: data.publicProfile.yearsOfExperience != null ? String(data.publicProfile.yearsOfExperience) : "",
      expertiseTags: data.publicProfile.expertiseTags.join(", "),
      website: data.publicProfile.socialLinks?.website ?? "",
      linkedin: data.publicProfile.socialLinks?.linkedin ?? "",
      instagram: data.publicProfile.socialLinks?.instagram ?? "",
      telegram: data.publicProfile.socialLinks?.telegram ?? "",
      github: data.publicProfile.socialLinks?.github ?? "",
      youtube: data.publicProfile.socialLinks?.youtube ?? "",
    });
  }, [data]);

  const displayName = user?.fullName ?? t("instructorProfile.fallback.name", { defaultValue: "Проф. Арис Беков" });
  const title = publicProfile?.headline ?? user?.title ?? t("instructorProfile.fallback.title", { defaultValue: "EduBot Learning instructor" });
  const bio = publicProfile?.bio ?? user?.bio ?? t("instructorProfile.fallback.bio", { defaultValue: "Instructor profile preview. Connect the backend API to show real profile data." });
  const expertiseTags = publicProfile?.expertiseTags ?? [];
  const socialLinks = publicProfile?.socialLinks ?? {};

  const stats = prototypeMode
    ? {
        totalStudents: 625,
        activeStudents: 218,
        totalCourses: 8,
        activeCourses: 5,
        averageCourseRating: 4.9,
        reviewCount: 90,
        certificatesIssued: 42,
      }
    : data?.stats ?? {
        totalStudents: 0,
        activeStudents: 0,
        totalCourses: 0,
        activeCourses: 0,
        averageCourseRating: null,
        reviewCount: 0,
        certificatesIssued: 0,
      };

  const courses = prototypeMode
    ? fallbackCourses.map((course) => ({ ...course, title: t(course.titleKey, { defaultValue: course.title }) }))
    : (data?.courses ?? []);
  const reviews = prototypeMode ? fallbackReviews : (data?.courseReviews ?? []);

  const socialEntries = useMemo(
    () =>
      Object.entries(socialLinks)
        .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0)
        .map(([key, value]) => ({ key, value })),
    [socialLinks],
  );

  function updateFormField<Key extends keyof ProfileForm>(key: Key, value: ProfileForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    if (!backendEnabled) {
      toast.info(t("instructorProfile.toast.prototypeOnly", { defaultValue: "This screen is in prototype mode. Changes will be saved when the backend is connected." }));
      return;
    }

    try {
      await updateInstructorProfile.mutateAsync({
        headline: form.headline || null,
        bio: form.bio || null,
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : null,
        expertiseTags: normalizeTagInput(form.expertiseTags),
        socialLinks: {
          website: form.website || null,
          linkedin: form.linkedin || null,
          instagram: form.instagram || null,
          telegram: form.telegram || null,
          github: form.github || null,
          youtube: form.youtube || null,
        },
      });
      setIsEditing(false);
      toast.success(t("instructorProfile.toast.saved", { defaultValue: "Instructor profile updated." }));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("instructorProfile.toast.saveFailed", { defaultValue: "Could not update instructor profile." }));
    }
  }

  return (
    <DashboardShell>
      <TopBar
        title={t("instructorProfile.topbar.title", { defaultValue: "Public profile" })}
        subtitle={t("instructorProfile.topbar.subtitle", { defaultValue: "This is how students see you inside EduBot Learning" })}
      />

      {backendEnabled && isError ? (
        <section className="mb-5 rounded-3xl border-2 border-destructive/40 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          {t("instructorProfile.state.error", { defaultValue: "Could not load instructor profile." })}
        </section>
      ) : null}

      <section className="bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow mb-5">
        <div className="h-32 bg-gradient-to-br from-primary/40 via-secondary/40 to-accent/40" />
        <div className="p-6 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="size-24 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center text-3xl font-black border-4 border-card chunky-shadow">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={displayName} className="size-full rounded-[1.25rem] object-cover" /> : getInitials(displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black">{backendEnabled && isLoading ? t("instructorProfile.state.loading", { defaultValue: "Loading instructor..." }) : displayName}</h2>
              <p className="text-sm font-bold text-foreground/60">{title}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  [t("instructorProfile.stats.students", { defaultValue: "Students" }), String(stats.totalStudents)],
                  [t("instructorProfile.stats.activeStudents", { defaultValue: "Active" }), String(stats.activeStudents)],
                  [t("instructorProfile.stats.courses", { defaultValue: "Courses" }), String(stats.totalCourses)],
                  [t("instructorProfile.stats.activeCourses", { defaultValue: "Active courses" }), String(stats.activeCourses)],
                  [t("instructorProfile.stats.rating", { defaultValue: "Rating" }), stats.averageCourseRating ? `${stats.averageCourseRating} ★` : t("instructorProfile.stats.new", { defaultValue: "New" })],
                  [t("instructorProfile.stats.reviews", { defaultValue: "Reviews" }), String(stats.reviewCount)],
                  [t("instructorProfile.stats.certificates", { defaultValue: "Certificates" }), String(stats.certificatesIssued)],
                  [t("instructorProfile.stats.years", { defaultValue: "Years" }), publicProfile?.yearsOfExperience ? String(publicProfile.yearsOfExperience) : t("instructorProfile.stats.empty", { defaultValue: "—" })],
                ].map(([key, value]) => (
                  <span key={key} className="px-3 py-1.5 rounded-xl bg-muted font-bold text-xs"><span className="text-foreground/50">{key} · </span>{value}</span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setIsEditing((current) => !current)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow"
            >
              {isEditing ? <X className="size-4" strokeWidth={2.5} /> : <Edit3 className="size-4" strokeWidth={2.5} />}
              {isEditing
                ? t("instructorProfile.actions.cancelEdit", { defaultValue: "Close" })
                : t("instructorProfile.actions.editProfile", { defaultValue: "Edit profile" })}
            </button>
          </div>
        </div>
      </section>

      {isEditing ? (
        <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow mb-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-lg">{t("instructorProfile.edit.title", { defaultValue: "Edit profile" })}</h3>
              <p className="text-sm font-medium text-foreground/60">{t("instructorProfile.edit.subtitle", { defaultValue: "Update the information students will see." })}</p>
            </div>
            <button
              onClick={handleSave}
              disabled={updateInstructorProfile.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow disabled:opacity-60"
            >
              <Save className="size-4" strokeWidth={2.5} />
              {updateInstructorProfile.isPending
                ? t("instructorProfile.actions.saving", { defaultValue: "Saving..." })
                : t("instructorProfile.actions.save", { defaultValue: "Save" })}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label={t("instructorProfile.fields.headline", { defaultValue: "Headline" })}
              value={form.headline}
              onChange={(value) => updateFormField("headline", value)}
            />
            <Field
              label={t("instructorProfile.fields.years", { defaultValue: "Years of experience" })}
              value={form.yearsOfExperience}
              onChange={(value) => updateFormField("yearsOfExperience", value.replace(/[^\d]/g, ""))}
            />
          </div>
          <TextAreaField
            label={t("instructorProfile.fields.bio", { defaultValue: "About you" })}
            value={form.bio}
            onChange={(value) => updateFormField("bio", value)}
          />
          <Field
            label={t("instructorProfile.fields.tags", { defaultValue: "Expertise areas" })}
            value={form.expertiseTags}
            onChange={(value) => updateFormField("expertiseTags", value)}
            hint={t("instructorProfile.fields.tagsHint", { defaultValue: "Separate tags with commas." })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t("instructorProfile.fields.website", { defaultValue: "Website" })} value={form.website} onChange={(value) => updateFormField("website", value)} />
            <Field label={t("instructorProfile.fields.linkedin", { defaultValue: "LinkedIn" })} value={form.linkedin} onChange={(value) => updateFormField("linkedin", value)} />
            <Field label={t("instructorProfile.fields.instagram", { defaultValue: "Instagram" })} value={form.instagram} onChange={(value) => updateFormField("instagram", value)} />
            <Field label={t("instructorProfile.fields.telegram", { defaultValue: "Telegram" })} value={form.telegram} onChange={(value) => updateFormField("telegram", value)} />
            <Field label={t("instructorProfile.fields.github", { defaultValue: "GitHub" })} value={form.github} onChange={(value) => updateFormField("github", value)} />
            <Field label={t("instructorProfile.fields.youtube", { defaultValue: "YouTube" })} value={form.youtube} onChange={(value) => updateFormField("youtube", value)} />
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5">
          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <h3 className="font-black text-lg mb-3">{t("instructorProfile.sections.about", { defaultValue: "About instructor" })}</h3>
            <p className="text-sm font-medium leading-relaxed text-foreground/80">{bio}</p>
            {expertiseTags.length ? (
              <div className="flex flex-wrap gap-2 mt-4">
                {expertiseTags.map((tag) => (
                  <span key={tag} className="px-3 py-1.5 rounded-xl bg-muted font-bold text-xs">{tag}</span>
                ))}
              </div>
            ) : null}
          </section>

          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <h3 className="font-black text-lg flex items-center gap-2 mb-4"><BookOpen className="size-5 text-primary" strokeWidth={2.5} /> {t("instructorProfile.sections.coursesTaught", { defaultValue: "Courses taught" })}</h3>
            {courses.length ? (
              <ul className="space-y-2">
                {courses.map((course) => (
                  <li key={course.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50 border border-border">
                    <div className="min-w-0">
                      <span className="font-black text-sm block truncate">{course.title}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground/50">
                        {t(`instructorProfile.courseStatus.${course.status}`, { defaultValue: course.status })}
                      </span>
                    </div>
                    <span className="flex items-center gap-3 text-xs font-bold text-foreground/60">
                      <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{course.studentsCount}</span>
                      <span className="inline-flex items-center gap-1 text-amber-600"><Star className="size-3.5 fill-current" />{course.ratingAverage ?? t("instructorProfile.stats.new", { defaultValue: "New" })}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-bold text-foreground/60">{t("instructorProfile.empty.courses", { defaultValue: "No courses yet." })}</p>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black text-lg flex items-center gap-2 mb-3"><Globe className="size-5 text-secondary" strokeWidth={2.5} /> {t("instructorProfile.sections.links", { defaultValue: "Links" })}</h3>
            {socialEntries.length ? (
              <ul className="space-y-2 text-sm">
                {socialEntries.map((entry) => (
                  <li key={entry.key} className="font-medium break-all">
                    <span className="font-black uppercase tracking-wide text-[10px] text-foreground/50 mr-2">{entry.key}</span>
                    <a href={entry.value} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                      {entry.value}
                    </a>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm font-bold text-foreground/60">{t("instructorProfile.empty.links", { defaultValue: "No links added yet." })}</p>}
          </section>

          <section className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black text-lg mb-3">{t("instructorProfile.sections.recentReviews", { defaultValue: "Recent reviews" })}</h3>
            {reviews.length ? (
              <ul className="space-y-3">
                {reviews.map((review) => (
                  <li key={review.id} className="text-xs">
                    <p className="font-medium text-foreground/80">{review.comment}</p>
                    <p className="font-black uppercase tracking-wider text-foreground/50 mt-1 text-[10px]">
                      — {review.studentName}{review.courseTitle ? ` · ${review.courseTitle}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm font-bold text-foreground/60">{t("instructorProfile.empty.reviews", { defaultValue: "No course reviews yet." })}</p>}
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}

function Field(props: { label: string; value: string; onChange: (value: string) => void; hint?: string }) {
  return (
    <label className="space-y-2 block">
      <span className="text-xs font-black uppercase tracking-wide text-foreground/60">{props.label}</span>
      <input
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
      />
      {props.hint ? <p className="text-xs font-medium text-foreground/50">{props.hint}</p> : null}
    </label>
  );
}

function TextAreaField(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2 block">
      <span className="text-xs font-black uppercase tracking-wide text-foreground/60">{props.label}</span>
      <textarea
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        rows={5}
        className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary resize-y"
      />
    </label>
  );
}
