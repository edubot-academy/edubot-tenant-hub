import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/integrations")({
  component: AdminIntegrationsRedirect,
});

function AdminIntegrationsRedirect() {
  return <Navigate to="/company-admin/integrations" replace />;
}
