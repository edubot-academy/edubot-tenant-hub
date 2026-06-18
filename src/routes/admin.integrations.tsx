import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/integrations")({
  component: AdminIntegrationsRedirect,
});

function AdminIntegrationsRedirect() {
  return <Navigate to="/integrations" replace />;
}
