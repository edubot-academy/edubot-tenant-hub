import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/owner")({
  component: OwnerRedirect,
});

function OwnerRedirect() {
  return <Navigate to="/company-admin" replace />;
}
