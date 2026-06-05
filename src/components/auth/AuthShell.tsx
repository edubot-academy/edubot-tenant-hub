import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen w-full grid place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-3 mb-8 justify-center">
          <div className="size-11 bg-secondary text-secondary-foreground rounded-xl grid place-items-center font-black text-xl italic chunky-shadow">
            E
          </div>
          <span className="font-extrabold text-2xl tracking-tighter uppercase">EduBot Learning</span>
        </Link>

        <div className="bg-card border border-border rounded-3xl p-8 chunky-shadow">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-foreground/60 mt-1.5 font-medium">{subtitle}</p>
          )}
          <div className="mt-6 flex flex-col gap-4">{children}</div>
        </div>

        {footer && (
          <div className="text-center text-sm text-foreground/60 mt-6 font-medium">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
