import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only after the component has mounted on the client.
 * Use to wrap UI whose output depends on browser-only state (localStorage,
 * window.matchMedia, navigator.language, etc.) where matching the SSR HTML
 * exactly is not feasible. Server / first client paint shows the fallback.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
