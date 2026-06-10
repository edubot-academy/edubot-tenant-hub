import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/lib/app-context";
import { apiRequest } from "@/lib/api/client";

export const Route = createFileRoute("/invite/$token")({
  component: InviteAcceptPage,
});

interface SetupPreview {
  email: string;
  fullName: string | null;
  role: string | null;
  tenantName: string | null;
  inviterName: string | null;
}

function InviteAcceptPage() {
  const { t } = useTranslation();
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { isBackendEnabled } = useAppContext();
  const [preview, setPreview] = useState<SetupPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isBackendEnabled) {
      setPreview({
        email: "invitee@example.com",
        fullName: null,
        role: "instructor",
        tenantName: "Acme Academy",
        inviterName: "Alex Owner",
      });
      return;
    }
    apiRequest<SetupPreview>(`/auth/setup-account-preview?token=${encodeURIComponent(token)}`, {
      skipTenantHeader: true,
    })
      .then((data) => {
        setPreview(data);
        if (data.fullName) setName(data.fullName);
      })
      .catch(() => setPreviewError(t("auth.invite.errors.invalidLink", { defaultValue: "This invite link is invalid or has already been used." })));
  }, [isBackendEnabled, token, t]);

  const handleAccept = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 8) return toast.error(t("auth.resetPassword.toast.tooShort", { defaultValue: "Password must be at least 8 characters" }));
    if (password !== confirm) return toast.error(t("auth.resetPassword.toast.mismatch", { defaultValue: "Passwords do not match" }));
    setLoading(true);
    try {
      if (isBackendEnabled) {
        await apiRequest("/auth/setup-account", {
          method: "POST",
          body: { token, newPassword: password, fullName: name.trim() || undefined },
          skipTenantHeader: true,
        });
        toast.success(t("auth.invite.toast.ready", { defaultValue: "Welcome aboard! Please sign in." }));
        navigate({ to: "/auth", replace: true });
      } else {
        await new Promise((r) => setTimeout(r, 700));
        toast.success(t("auth.invite.toast.success", { defaultValue: "Welcome aboard!" }));
        navigate({ to: "/", replace: true });
      }
    } catch {
      toast.error(t("auth.invite.toast.error", { defaultValue: "Could not accept invite — the link may have expired." }));
    } finally {
      setLoading(false);
    }
  };

  if (previewError) {
    return (
      <AuthShell title={t("auth.invite.unavailable.title", { defaultValue: "Invite unavailable" })} subtitle={previewError}>
        <p className="text-sm text-foreground/60">
          {t("auth.invite.unavailable.body", { defaultValue: "Ask the person who invited you for a fresh link." })}
        </p>
      </AuthShell>
    );
  }

  if (!preview) {
    return (
      <AuthShell title={t("auth.invite.loading.title", { defaultValue: "Loading invite…" })} subtitle={t("auth.invite.loading.subtitle", { defaultValue: "Validating your link." })}>
        <div className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
      </AuthShell>
    );
  }

  const inviterName = preview.inviterName ?? t("auth.invite.someone", { defaultValue: "Someone" });
  const tenantName = preview.tenantName ?? t("auth.invite.workspaceFallback", { defaultValue: "the workspace" });
  const roleLabel = preview.role ? t(`roles.${preview.role}`, { defaultValue: preview.role }) : null;

  return (
    <AuthShell
      title={t("auth.invite.title", { defaultValue: "Accept your invite" })}
      subtitle={
        <>
          {t("auth.invite.invitedPrefix", { inviter: inviterName, defaultValue: "{{inviter}} invited you to join" })}{" "}
          <span className="font-bold text-foreground">{tenantName}</span>{" "}
          {roleLabel && (
            <>{t("auth.invite.rolePrefix", { defaultValue: "as" })} <span className="font-bold text-foreground">{roleLabel}</span></>
          )}.
        </>
      }
    >
      <div className="rounded-2xl border border-border bg-muted/40 p-3 text-xs font-medium">
        {t("auth.invite.signingUpAs", { email: preview.email, defaultValue: "Signing up as {{email}}" })}
      </div>

      <form onSubmit={handleAccept} className="flex flex-col gap-4">
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
            : t("auth.invite.submit", { defaultValue: "Accept & continue" })}
        </Button>
      </form>
    </AuthShell>
  );
}
