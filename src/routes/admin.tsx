import { createFileRoute, Navigate, Outlet, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: AdminRoot,
});

function AdminRoot() {
  const { pathname } = useLocation();

  if (pathname === "/admin" || pathname === "/admin/") return <Navigate to="/" replace />;
  return <Outlet />;
}
