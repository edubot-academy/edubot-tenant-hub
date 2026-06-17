import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/setup-account")({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  component: SetupAccountPage,
});

interface SetupPreview {
  email: string;
  fullName: string | null;
  role: string | null;
  tenantName: string | null;
  inviterName: string | null;
}

function SetupAccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const token = search.token ?? "";
  const { isBackendEnabled, isLoading, context } = useAppContext();

  const [preview, setPreview] = useState<SetupPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isBackendEnabled && !isLoading && context.user !== null) {
      toast.error(t("auth.setupAccount.alreadySignedIn", { defaultValue: "You are already signed in. Sign out first to set up a new account." }));
      navigate({ to: "/" });
    }
  }, [isBackendEnabled, isLoading, context.user, navigate, t]);

  useEffect(() => {
    if (!token) {
      setPreviewError(t("auth.setupAccount.errors.missingToken", { defaultValue: "No setup token found in the link. Please use the full link from your email." }));
      return;
    }
    if (!isBackendApiEnabled()) {
      setPreview({ email: "user@example.com", fullName: null, role: null, tenantName: null, inviterName: null });
      return;
    }
    apiRequest<SetupPreview>(`/auth/setup-account-preview?token=${encodeURIComponent(token)}`, {
      skipTenantHeader: true,
    })
      .then((data) => {
        setPreview(data);
        if (data.fullName) setName(data.fullName);
      })
      .catch(() => setPreviewError(t("auth.setupAccount.errors.invalidLink", { defaultValue: "This setup link is invalid or has already been used." })));
  }, [token, t]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 8) return toast.error(t("auth.resetPassword.toast.tooShort", { defaultValue: "Password must be at least 8 characters" }));
    if (password !== confirm) return toast.error(t("auth.resetPassword.toast.mismatch", { defaultValue: "Passwords do not match" }));
    setLoading(true);
    try {
      if (isBackendApiEnabled()) {
        await apiRequest("/auth/setup-account", {
          method: "POST",
          body: { token, newPassword: password, fullName: name.trim() || undefined },
          skipTenantHeader: true,
        });
        toast.success(t("auth.setupAccount.toast.ready", { defaultValue: "Account ready — please sign in." }));
        navigate({ to: "/auth", replace: true });
      } else {
        await new Promise((r) => setTimeout(r, 700));
        toast.success(t("auth.setupAccount.toast.success", { defaultValue: "Account set up" }));
        navigate({ to: "/", replace: true });
      }
    } catch {
      toast.error(t("auth.setupAccount.toast.invalidLink", { defaultValue: "Setup link is invalid or expired" }));
    } finally {
      setLoading(false);
    }
  };

  if (previewError || (!token && !preview)) {
    return (
      <AuthShell title={t("auth.setupAccount.unavailable.title", { defaultValue: "Link unavailable" })} subtitle={previewError ?? t("auth.setupAccount.unavailable.noToken", { defaultValue: "No token provided." })}>
        <p className="text-sm text-foreground/60">
          {t("auth.setupAccount.unavailable.body", { defaultValue: "Please use the full link from your email, or request a new one." })}
        </p>
      </AuthShell>
    );
  }

  if (!preview) {
    return (
      <AuthShell title={t("auth.setupAccount.loading.title", { defaultValue: "Setting up your account…" })} subtitle={t("auth.setupAccount.loading.subtitle", { defaultValue: "Validating your link." })}>
        <div className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("auth.setupAccount.title", { defaultValue: "Set up your account" })}
      subtitle={
        preview.tenantName ? (
          <>
            {preview.inviterName ? (
              <>
                {t("auth.setupAccount.invitedBy", { inviter: preview.inviterName, defaultValue: "{{inviter}} invited you to" })} <span className="font-bold text-foreground">{preview.tenantName}</span>.
              </>
            ) : (
              <>
                {t("auth.setupAccount.welcomeTo", { defaultValue: "Welcome to" })} <span className="font-bold text-foreground">{preview.tenantName}</span>.
              </>
            )}
          </>
        ) : (
          t("auth.setupAccount.subtitle", { defaultValue: "Choose a password to activate your account." })
        )
      }
    >
      <div className="rounded-2xl border border-border bg-muted/40 p-3 text-xs font-medium">
        {t("auth.setupAccount.activating", { email: preview.email, defaultValue: "Activating {{email}}" })}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{t("auth.setupAccount.fields.name", { defaultValue: "Your name" })}</Label>
          <Input
            id="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("auth.setupAccount.fields.password", { defaultValue: "Create password" })}</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">{t("auth.resetPassword.fields.confirmPassword", { defaultValue: "Confirm password" })}</Label>
          <Input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full font-bold" disabled={loading}>
          {loading
            ? t("auth.setupAccount.settingUp", { defaultValue: "Setting up…" })
            : t("auth.setupAccount.submit", { defaultValue: "Activate account" })}
        </Button>
      </form>
    </AuthShell>
  );
}
