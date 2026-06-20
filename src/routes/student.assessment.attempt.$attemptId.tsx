import { createFileRoute, Outlet } from "@tanstack/react-router";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/student/assessment/attempt/$attemptId")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("assessment.intro.badge")}` }] }),
  component: Outlet,
});
