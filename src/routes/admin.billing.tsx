import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/billing")({
  component: AdminBillingRedirect,
});

function AdminBillingRedirect() {
  return <Navigate to="/billing" replace />;
}
