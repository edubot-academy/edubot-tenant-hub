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
        // Navigate to reset-password with email pre-filled so the OTP form knows the identifier
        setTimeout(() => {
          navigate({ to: "/reset-password", search: { email: email.trim(), method: "email" } });
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
        <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm font-medium">
          {t("auth.forgotPassword.sentMessage", { email, defaultValue: "A reset code was sent to {{email}}. Redirecting…" })}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <Button type="submit" className="w-full font-bold" disabled={loading}>
            {loading
              ? t("auth.forgotPassword.sending", { defaultValue: "Sending…" })
              : t("auth.forgotPassword.submit", { defaultValue: "Send reset code" })}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
