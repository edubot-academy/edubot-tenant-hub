import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  Search, ChevronRight, TrendingUp, TrendingDown, Minus,
  LayoutGrid, List, AlertTriangle, CheckCircle2, Users,
  BookOpen, Loader2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { useInstructorStudents, type InstructorStudentItem } from "@/lib/instructor/instructor-grading-api";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/instructor/students/")({
  head: () => ({ meta: [{ title: "QuestLMS — Students" }] }),
  component: StudentsPage,
});

// ── helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-teal-500 to-emerald-600",
  "from-orange-400 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-indigo-600",
];

type ViewMode = "grid" | "list";

function avatarGradient(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function inits(name: string | null, email: string | null) {
  const src = name ?? email ?? "?";
  return src.split(/[\s@.]+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

type SeedStudent = {
  id: string; name: string; email: string; cls: string;
  progress: number; grade: string; attendance: number; lastActive: string;
  trend: "up" | "down" | "flat";
};

const seed: SeedStudent[] = [
  { id: "1", name: "Mia Chen", email: "mia.c@school.edu", cls: "Cognitive Psych", progress: 78, grade: "A", attendance: 96, lastActive: "2h ago", trend: "up" },
  { id: "2", name: "A. Murat", email: "a.murat@school.edu", cls: "Cognitive Psych", progress: 64, grade: "B+", attendance: 88, lastActive: "1d ago", trend: "flat" },
  { id: "3", name: "B. Tilek", email: "b.tilek@school.edu", cls: "Calculus", progress: 41, grade: "C", attendance: 72, lastActive: "3d ago", trend: "down" },
  { id: "4", name: "D. Kanysh", email: "d.kanysh@school.edu", cls: "Org. Chem II", progress: 86, grade: "A-", attendance: 94, lastActive: "5h ago", trend: "up" },
  { id: "5", name: "E. Aibek", email: "e.aibek@school.edu", cls: "Calculus", progress: 58, grade: "B", attendance: 81, lastActive: "Yesterday", trend: "flat" },
  { id: "6", name: "F. Saltanat", email: "f.salt@school.edu", cls: "Cognitive Psych", progress: 92, grade: "A", attendance: 99, lastActive: "1h ago", trend: "up" },
  { id: "7", name: "G. Nurzat", email: "g.nurzat@school.edu", cls: "Org. Chem II", progress: 33, grade: "D+", attendance: 64, lastActive: "1w ago", trend: "down" },
];

// ── page shell ────────────────────────────────────────────────────────────────

function StudentsPage() {
  const { context } = useAppContext();
  const isBackend = isBackendApiEnabled() && context.mode === "backend";
  if (isBackend) return <BackendStudentsPage />;
  return <PrototypeStudentsPage />;
}

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, accent, delay,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: "primary" | "secondary" | "emerald" | "rose";
  delay: number;
}) {
  const iconColor = {
    primary: "text-primary",
    secondary: "text-secondary",
    emerald: "text-emerald-600",
    rose: "text-rose-500",
  }[accent];

  return (
    <div
      className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow animate-bounce-in flex items-center gap-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon className={`size-5 shrink-0 ${iconColor}`} strokeWidth={2.5} />
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40">{label}</p>
        <p className="text-2xl font-black font-mono">{value}</p>
      </div>
    </div>
  );
}

// ── search + filter bar ───────────────────────────────────────────────────────

function FilterBar({
  q, onQ, groups, groupFilter, onGroup, view, onView,
}: {
  q: string; onQ: (v: string) => void;
  groups: string[]; groupFilter: string; onGroup: (g: string) => void;
  view: ViewMode; onView: (v: ViewMode) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <div className="flex-1 flex items-center gap-2 bg-card border-2 border-border rounded-2xl px-4 chunky-shadow">
        <Search className="size-4 text-foreground/40 shrink-0" />
        <input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Search students…"
          className="bg-transparent outline-none flex-1 py-3 text-sm font-medium placeholder:text-foreground/40"
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => onGroup(g)}
            className={`px-3 py-2 rounded-xl text-xs font-black border-2 transition-all whitespace-nowrap ${groupFilter === g
              ? "bg-primary text-primary-foreground border-foreground chunky-shadow"
              : "bg-card border-border hover:-translate-y-0.5"
              }`}
          >
            {g}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => onView("grid")}
            className={`p-2 rounded-xl border-2 transition-colors ${view === "grid" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground/40"}`}
          >
            <LayoutGrid className="size-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => onView("list")}
            className={`p-2 rounded-xl border-2 transition-colors ${view === "list" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground/40"}`}
          >
            <List className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── student card ──────────────────────────────────────────────────────────────

function StudentCard({
  id, name, email, groupLabel, progress, completed, delay,
}: {
  id: string; name: string | null; email: string | null;
  groupLabel: string | null; progress: number; completed: boolean; delay: number;
}) {
  const atRisk = progress < 40 && !completed;
  const initials = inits(name, email);
  const gradient = avatarGradient(name ?? email ?? id);
  const barColor = completed ? "bg-emerald-400" : atRisk ? "bg-rose-400" : "bg-gradient-to-r from-primary to-secondary";

  return (
    <Link
      to="/instructor/students/$userId"
      params={{ userId: id }}
      className="group bg-card border-2 border-border rounded-2xl p-4 chunky-shadow hover:border-primary/40 hover:-translate-y-0.5 transition-all animate-bounce-in flex flex-col gap-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* header row */}
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-xl bg-gradient-to-br ${gradient} grid place-items-center text-white font-black text-sm shrink-0 shadow-sm`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm truncate group-hover:text-primary transition-colors">{name ?? "—"}</p>
          <p className="text-[11px] text-foreground/50 truncate">{email}</p>
        </div>
        <ChevronRight className="size-4 text-foreground/30 group-hover:text-primary shrink-0 transition-colors" strokeWidth={2.5} />
      </div>

      {/* group chip */}
      {groupLabel && (
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-foreground/55 bg-muted px-2.5 py-1 rounded-full self-start border border-border">
          <BookOpen className="size-3" strokeWidth={2} />
          {groupLabel}
        </div>
      )}

      {/* progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-foreground/50">Progress</span>
          <span className={`text-xs font-black ${completed ? "text-emerald-600" : atRisk ? "text-rose-500" : "text-foreground/70"}`}>
            {progress}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* status */}
      <div className="pt-1 border-t border-border/60">
        {completed
          ? <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600">
            <CheckCircle2 className="size-3" strokeWidth={2.5} /> Completed
          </span>
          : atRisk
            ? <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-500">
              <AlertTriangle className="size-3" strokeWidth={2.5} /> At risk
            </span>
            : <span className="text-[11px] font-bold text-foreground/40">Active</span>}
      </div>
    </Link>
  );
}

// ── list row ──────────────────────────────────────────────────────────────────

function StudentRow({
  id, name, email, groupLabel, progress, completed,
}: {
  id: string; name: string | null; email: string | null;
  groupLabel: string | null; progress: number; completed: boolean;
}) {
  const atRisk = progress < 40 && !completed;
  const trend: "up" | "down" | "flat" = progress >= 70 ? "up" : progress < 40 ? "down" : "flat";
  const TIcon = { up: TrendingUp, down: TrendingDown, flat: Minus }[trend];
  const trendTone = { up: "text-emerald-600", down: "text-rose-600", flat: "text-foreground/50" }[trend];
  const initials = inits(name, email);
  const gradient = avatarGradient(name ?? email ?? id);

  return (
    <li className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.5fr_100px_40px] gap-4 px-5 py-4 items-center border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
      <Link to="/instructor/students/$userId" params={{ userId: id }} className="flex items-center gap-3 min-w-0">
        <div className={`size-10 rounded-2xl bg-gradient-to-br ${gradient} grid place-items-center text-white font-black text-sm shrink-0 shadow-sm`}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-black text-sm truncate group-hover:text-primary transition-colors">{name ?? "—"}</p>
          <p className="text-[11px] text-foreground/50 truncate">{email}</p>
        </div>
      </Link>

      <span className="text-xs font-bold text-foreground/60 truncate">
        {groupLabel ?? "—"}
      </span>

      <span className="flex items-center gap-2">
        <span className="h-2.5 flex-1 bg-muted rounded-full overflow-hidden border border-border">
          <span
            className={`block h-full rounded-full ${atRisk ? "bg-rose-400" : completed ? "bg-emerald-400" : "bg-gradient-to-r from-primary to-secondary"}`}
            style={{ width: `${progress}%` }}
          />
        </span>
        <span className={`text-xs font-black font-mono inline-flex items-center gap-0.5 shrink-0 ${trendTone}`}>
          <TIcon className="size-3" strokeWidth={3} />{progress}%
        </span>
      </span>

      <span>
        {completed
          ? <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="size-3" strokeWidth={2.5} /> Done
          </span>
          : atRisk
            ? <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200">
              <AlertTriangle className="size-3" strokeWidth={2.5} /> At risk
            </span>
            : <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200">
              Active
            </span>}
      </span>

      <Link
        to="/instructor/students/$userId"
        params={{ userId: id }}
        className="inline-flex items-center justify-center size-9 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <ChevronRight className="size-4" />
      </Link>
    </li>
  );
}

// ── backend version ───────────────────────────────────────────────────────────

function BackendStudentsPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const studentsQuery = useInstructorStudents({ q: debouncedQ || undefined });
  const items = studentsQuery.data?.items ?? [];
  const total = studentsQuery.data?.total ?? 0;

  const groups = useMemo(() => {
    const names = Array.from(new Set(items.map((s) => s.groupName).filter(Boolean)));
    return ["All", ...names] as string[];
  }, [items]);
  const [groupFilter, setGroupFilter] = useState("All");

  const filtered = useMemo(() => {
    if (groupFilter === "All") return items;
    return items.filter((s) => s.groupName === groupFilter);
  }, [items, groupFilter]);

  const avgProgress = filtered.length
    ? Math.round(filtered.reduce((sum, s) => sum + s.progressPercent, 0) / filtered.length)
    : 0;
  const completedCount = filtered.filter((s) => s.completed).length;
  const atRiskCount = filtered.filter((s) => s.progressPercent < 40 && !s.completed).length;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleQChange = (val: string) => {
    setQ(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(val), 400);
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <TopBar title="Students" subtitle="Roster across every class you teach" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total students" value={total} icon={Users} accent="primary" delay={0} />
          <StatCard label="Avg progress" value={`${avgProgress}%`} icon={TrendingUp} accent="secondary" delay={60} />
          <StatCard label="Completed" value={completedCount} icon={CheckCircle2} accent="emerald" delay={120} />
          <StatCard label="At risk" value={atRiskCount} icon={AlertTriangle} accent="rose" delay={180} />
        </div>

        <FilterBar
          q={q} onQ={handleQChange}
          groups={groups} groupFilter={groupFilter} onGroup={setGroupFilter}
          view={view} onView={setView}
        />

        {studentsQuery.isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-7 animate-spin text-foreground/30" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[32px] border-2 border-dashed border-border bg-card p-12 text-center">
            <Users className="size-10 text-foreground/20 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm font-bold text-foreground/50">No students found.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s, i) => (
              <StudentCard
                key={s.enrollmentId}
                id={String(s.userId)}
                name={s.fullName}
                email={s.email}
                groupLabel={s.groupName ?? s.courseTitle ?? null}
                progress={s.progressPercent}
                completed={s.completed}
                delay={i * 60}
              />
            ))}
          </div>
        ) : (
          <div className="bg-card border-2 border-border rounded-[32px] chunky-shadow overflow-hidden">
            <div className="hidden md:grid grid-cols-[2fr_1fr_1.5fr_100px_40px] gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-foreground/50 border-b-2 border-border bg-muted/40">
              <span>Student</span><span>Group</span><span>Progress</span><span>Status</span><span />
            </div>
            <ul>
              {filtered.map((s) => (
                <StudentRow
                  key={s.enrollmentId}
                  id={String(s.userId)}
                  name={s.fullName}
                  email={s.email}
                  groupLabel={s.groupName ?? s.courseTitle ?? null}
                  progress={s.progressPercent}
                  completed={s.completed}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

// ── prototype version ─────────────────────────────────────────────────────────

function PrototypeStudentsPage() {
  const [cls, setCls] = useState("All");
  const [q, setQ] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const classes = ["All", "Cognitive Psych", "Calculus", "Org. Chem II"];
  const items = seed.filter(
    (s) => (cls === "All" || s.cls === cls) && (s.name + s.email).toLowerCase().includes(q.toLowerCase()),
  );

  const avgProgress = Math.round(seed.reduce((n, s) => n + s.progress, 0) / seed.length);
  const completedCount = seed.filter((s) => s.progress >= 90).length;
  const atRiskCount = seed.filter((s) => s.progress < 40).length;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
      <TopBar title="Students" subtitle="Roster across every class you teach" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total students" value={seed.length} icon={Users} accent="primary" delay={0} />
        <StatCard label="Avg progress" value={`${avgProgress}%`} icon={TrendingUp} accent="secondary" delay={60} />
        <StatCard label="Completed" value={completedCount} icon={CheckCircle2} accent="emerald" delay={120} />
        <StatCard label="At risk" value={atRiskCount} icon={AlertTriangle} accent="rose" delay={180} />
      </div>

      <FilterBar
        q={q} onQ={setQ}
        groups={classes} groupFilter={cls} onGroup={setCls}
        view={view} onView={setView}
      />

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((s, i) => (
            <StudentCard
              key={s.id}
              id={s.id}
              name={s.name}
              email={s.email}
              groupLabel={s.cls}
              progress={s.progress}
              completed={s.progress >= 90}
              delay={i * 60}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border-2 border-border rounded-[32px] chunky-shadow overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1.5fr_80px_80px_40px] gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-foreground/50 border-b-2 border-border bg-muted/40">
            <span>Student</span><span>Class</span><span>Progress</span><span>Grade</span><span>Attend.</span><span />
          </div>
          <ul>
            {items.map((s) => (
              <li
                key={s.id}
                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.5fr_80px_80px_40px] gap-4 px-5 py-4 items-center border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
              >
                <Link to="/instructor/students/$userId" params={{ userId: s.id }} className="flex items-center gap-3 min-w-0">
                  <div className={`size-10 rounded-2xl bg-gradient-to-br ${avatarGradient(s.name)} grid place-items-center text-white font-black text-sm shrink-0 shadow-sm`}>
                    {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm truncate group-hover:text-primary transition-colors">{s.name}</p>
                    <p className="text-[11px] text-foreground/50 truncate">{s.email}</p>
                  </div>
                </Link>
                <span className="text-xs font-bold text-foreground/60">{s.cls}</span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 flex-1 bg-muted rounded-full overflow-hidden border border-border">
                    <span
                      className={`block h-full rounded-full ${s.progress < 40 ? "bg-rose-400" : "bg-gradient-to-r from-primary to-secondary"}`}
                      style={{ width: `${s.progress}%` }}
                    />
                  </span>
                  <span className={`text-xs font-black font-mono shrink-0 ${s.progress >= 70 ? "text-emerald-600" : s.progress < 40 ? "text-rose-600" : "text-foreground/60"}`}>
                    {s.progress}%
                  </span>
                </span>
                <span className="font-black font-mono text-sm">{s.grade}</span>
                <span className="font-bold text-sm text-foreground/70">{s.attendance}%</span>
                <Link to="/instructor/students/$userId" params={{ userId: s.id }} className="inline-flex items-center justify-center size-9 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                  <ChevronRight className="size-4" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </DashboardShell>
  );
}
