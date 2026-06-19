import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { RefreshCw, X } from "lucide-react";
import { useCreateTenantCourseGroup } from "@/lib/lms-core-api";

interface Props {
  courseId: number;
  courseTitle?: string;
  onClose: () => void;
  onCreated?: () => void;
}

function compactToken(value: string, fallback: string) {
  const token = value
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 3))
    .join("");
  return token || fallback;
}

function generateCodeSuffix() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function CreateGroupDialog({ courseId, courseTitle, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const createMutation = useCreateTenantCourseGroup();
  const [name, setName] = useState("");
  const [seatLimit, setSeatLimit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [codeSuffix, setCodeSuffix] = useState(() => generateCodeSuffix());

  const code = useMemo(() => {
    const courseToken = compactToken(courseTitle ?? "", "CRS");
    const nameToken = compactToken(name, "GRP");
    return `${courseToken}-${nameToken}-${codeSuffix}`;
  }, [codeSuffix, courseTitle, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error(t("courseDetailPage.createGroupDialog.toast.nameRequired")); return; }
    if (startDate && endDate && endDate < startDate) { toast.error(t("courseDetailPage.createGroupDialog.toast.endBeforeStart")); return; }
    try {
      await createMutation.mutateAsync({
        courseId,
        name: name.trim(),
        code,
        seatLimit: seatLimit ? Number(seatLimit) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      toast.success(t("courseDetailPage.createGroupDialog.toast.created", { name: name.trim() }));
      onCreated?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("courseDetailPage.createGroupDialog.toast.createFailed"));
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
            <h2 className="text-xl font-black">{t("courseDetailPage.createGroupDialog.title")}</h2>
            {courseTitle && <p className="text-xs text-foreground/60 mt-0.5">{courseTitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{t("courseDetailPage.createGroupDialog.fields.name")}</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("courseDetailPage.createGroupDialog.placeholders.name")}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{t("courseDetailPage.createGroupDialog.fields.code")}</span>
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
              aria-label={t("courseDetailPage.createGroupDialog.actions.regenerateCode")}
              title={t("courseDetailPage.createGroupDialog.actions.regenerateCode")}
            >
              <RefreshCw className="size-4" />
            </button>
          </div>
          <p className="text-[11px] text-foreground/50">{t("courseDetailPage.createGroupDialog.hint")}</p>
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{t("courseDetailPage.createGroupDialog.fields.seatLimit")}</span>
            <input
              type="number"
              min={0}
              value={seatLimit}
              onChange={(e) => setSeatLimit(e.target.value)}
              placeholder={t("courseDetailPage.createGroupDialog.placeholders.seatLimit")}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{t("courseDetailPage.createGroupDialog.fields.startDate")}</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{t("courseDetailPage.createGroupDialog.fields.endDate")}</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
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
            {t("courseDetailPage.actions.cancel")}
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? t("courseDetailPage.createGroupDialog.actions.creating") : t("courseDetailPage.createGroupDialog.actions.create")}
          </button>
        </div>
      </form>
    </div>
  );
}
