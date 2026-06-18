import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/instructor/students")({
  component: () => <Outlet />,
});
