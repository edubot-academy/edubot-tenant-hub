import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isBackendEnabled, refetch, context: currentContext } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function homeForRole(role: Role) {
    return ROLE_CONFIG[role].home;
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

  const handleGoogle = async () => {
    toast.info(t("auth.signIn.toast.googleNotReady", { defaultValue: "Google sign-in is not wired yet" }));
  };

  return (
    <AuthShell
      title={t("auth.signIn.title", { defaultValue: "Sign in" })}
      subtitle={t("auth.signIn.subtitle", { defaultValue: "Welcome back to your workspace" })}
      footer={<>{t("auth.signIn.footer", { defaultValue: "Need access? Ask your administrator for an invite." })}</>}
    >
      <Button
        type="button"
        variant="outline"
        className="w-full font-bold"
        onClick={handleGoogle}
      >
        {t("auth.signIn.google", { defaultValue: "Continue with Google" })}
      </Button>

      <div className="flex items-center gap-3 my-1">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
          {t("auth.signIn.or", { defaultValue: "or" })}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSignIn} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("auth.fields.email", { defaultValue: "Email" })}</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.fields.password", { defaultValue: "Password" })}</Label>
            <Link
              to="/auth/forgot-password"
              className="text-xs font-bold text-primary hover:underline"
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
          />
        </div>

        <Button type="submit" className="w-full font-bold" disabled={loading}>
          {loading ? t("auth.signIn.signingIn", { defaultValue: "Signing in…" }) : t("auth.signIn.submit", { defaultValue: "Sign in" })}
        </Button>
      </form>
    </AuthShell>
  );
}
