import { createFileRoute, Link, Outlet, useChildMatches, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApiError, login } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { ROLE_CONFIG, type Role } from "@/lib/roles";

export const Route = createFileRoute("/auth")({
  component: SignInPage,
});

function SignInPage() {
  const childMatches = useChildMatches();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isBackendEnabled, refetch, context: currentContext } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function homeForRole(role: Role) {
    return ROLE_CONFIG[role].home;
  }

  if (childMatches.length > 0) {
    return <Outlet />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!isBackendEnabled) {
        await new Promise((r) => setTimeout(r, 400));
        toast.success(t("auth.signIn.toast.prototype", { defaultValue: "Signed in (prototype)" }));
        navigate({ to: "/" });
        return;
      }

      await login({ email: email.trim(), password });
      const freshContext = await refetch();
      toast.success(t("auth.signIn.toast.success", { defaultValue: "Signed in" }));
      // Fall back to the live context role if refetch returns no data
      const role = freshContext?.activeRole ?? currentContext.activeRole;
      navigate({ to: homeForRole(role) });
    } catch (error) {
      const message =
        error instanceof ApiError && error.status !== 500
          ? error.message
          : t("auth.signIn.toast.invalid", { defaultValue: "Invalid credentials" });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      tone="signin"
      lockViewport
      eyebrow={t("auth.workspace.secureAccess", { defaultValue: "Secure workspace access" })}
      title={t("auth.signIn.title", { defaultValue: "Sign in" })}
      subtitle={t("auth.signIn.subtitle", { defaultValue: "Welcome back to your workspace" })}
      footer={<>{t("auth.signIn.footer", { defaultValue: "Need access? Ask your administrator for an invite." })}</>}
    >
      <div className="rounded-[1.5rem] border border-border/70 bg-muted/45 px-4 py-4 text-sm text-foreground/68">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-background p-2 text-primary shadow-sm">
            <LockKeyhole className="size-4" strokeWidth={2.4} />
          </div>
          <div>
            <p className="font-bold text-foreground">
              {t("auth.workspace.roles", { defaultValue: "Role-based permissions" })}
            </p>
            <p className="mt-1 leading-6">
              {t("auth.workspace.languageHint", { defaultValue: "The interface follows your tenant language preference." })}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSignIn} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-sm font-black tracking-tight">
            {t("auth.fields.email", { defaultValue: "Email" })}
          </Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-2xl border-2 border-border/80 bg-background/80 px-4 text-base shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] placeholder:text-foreground/30 focus:border-primary focus-visible:ring-0"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-black tracking-tight">
              {t("auth.fields.password", { defaultValue: "Password" })}
            </Label>
            <Link
              to="/auth/forgot-password"
              className="text-sm font-bold text-foreground/60 transition-colors hover:text-primary"
            >
              {t("auth.signIn.forgot", { defaultValue: "Forgot?" })}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-2xl border-2 border-border/80 bg-background/80 px-4 text-base shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] placeholder:text-foreground/30 focus:border-primary focus-visible:ring-0"
          />
        </div>

        <Button
          type="submit"
          className="mt-2 h-12 w-full rounded-2xl text-base font-black shadow-[0_18px_34px_-22px_rgba(15,23,42,0.5)]"
          disabled={loading}
        >
          {loading ? t("auth.signIn.signingIn", { defaultValue: "Signing in…" }) : t("auth.signIn.submit", { defaultValue: "Sign in" })}
        </Button>
      </form>
    </AuthShell>
  );
}
