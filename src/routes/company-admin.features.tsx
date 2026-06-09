import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2, Save, ToggleLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ApiError, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import {
  useCompanySettings,
  useUpdateEnrollmentSettings,
  useUpdateFeatureFlags,
  type CompanyEnrollmentSettings,
} from "@/lib/company-admin/company-settings-api";

export const Route = createFileRoute("/company-admin/features")({
  head: () => ({ meta: [{ title: "QuestLMS — Features & Settings" }] }),
  component: FeaturesPage,
});

type FlagKey =
  | "attendance.enabled"
  | "homework.enabled"
  | "certificates.enabled"
  | "courses.onlineLive.enabled"
  | "courses.offline.enabled"
  | "aiAssistant.enabled";

const FLAG_DEFS: { key: FlagKey; readKey: string; label: string; desc: string }[] = [
  {
    key: "attendance.enabled",
    readKey: "attendance",
    label: "Attendance tracking",
    desc: "Record and report session attendance for all group sessions.",
  },
  {
    key: "homework.enabled",
    readKey: "homework",
    label: "Homework & assignments",
    desc: "Instructors can assign and grade homework per session.",
  },
  {
    key: "certificates.enabled",
    readKey: "certificates",
    label: "Certificates",
    desc: "Students can earn certificates upon completing a course.",
  },
  {
    key: "courses.onlineLive.enabled",
    readKey: "liveSessions",
    label: "Live sessions",
    desc: "Enable scheduled online live sessions for course groups.",
  },
  {
    key: "courses.offline.enabled",
    readKey: "courses.offline.enabled",
    label: "Offline / in-person courses",
    desc: "Allow courses to be created as offline or hybrid delivery.",
  },
  {
    key: "aiAssistant.enabled",
    readKey: "aiAssistant.enabled",
    label: "AI assistant",
    desc: "Activate the AI tutor and AI-powered content tools for this workspace.",
  },
];

function FeaturesPage() {
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const { data, isLoading, isError } = useCompanySettings();
  const updateFlags = useUpdateFeatureFlags();
  const updateEnrollment = useUpdateEnrollmentSettings();

  const [flags, setFlags] = useState<Record<FlagKey, boolean>>(() =>
    Object.fromEntries(FLAG_DEFS.map((d) => [d.key, true])) as Record<FlagKey, boolean>,
  );

  const [enrollment, setEnrollment] = useState<CompanyEnrollmentSettings>({
    supportEmail: "",
    defaultCourseVisibility: "TENANT_ONLY",
    allowSelfEnrollment: true,
    requireEnrollmentApproval: false,
  });

  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!data || seeded) return;
    setSeeded(true);
    const ff = data.featureFlags ?? {};
    setFlags(
      Object.fromEntries(
        FLAG_DEFS.map((d) => [d.key, (ff as Record<string, boolean | undefined>)[d.readKey] !== false]),
      ) as Record<FlagKey, boolean>,
    );
    const s = data.settings ?? {};
    setEnrollment({
      supportEmail: s.supportEmail ?? "",
      defaultCourseVisibility: s.defaultCourseVisibility ?? "TENANT_ONLY",
      allowSelfEnrollment: s.allowSelfEnrollment ?? true,
      requireEnrollmentApproval: s.requireEnrollmentApproval ?? false,
    });
  }, [data, seeded]);

  async function saveFlags() {
    if (!backendEnabled) { toast.info("Requires backend mode."); return; }
    try {
      await updateFlags.mutateAsync(flags as Record<string, boolean>);
      toast.success("Feature flags saved.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save.");
    }
  }

  async function saveEnrollment() {
    if (!backendEnabled) { toast.info("Requires backend mode."); return; }
    try {
      await updateEnrollment.mutateAsync({
        ...enrollment,
        supportEmail: enrollment.supportEmail || null,
      });
      toast.success("Enrollment settings saved.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save.");
    }
  }

  return (
    <DashboardShell>
      <TopBar title="Features & Settings" subtitle="Enable or disable workspace-level features and control enrollment behaviour." showStreak={false} />

      <Link to="/company-admin" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> Admin
      </Link>

      {!backendEnabled && (
        <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm font-medium text-amber-800 dark:text-amber-200">
          Preview only — connect to a backend workspace to save changes.
        </div>
      )}

      {backendEnabled && isLoading && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 text-sm text-foreground/60">
          Loading settings…
        </div>
      )}
      {backendEnabled && isError && (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load settings.
        </div>
      )}

      <div className="space-y-6">
        {/* Feature flags */}
        <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b-2 border-border">
            <ToggleLeft className="size-4 text-primary" />
            <h2 className="font-black text-base flex-1">Features</h2>
          </div>

          <div className="space-y-3">
            {FLAG_DEFS.map((def) => (
              <ToggleRow
                key={def.key}
                label={def.label}
                description={def.desc}
                enabled={flags[def.key]}
                disabled={isLoading}
                onChange={(v) => setFlags((f) => ({ ...f, [def.key]: v }))}
              />
            ))}
          </div>

          <div className="flex justify-end mt-5 pt-4 border-t-2 border-border">
            <SaveButton onClick={saveFlags} pending={updateFlags.isPending} />
          </div>
        </section>

        {/* Enrollment settings */}
        <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b-2 border-border">
            <h2 className="font-black text-base flex-1">Enrollment</h2>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="block text-xs font-black uppercase tracking-wider text-foreground/60 mb-1.5">
                Support email
              </span>
              <input
                type="email"
                value={enrollment.supportEmail ?? ""}
                onChange={(e) => setEnrollment((s) => ({ ...s, supportEmail: e.target.value }))}
                placeholder="support@yourschool.com"
                className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary"
              />
              <p className="mt-1 text-xs text-foreground/50">Shown to students when they need help.</p>
            </label>

            <label className="block">
              <span className="block text-xs font-black uppercase tracking-wider text-foreground/60 mb-1.5">
                Default course visibility
              </span>
              <select
                value={enrollment.defaultCourseVisibility ?? "TENANT_ONLY"}
                onChange={(e) => setEnrollment((s) => ({
                  ...s,
                  defaultCourseVisibility: e.target.value as "PUBLIC" | "PRIVATE" | "TENANT_ONLY",
                }))}
                className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-bold outline-none focus:border-primary"
              >
                <option value="TENANT_ONLY">Workspace members only</option>
                <option value="PRIVATE">Private (invite only)</option>
                <option value="PUBLIC">Public (anyone)</option>
              </select>
            </label>

            <ToggleRow
              label="Allow self-enrollment"
              description="Students can join courses without an admin invitation."
              enabled={enrollment.allowSelfEnrollment ?? true}
              onChange={(v) => setEnrollment((s) => ({ ...s, allowSelfEnrollment: v }))}
            />

            <ToggleRow
              label="Require enrollment approval"
              description="Self-enrollment requests must be approved by an admin or instructor."
              enabled={enrollment.requireEnrollmentApproval ?? false}
              onChange={(v) => setEnrollment((s) => ({ ...s, requireEnrollmentApproval: v }))}
            />
          </div>

          <div className="flex justify-end mt-5 pt-4 border-t-2 border-border">
            <SaveButton onClick={saveEnrollment} pending={updateEnrollment.isPending} />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="font-black text-sm">{label}</p>
        <p className="text-xs text-foreground/55 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        className={`relative shrink-0 w-14 h-8 rounded-full border-2 transition-colors cursor-pointer disabled:cursor-not-allowed ${enabled ? "bg-primary border-primary" : "bg-background border-border"}`}
      >
        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow flex items-center justify-center transition-all ${enabled ? "left-6" : "left-0.5"}`}>
          {enabled && <Check className="size-3 text-primary" strokeWidth={3} />}
        </span>
      </button>
    </div>
  );
}

function SaveButton({ onClick, pending }: { onClick: () => void; pending: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      {pending ? "Saving…" : "Save"}
    </button>
  );
}
