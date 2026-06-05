import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { ProgressRecap } from "@/components/parent/ProgressRecap";
import { MilestoneFeed } from "@/components/parent/MilestoneFeed";
import { TodoSummary } from "@/components/parent/TodoSummary";
import { UpcomingSessions } from "@/components/parent/UpcomingSessions";
import { ParentMessages } from "@/components/parent/ParentMessages";
import { BillingCard } from "@/components/parent/BillingCard";

export const Route = createFileRoute("/parent")({
  head: () => ({ meta: [{ title: "QuestLMS — Parent" }] }),
  component: ParentLayout,
});

function ParentLayout() {
  const { pathname } = useLocation();
  if (pathname === "/parent") return <ParentDashboard />;
  return <Outlet />;
}

function ParentDashboard() {
  const [childId, setChildId] = useState("1");
  return (
    <DashboardShell>
      <TopBar />
      <section className="grid grid-cols-12 gap-6">
        <ChildSelector selectedId={childId} onSelect={setChildId} />
        <ProgressRecap />
        <MilestoneFeed />
        <TodoSummary />
        <UpcomingSessions />
        <ParentMessages />
        <BillingCard />
      </section>
    </DashboardShell>
  );
}
