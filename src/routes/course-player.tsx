import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  FileText,
  Layers3,
  ListChecks,
  MapPin,
  Play,
  PlayCircle,
} from "lucide-react";
import { z } from "zod";
import { useRef, useEffect } from "react";
import i18n from "@/lib/i18n";

import { useAppContext } from "@/lib/app-context";
import {
  useStudentPortalCourseDetail,
  useStudentPortalLessonDetail,
  type StudentPortalLessonDetail,
  type StudentPortalSectionItem,
} from "@/lib/student-portal-api";

export const Route = createFileRoute("/course-player")({
  validateSearch: z.object({
    courseId: z.coerce.number().optional(),
    groupId: z.coerce.number().optional(),
    lessonId: z.coerce.number().optional(),
  }),
  head: () => ({
    meta: [{ title: i18n.t("studentPages.coursePlayer.metaTitle", { appName: i18n.t("app.name") }) }],
  }),
  component: CoursePlayerPage,
});

function CoursePlayerPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/course-player" });

  const courseId = search.courseId ?? null;
  const groupId = search.groupId ?? null;
  const lessonId = search.lessonId ?? null;

  const isStudentBackend =
    context.mode === "backend" && context.activeRole === "student";

  const detailQuery = useStudentPortalCourseDetail(
    isStudentBackend ? courseId : null,
    isStudentBackend ? groupId : null,
  );

  const isVideoMode =
    detailQuery.data?.course.courseType === "video" ||
    (detailQuery.data?.sections && detailQuery.data.sections.length > 0);

  const activeLessonId =
    lessonId ??
    (isVideoMode ? (detailQuery.data?.nextLesson?.lessonId ?? null) : null);

  const lessonQuery = useStudentPortalLessonDetail(
    isStudentBackend && isVideoMode ? courseId : null,
    isStudentBackend && isVideoMode ? activeLessonId : null,
  );

  if (!isStudentBackend) {
    if (context.mode === "backend") return <Navigate to="/" />;
    return <PrototypeCoursePlayer />;
  }

  const openLesson = (id: number) => {
    navigate({ search: (prev) => ({ ...prev, lessonId: id }) });
  };

  return (
    <DashboardShell>
      <TopBar
        title={detailQuery.data?.course.title ?? t("studentPages.coursePlayer.courseWorkspace")}
        subtitle={
          detailQuery.data?.course.groupName ??
          t("studentPages.coursePlayer.fallbackSubtitle")
        }
        showStreak={false}
      />

      {!courseId ? (
        <EmptyState message={t("studentPages.coursePlayer.noCourseSelected")} />
      ) : detailQuery.isLoading ? (
        <LoadingGrid />
      ) : detailQuery.isError || !detailQuery.data ? (
        <EmptyState message={t("studentPages.coursePlayer.loadError")} />
      ) : isVideoMode ? (
        <VideoCourseLayout
          courseId={courseId}
          detail={detailQuery.data}
          activeLessonId={activeLessonId}
          lessonDetail={lessonQuery.data ?? null}
          lessonLoading={lessonQuery.isLoading}
          onSelectLesson={openLesson}
        />
      ) : (
        <SessionCourseLayout detail={detailQuery.data} />
      )}
    </DashboardShell>
  );
}

function VideoCourseLayout({
  courseId,
  detail,
  activeLessonId,
  lessonDetail,
  lessonLoading,
  onSelectLesson,
}: {
  courseId: number | null;
  detail: NonNullable<ReturnType<typeof useStudentPortalCourseDetail>["data"]>;
  activeLessonId: number | null;
  lessonDetail: StudentPortalLessonDetail | null;
  lessonLoading: boolean;
  onSelectLesson: (id: number) => void;
}) {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const aiEnabled = Boolean(context.featureFlags.ai);
  const navigate = useNavigate({ from: "/course-player" });

  const goLesson = (id: number | null) => {
    if (id == null) return;
    onSelectLesson(id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
      <div className="space-y-4">
        <LessonPlayer
          lesson={lessonDetail}
          loading={lessonLoading}
          noSelection={activeLessonId === null}
        />

        {lessonDetail && (
          <div className="flex items-center justify-between gap-3">
            <button
              disabled={!lessonDetail.prevLessonId}
              onClick={() => goLesson(lessonDetail.prevLessonId)}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border bg-card px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              <ChevronLeft className="size-4" /> {t("studentPages.coursePlayer.previous")}
            </button>
            {courseId && aiEnabled && (
              <Link
                to="/ai-tutor"
                search={{ courseId, lessonId: lessonDetail.lessonId }}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-primary bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
              >
                <Bot className="size-4" /> {t("studentPages.coursePlayer.askTutor")}
              </Link>
            )}
            <button
              disabled={!lessonDetail.nextLessonId}
              onClick={() => goLesson(lessonDetail.nextLessonId)}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border bg-card px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              {t("studentPages.coursePlayer.next")} <ChevronRight className="size-4" />
            </button>
          </div>
        )}

        <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
              {detail.course.courseType.replace(/_/g, " ")}
            </span>
            <span className="rounded-lg bg-secondary/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/70">
              {detail.course.status}
            </span>
          </div>
          <h2 className="text-xl font-black">{detail.course.title}</h2>
          {detail.course.description && (
            <p className="text-sm font-medium text-foreground/60">
              {detail.course.description}
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label={t("studentPages.coursePlayer.kpi.progress")} value={`${detail.progress?.progressPercent ?? 0}%`} />
            <KpiCard
              label={t("studentPages.coursePlayer.kpi.lessons")}
              value={String(detail.sections.reduce((n, s) => n + s.lessons.length, 0))}
            />
            <KpiCard
              label={t("studentPages.coursePlayer.kpi.openTasks")}
              value={String(
                detail.tasks.filter(
                  (task) => task.status === "open" || task.status === "overdue",
                ).length,
              )}
            />
          </div>
        </div>
      </div>

      <CourseSidebar
        sections={detail.sections}
        activeLessonId={activeLessonId}
        onSelect={onSelectLesson}
        certificate={detail.certificate}
        progressPercent={detail.progress?.progressPercent ?? 0}
      />
    </div>
  );
}

function LessonPlayer({
  lesson,
  loading,
  noSelection,
}: {
  lesson: StudentPortalLessonDetail | null;
  loading: boolean;
  noSelection: boolean;
}) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !lesson?.lastVideoTime) return;
    const lastTime = lesson.lastVideoTime;
    const seek = () => { video.currentTime = lastTime; };
    // The <video> element is remounted on each lessonId change (key prop), so
    // readyState is 0 until the browser parses the src. Seek after metadata loads.
    if (video.readyState >= 1) {
      seek();
    } else {
      video.addEventListener("loadedmetadata", seek, { once: true });
      return () => video.removeEventListener("loadedmetadata", seek);
    }
  }, [lesson?.lessonId]);

  if (noSelection) {
    return (
      <div className="aspect-video flex items-center justify-center rounded-3xl border-2 border-dashed border-border bg-card">
        <div className="text-center space-y-2">
          <PlayCircle className="mx-auto size-10 text-foreground/30" />
          <p className="text-sm font-medium text-foreground/50">
            {t("studentPages.coursePlayer.selectLesson")}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="aspect-video rounded-3xl border-2 border-border bg-card animate-pulse" />
    );
  }

  if (!lesson) {
    return (
      <EmptyState message={t("studentPages.coursePlayer.lessonLoadError")} />
    );
  }

  if (lesson.kind === "article") {
    return (
      <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h3 className="font-black text-base">{lesson.title}</h3>
        </div>
        <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap text-sm font-medium leading-relaxed">
          {lesson.content ?? t("studentPages.coursePlayer.noContent")}
        </div>
      </div>
    );
  }

  if (lesson.kind === "video" && lesson.videoUrl) {
    return (
      <div className="rounded-3xl overflow-hidden border-2 border-border bg-black chunky-shadow">
        <video
          ref={videoRef}
          key={lesson.lessonId}
          src={lesson.videoUrl}
          controls
          className="w-full aspect-video"
          playsInline
        >
          <source
            src={lesson.videoUrl}
            type={
              lesson.playbackType === "hls"
                ? "application/x-mpegURL"
                : "video/mp4"
            }
          />
        </video>
      </div>
    );
  }

  return (
    <div className="aspect-video flex flex-col items-center justify-center rounded-3xl border-2 border-border bg-card gap-3">
      <BookOpen className="size-8 text-foreground/30" />
      <div className="text-center">
        <p className="font-black text-sm">{lesson.title}</p>
        <p className="text-xs text-foreground/50 mt-0.5 capitalize">
          {t("studentPages.coursePlayer.kindLesson", { kind: lesson.kind })}
        </p>
      </div>
    </div>
  );
}

function CourseSidebar({
  sections,
  activeLessonId,
  onSelect,
  certificate,
  progressPercent,
}: {
  sections: StudentPortalSectionItem[];
  activeLessonId: number | null;
  onSelect: (id: number) => void;
  certificate: { id?: number; issuedAt?: string | null } | null;
  progressPercent: number;
}) {
  const { t } = useTranslation();

  return (
    <aside className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow h-fit space-y-3">
      <div className="px-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-foreground/60">
          {t("studentPages.coursePlayer.sidebar.courseOutline")}
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-1 text-xs font-bold text-foreground/50">
          {t("studentPages.coursePlayer.sidebar.progressComplete", { percent: progressPercent })}
        </p>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {sections.map((section) => (
          <div key={section.sectionId}>
            <p className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/45">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.lessons.map((lesson) => {
                const isActive = lesson.lessonId === activeLessonId;
                return (
                  <li key={lesson.lessonId}>
                    <button
                      onClick={() => onSelect(lesson.lessonId)}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-colors ${
                        isActive
                          ? "border-primary/30 bg-primary/8"
                          : "border-transparent hover:bg-muted"
                      }`}
                    >
                      {lesson.completed ? (
                        <CheckCircle2
                          className="size-4 shrink-0 text-primary"
                          strokeWidth={2.5}
                        />
                      ) : isActive ? (
                        <Play className="size-4 shrink-0 text-primary" strokeWidth={2.5} />
                      ) : (
                        <Circle className="size-4 shrink-0 text-foreground/30" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm truncate font-bold ${isActive ? "text-primary" : ""}`}
                        >
                          {lesson.title}
                        </p>
                        {lesson.duration ? (
                          <p className="text-[10px] font-medium text-foreground/45 flex items-center gap-1">
                            <Clock className="size-2.5" />
                            {Math.round(lesson.duration / 60)}m
                          </p>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-2 p-3 bg-secondary/20 rounded-xl">
        <p className="text-xs font-bold">{t("studentPages.coursePlayer.sidebar.certificate")}</p>
        <p className="mt-1 text-sm font-medium text-foreground/70">
          {certificate?.issuedAt
            ? t("studentPages.coursePlayer.sidebar.issued")
            : t("studentPages.coursePlayer.sidebar.notIssuedYet")}
        </p>
      </div>
    </aside>
  );
}

function SessionCourseLayout({
  detail,
}: {
  detail: NonNullable<ReturnType<typeof useStudentPortalCourseDetail>["data"]>;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      <div className="space-y-4">
        <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
              {detail.course.courseType.replace(/_/g, " ")}
            </span>
            <span className="rounded-lg bg-secondary/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/70">
              {detail.course.status}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black">{detail.course.title}</h2>
            <p className="mt-1 text-sm font-medium text-foreground/60">
              {detail.course.description ?? t("studentPages.coursePlayer.descriptionEmpty")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard label={t("studentPages.coursePlayer.kpi.progress")} value={`${detail.progress?.progressPercent ?? 0}%`} />
            <KpiCard label={t("studentPages.coursePlayer.kpi.sessions")} value={String(detail.sessions.length)} />
            <KpiCard
              label={t("studentPages.coursePlayer.kpi.openTasks")}
              value={String(
                detail.tasks.filter(
                  (task) => task.status === "open" || task.status === "overdue",
                ).length,
              )}
            />
          </div>
        </div>

        <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-black">
            <Layers3 className="size-4.5 text-primary" /> {t("studentPages.coursePlayer.sessionPlan")}
          </h3>
          {detail.sessions.length === 0 ? (
            <EmptyState message={t("studentPages.coursePlayer.noSessions")} compact />
          ) : (
            <ul className="space-y-2">
              {detail.sessions.map((session) => (
                <li
                  key={session.id}
                  className="rounded-2xl border-2 border-border bg-muted/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{session.sessionTitle}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs font-medium text-foreground/55">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />{" "}
                          {session.startsAt ?? session.startAt ?? t("studentPages.common.tbd")}
                        </span>
                        {session.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" /> {session.location}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className="rounded-lg bg-background px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">
                      {session.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-black">
            <ListChecks className="size-4.5 text-primary" /> {t("studentPages.coursePlayer.tasks")}
          </h3>
          {detail.tasks.length === 0 ? (
            <EmptyState message={t("studentPages.coursePlayer.noTasks")} compact />
          ) : (
            <ul className="space-y-2">
              {detail.tasks.map((task) => (
                <li
                  key={`${task.kind}-${task.id}`}
                  className="flex items-center gap-3 rounded-2xl border-2 border-border bg-muted/20 p-4"
                >
                  {task.status === "approved" ||
                  task.status === "completed" ||
                  task.status === "submitted" ? (
                    <CheckCircle2
                      className="size-5 shrink-0 text-primary"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <Circle className="size-5 shrink-0 text-foreground/30" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{task.title}</p>
                    <p className="truncate text-xs font-medium text-foreground/55">
                      {task.kind} · {task.sessionTitle ?? t("studentPages.coursePlayer.sessionTaskFallback")}
                    </p>
                  </div>
                  <span className="rounded-lg bg-background px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">
                    {task.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow h-fit">
        <h3 className="font-black text-sm uppercase tracking-wider text-foreground/60 mb-3 px-2">
          {t("studentPages.coursePlayer.sidebar.courseOutline")}
        </h3>
        <ul className="space-y-1">
          {detail.sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center gap-3 p-3 rounded-xl border-2 border-transparent hover:bg-muted"
            >
              {session.status === "completed" ? (
                <CheckCircle2
                  className="size-5 text-primary shrink-0"
                  strokeWidth={2.5}
                />
              ) : (
                <Circle className="size-5 text-foreground/30 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{session.sessionTitle}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
                  {t("studentPages.coursePlayer.sidebar.session", { index: session.sessionIndex })}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 p-3 bg-secondary/20 rounded-xl">
          <p className="text-xs font-bold">{t("studentPages.coursePlayer.sidebar.certificate")}</p>
          <p className="mt-1 text-sm font-medium text-foreground/70">
            {detail.certificate?.issuedAt
              ? t("studentPages.coursePlayer.sidebar.issued")
              : t("studentPages.coursePlayer.sidebar.notIssuedYet")}
          </p>
        </div>
      </aside>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-primary">{value}</p>
    </div>
  );
}

function EmptyState({
  message,
  compact,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border-2 border-dashed border-border bg-card text-sm font-medium text-foreground/60 ${compact ? "p-4" : "p-6"}`}
    >
      {message}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      <div className="h-80 rounded-3xl border-2 border-border bg-card animate-pulse" />
      <div className="h-80 rounded-3xl border-2 border-border bg-card animate-pulse" />
    </div>
  );
}

function PrototypeCoursePlayer() {
  const { t } = useTranslation();

  return (
    <DashboardShell>
      <TopBar
        title={t("studentPages.coursePlayer.prototype.title")}
        subtitle={t("studentPages.coursePlayer.prototype.subtitle")}
        showStreak={false}
      />
      <div className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
        {t("studentPages.coursePlayer.prototype.notice")}
      </div>
    </DashboardShell>
  );
}
