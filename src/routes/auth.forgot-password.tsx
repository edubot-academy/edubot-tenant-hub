import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isBackendApiEnabled()) {
        await apiRequest("/auth/forgot-password", {
          method: "POST",
          body: { identifier: email.trim(), method: "email" },
          skipTenantHeader: true,
        });
        setSent(true);
        sessionStorage.setItem("resetPasswordEmail", email.trim());
        setTimeout(() => {
          navigate({ to: "/reset-password", search: { method: "email" } });
        }, 2000);
      } else {
        await new Promise((r) => setTimeout(r, 600));
        setSent(true);
      }
    } catch {
      toast.error(t("auth.forgotPassword.toast.error", { defaultValue: "Could not send reset code" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      tone="recovery"
      eyebrow={t("auth.forgotPassword.title", { defaultValue: "Reset your password" })}
      title={t("auth.forgotPassword.title", { defaultValue: "Reset your password" })}
      subtitle={
        sent
          ? t("auth.forgotPassword.subtitleSent", { defaultValue: "Check your email for a 6-digit reset code." })
          : t("auth.forgotPassword.subtitle", { defaultValue: "We'll email you a one-time code to reset your password." })
      }
      footer={
        <Link to="/auth" className="font-bold text-primary hover:underline">
          {t("auth.forgotPassword.backToSignIn", { defaultValue: "← Back to sign in" })}
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-[1.5rem] border border-secondary/20 bg-secondary/8 p-5 text-sm font-medium text-foreground/72">
          {t("auth.forgotPassword.sentMessage", { email, defaultValue: "A reset code was sent to {{email}}. Redirecting…" })}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              className="h-12 rounded-2xl border-2 border-border/80 bg-background/80 px-4 text-base shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] focus:border-secondary focus-visible:ring-0"
            />
          </div>
          <Button
            type="submit"
            className="mt-2 h-12 w-full rounded-2xl text-base font-black shadow-[0_18px_34px_-22px_rgba(15,23,42,0.5)]"
            disabled={loading}
          >
            {loading
              ? t("auth.forgotPassword.sending", { defaultValue: "Sending…" })
              : t("auth.forgotPassword.submit", { defaultValue: "Send reset code" })}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
