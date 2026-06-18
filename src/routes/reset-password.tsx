import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";

export const Route = createFileRoute("/reset-password")({
  validateSearch: z.object({
    method: z.enum(["email", "whatsapp", "telegram"]).optional(),
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [identifier, setIdentifier] = useState(() =>
    typeof window === "undefined" ? "" : sessionStorage.getItem("resetPasswordEmail") ?? "",
  );
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const method = search.method ?? "email";

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 8) return toast.error(t("auth.resetPassword.toast.tooShort", { defaultValue: "Password must be at least 8 characters" }));
    if (password !== confirm) return toast.error(t("auth.resetPassword.toast.mismatch", { defaultValue: "Passwords do not match" }));

    setLoading(true);
    try {
      if (isBackendApiEnabled()) {
        if (!identifier) {
          toast.error(t("auth.resetPassword.toast.missingEmail", { defaultValue: "Missing email — go back to the forgot-password page." }));
          return;
        }
        await apiRequest("/auth/reset-password", {
          method: "POST",
          body: { identifier, method, otp, newPassword: password },
          skipTenantHeader: true,
        });
        sessionStorage.removeItem("resetPasswordEmail");
        setIdentifier("");
        toast.success(t("auth.resetPassword.toast.successSignIn", { defaultValue: "Password updated — please sign in." }));
        navigate({ to: "/auth" });
      } else {
        await new Promise((r) => setTimeout(r, 600));
        toast.success(t("auth.resetPassword.toast.success", { defaultValue: "Password updated" }));
        navigate({ to: "/auth" });
      }
    } catch {
      toast.error(t("auth.resetPassword.toast.invalidCode", { defaultValue: "Reset code is invalid or expired" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      tone="recovery"
      eyebrow={t("auth.resetPassword.title", { defaultValue: "Set a new password" })}
      title={t("auth.resetPassword.title", { defaultValue: "Set a new password" })}
      subtitle={
        identifier
          ? t("auth.resetPassword.subtitleWithIdentifier", { identifier, defaultValue: "Enter the code sent to {{identifier}} and choose a new password." })
          : t("auth.resetPassword.subtitle", { defaultValue: "Enter your reset code and choose a new password." })
      }
      footer={
        <Link to="/auth/forgot-password" className="font-bold text-primary hover:underline">
          {t("auth.resetPassword.resendCode", { defaultValue: "← Resend code" })}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isBackendApiEnabled() && !identifier && (
          <div className="rounded-[1.5rem] border border-secondary/20 bg-secondary/8 p-4 text-sm text-foreground/70">
            {t("auth.resetPassword.subtitle", { defaultValue: "Enter your reset code and choose a new password." })}
          </div>
        )}
        {isBackendApiEnabled() && !identifier && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="identifier" className="text-sm font-black tracking-tight">
              {t("auth.fields.email", { defaultValue: "Email" })}
            </Label>
            <Input
              id="identifier"
              type="email"
              required
              autoComplete="email"
              value={identifier}
              onChange={(e) => {
                const value = e.target.value;
                setIdentifier(value);
                sessionStorage.setItem("resetPasswordEmail", value);
              }}
              className="h-12 rounded-2xl border-2 border-border/80 bg-background/80 px-4 text-base shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] focus:border-secondary focus-visible:ring-0"
            />
          </div>
        )}
        {isBackendApiEnabled() && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="otp" className="text-sm font-black tracking-tight">
              {t("auth.resetPassword.fields.otp", { defaultValue: "Reset code" })}
            </Label>
            <Input
              id="otp"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={t("auth.resetPassword.fields.otpPlaceholder", { defaultValue: "6-digit code" })}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="h-12 rounded-2xl border-2 border-border/80 bg-background/80 px-4 text-base tracking-[0.24em] shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] focus:border-secondary focus-visible:ring-0"
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-sm font-black tracking-tight">
            {t("auth.resetPassword.fields.newPassword", { defaultValue: "New password" })}
          </Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-2xl border-2 border-border/80 bg-background/80 px-4 text-base shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] focus:border-secondary focus-visible:ring-0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm" className="text-sm font-black tracking-tight">
            {t("auth.resetPassword.fields.confirmPassword", { defaultValue: "Confirm password" })}
          </Label>
          <Input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-12 rounded-2xl border-2 border-border/80 bg-background/80 px-4 text-base shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] focus:border-secondary focus-visible:ring-0"
          />
        </div>
        <Button
          type="submit"
          className="mt-2 h-12 w-full rounded-2xl text-base font-black shadow-[0_18px_34px_-22px_rgba(15,23,42,0.5)]"
          disabled={loading}
        >
          {loading
            ? t("auth.resetPassword.updating", { defaultValue: "Updating…" })
            : t("auth.resetPassword.submit", { defaultValue: "Update password" })}
        </Button>
      </form>
    </AuthShell>
  );
}
