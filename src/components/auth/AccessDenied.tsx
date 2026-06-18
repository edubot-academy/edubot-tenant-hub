import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useAppContext } from "@/lib/app-context";
import { homeForRole } from "@/lib/route-access";

export function AccessDenied() {
  const { t } = useTranslation();
  const { context } = useAppContext();

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center chunky-shadow">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-muted text-foreground">
          <ShieldAlert className="size-7" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t("accessDenied.title")}
        </h1>
        <p className="mt-2 text-sm font-medium text-foreground/60">
          {t("accessDenied.body")}
        </p>
        <Button asChild className="mt-6 font-bold">
          <Link to={homeForRole(context.activeRole)}>
            {t("accessDenied.goHome")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
