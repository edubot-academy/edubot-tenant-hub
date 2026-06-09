import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/company-admin/staff")({
  component: () => <Outlet />,
});
