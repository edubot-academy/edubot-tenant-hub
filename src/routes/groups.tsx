import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Users, BookOpen, Calendar, Loader2 } from "lucide-react";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { useTenantCourseGroups } from "@/lib/lms-core-api";

export const Route = createFileRoute("/groups")({
  head: () => ({ meta: [{ title: "QuestLMS — Individual Groups" }] }),
  component: GroupsPage,
});

function GroupsPage() {
  const childMatches = useChildMatches();
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const groupsQuery = useTenantCourseGroups();

  if (childMatches.length > 0) return <Outlet />;

  const groups = groupsQuery.data ?? [];

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <TopBar
          title="Groups"
          subtitle="Course groups and their sessions."
          showStreak={false}
        />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-bold text-foreground/50">
            {backendEnabled ? `${groups.length} group${groups.length === 1 ? "" : "s"}` : ""}
          </p>
        </div>

        {!backendEnabled ? (
          <EmptyState />
        ) : groupsQuery.isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-7 animate-spin text-foreground/30" />
          </div>
        ) : groupsQuery.isError ? (
          <div className="rounded-2xl border-2 border-dashed border-destructive/40 bg-card p-10 text-center">
            <p className="font-bold text-destructive">Could not load groups</p>
            <p className="text-sm text-foreground/50 mt-1">The request failed. Try refreshing.</p>
          </div>
        ) : groups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Link
                key={group.id}
                to="/groups/$groupId"
                params={{ groupId: String(group.id) }}
                className="group bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow hover:border-primary/40 hover:-translate-y-0.5 transition-all"
              >
                <div className="h-20 bg-gradient-to-br from-primary to-secondary relative flex items-end px-4 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80 absolute top-3 left-4">
                    {group.code}
                  </span>
                  {group.deliveryMode === "individual" && (
                    <span className="absolute top-3 right-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-white/20 text-white border-white/30">
                      1-on-1
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-black text-base leading-tight truncate group-hover:text-primary transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-xs text-foreground/50 font-medium mt-0.5 truncate">
                      {group.course?.title ?? "Course"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-bold text-foreground/55 pt-2 border-t border-border/60">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" /> {group.activeStudentCount ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <Calendar className="size-3.5 shrink-0" />
                      {group.startDate
                        ? new Date(group.startDate).toLocaleDateString()
                        : group.status}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1.5">
                      <BookOpen className="size-3.5" />
                      <span className="capitalize">{group.status}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 flex flex-col items-center gap-3 text-center">
      <Users className="size-10 text-foreground/20" strokeWidth={1.5} />
      <p className="text-sm font-bold text-foreground/50">No groups yet</p>
      <p className="text-xs text-foreground/40">
        Create a group to start organizing course sessions.
      </p>
    </div>
  );
}
