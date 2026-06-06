import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ArrowLeft, Check, Layers } from "lucide-react";
import { useLms, setHierarchy } from "@/lib/lmsStore";

export const Route = createFileRoute("/company-admin/hierarchy")({
  head: () => ({ meta: [{ title: "QuestLMS — Content Hierarchy" }] }),
  component: HierarchyPage,
});

function HierarchyPage() {
  const { hierarchy } = useLms();

  const toggle = (key: "coursesEnabled" | "modulesEnabled", value: boolean) => {
    setHierarchy({ [key]: value });
    toast.success(value ? "Enabled" : "Disabled");
  };

  const preview: string[] = ["Class"];
  if (hierarchy.coursesEnabled) preview.push("Course");
  if (hierarchy.coursesEnabled && hierarchy.modulesEnabled) preview.push("Module");
  preview.push("Lesson");

  return (
    <DashboardShell>
      <TopBar title="Content Hierarchy" subtitle="Configure how content is structured across your tenant." showStreak={false} />

      <Link to="/company-admin" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> Company Admin
      </Link>

      <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="size-4 text-primary" />
          <h3 className="font-black text-base">Active structure</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {preview.map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl border-2 border-primary bg-primary/10 text-primary font-bold text-xs uppercase tracking-wide">{p}</span>
              {i < preview.length - 1 && <span className="text-foreground/40 font-black">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Toggle
          title="Use Courses"
          description="Group lessons into reusable course templates that can be assigned to one or more classes."
          enabled={hierarchy.coursesEnabled}
          onChange={(v) => toggle("coursesEnabled", v)}
        />
        <Toggle
          title="Use Modules"
          description="Group lessons inside a course into modules or units. Requires Courses to be enabled."
          enabled={hierarchy.modulesEnabled}
          disabled={!hierarchy.coursesEnabled}
          onChange={(v) => toggle("modulesEnabled", v)}
        />
      </div>

      <p className="mt-6 text-xs text-foreground/60">
        Tip: When Courses is off, lessons attach directly to a class. When Modules is off, lessons live as a flat list inside a course.
      </p>
    </DashboardShell>
  );
}

function Toggle({
  title, description, enabled, onChange, disabled,
}: { title: string; description: string; enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 bg-card border-2 border-border rounded-2xl p-5 chunky-shadow ${disabled ? "opacity-60" : ""}`}>
      <div className="min-w-0">
        <p className="font-black text-base">{title}</p>
        <p className="text-xs text-foreground/60 mt-1">{description}</p>
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
