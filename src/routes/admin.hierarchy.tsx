import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/hierarchy")({
  component: AdminHierarchyRedirect,
});

function AdminHierarchyRedirect() {
  return <Navigate to="/hierarchy" replace />;
}
