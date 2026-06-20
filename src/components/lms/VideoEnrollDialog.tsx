import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { useEnrollStudent } from "@/lib/lms-core-api";
import { useInstructorStudents } from "@/lib/instructor/instructor-grading-api";
import { Shell, Header, Actions } from "./CurriculumImportDialog";

interface Props {
  courseId: number;
  courseTitle?: string;
  onClose: () => void;
  onEnrolled?: () => void;
}

export function VideoEnrollDialog({ courseId, courseTitle, onClose, onEnrolled }: Props) {
  const { t } = useTranslation();
  const enrollMutation = useEnrollStudent();
  const [studentSearch, setStudentSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(studentSearch), 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  const studentsQuery = useInstructorStudents({ q: debouncedSearch || undefined, limit: 20 });

  const uniqueStudents = useMemo(() => {
    const seen = new Set<number>();
    return (studentsQuery.data?.items ?? []).filter((s) => {
      if (seen.has(s.userId)) return false;
      seen.add(s.userId);
      return true;
    });
  }, [studentsQuery.data?.items]);

  const handleEnroll = async (userId: number) => {
    try {
      await enrollMutation.mutateAsync({ courseId, userId });
      toast.success(t("courseDetailPage.videoEnrollDialog.toast.enrolled"));
      onEnrolled?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("courseDetailPage.videoEnrollDialog.toast.enrollFailed"));
    }
  };

  return (
    <Shell onClose={onClose}>
      <Header
        title={t("courseDetailPage.videoEnrollDialog.title")}
        subtitle={courseTitle}
        onClose={onClose}
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" />
        <input
          autoFocus
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          placeholder={t("courseDetailPage.videoEnrollDialog.searchPlaceholder")}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-border bg-background text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>

      {uniqueStudents.length > 0 ? (
        <div className="max-h-60 overflow-y-auto rounded-xl border-2 border-border bg-background divide-y divide-border mb-4">
          {uniqueStudents.map((student) => (
            <button
              key={student.userId}
              type="button"
              disabled={enrollMutation.isPending}
              onClick={() => handleEnroll(student.userId)}
              className="cursor-pointer w-full text-left px-3 py-2.5 hover:bg-muted text-sm disabled:opacity-50"
            >
              <p className="font-bold">{student.fullName ?? t("courseDetailPage.videoEnrollDialog.noName")}</p>
              <p className="text-xs text-foreground/60">{student.email}</p>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-foreground/50 text-center py-4 mb-4">
          {studentSearch ? t("courseDetailPage.videoEnrollDialog.emptySearch") : t("courseDetailPage.videoEnrollDialog.emptyIdle")}
        </p>
      )}

      <Actions onCancel={onClose} cancelLabel={t("courseDetailPage.actions.cancel")} submitLabel={t("courseDetailPage.videoEnrollDialog.actions.done")} onSubmit={onClose} />
    </Shell>
  );
}
