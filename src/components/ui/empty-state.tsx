import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`grid place-items-center text-center p-10 animate-fade-in ${className}`}>
      <div className="max-w-sm space-y-3">
        {Icon && (
          <div className="size-16 mx-auto rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center chunky-shadow border-2 border-foreground animate-bounce-in">
            <Icon className="size-7" strokeWidth={2.5} />
          </div>
        )}
        <p className="font-black text-lg">{title}</p>
        {description && <p className="text-sm font-medium text-foreground/55">{description}</p>}
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function SkeletonRows({ className = "h-4", count = 5 }: SkeletonProps) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${className} rounded-lg bg-muted`}
          style={{ width: `${60 + Math.random() * 40}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-40 rounded-3xl bg-muted border-2 border-border animate-pulse" />
      ))}
    </div>
  );
}
