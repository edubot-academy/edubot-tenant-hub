import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/staff")({
  component: AdminStaffRedirect,
});

function AdminStaffRedirect() {
  return <Navigate to="/staff" replace />;
}
