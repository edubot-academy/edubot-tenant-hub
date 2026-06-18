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

export const Route = createFileRoute("/auth/activate/$token")({
  component: ActivateAccountPage,
});

interface SetupPreview {
  email: string;
  fullName: string | null;
  role: string | null;
  tenantName: string | null;
  inviterName: string | null;
}

function ActivateAccountPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        email: t("auth.activate.prototype.email", { defaultValue: "owner@demo.local" }),
        fullName: null,
        role: "owner",
        tenantName: t("auth.activate.prototype.tenantName", { defaultValue: "EduBot Academy" }),
        inviterName: null,
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
      .catch(() =>
        setPreviewError(
          t("auth.activate.errors.invalidPreview", {
            defaultValue: "This activation link is invalid or has already been used.",
          }),
        ),
      );
  }, [isBackendEnabled, t, token]);

  const handleActivate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(t("auth.activate.validation.passwordMin", { defaultValue: "Password must be at least 8 characters" }));
      return;
    }
    if (password !== confirm) {
      toast.error(t("auth.activate.validation.passwordMatch", { defaultValue: "Passwords do not match" }));
      return;
    }
    setLoading(true);
    try {
      if (isBackendEnabled) {
        await apiRequest("/auth/setup-account", {
          method: "POST",
          body: { token, newPassword: password, fullName: name.trim() || undefined },
          skipTenantHeader: true,
        });
        toast.success(t("auth.activate.toast.activatedSignIn", { defaultValue: "Account activated — please sign in." }));
        navigate({ to: "/auth", replace: true });
      } else {
        await new Promise((r) => setTimeout(r, 700));
        toast.success(t("auth.activate.toast.activated", { defaultValue: "Account activated" }));
        navigate({ to: "/", replace: true });
      }
    } catch {
      toast.error(t("auth.activate.errors.invalidOrExpired", { defaultValue: "Activation link is invalid or expired" }));
    } finally {
      setLoading(false);
    }
  };

  if (!preview) {
    return (
      <AuthShell
        tone="activate"
        eyebrow={
          previewError
            ? t("auth.activate.state.unavailable", { defaultValue: "Activation unavailable" })
            : t("auth.activate.state.loading", { defaultValue: "Loading…" })
        }
        title={
          previewError
            ? t("auth.activate.state.unavailable", { defaultValue: "Activation unavailable" })
            : t("auth.activate.state.loading", { defaultValue: "Loading…" })
        }
        subtitle={previewError ?? t("auth.activate.state.validating", { defaultValue: "Validating your activation link." })}
      >
        {previewError ? (
          <p className="text-sm text-foreground/60">
            {t("auth.activate.state.askAdmin", { defaultValue: "Ask your administrator for a fresh activation link." })}
          </p>
        ) : (
          <div className="h-28 rounded-[1.5rem] bg-muted/50 animate-pulse" />
        )}
      </AuthShell>
    );
  }

  const roleLabel = preview.role
    ? t(`roles.${preview.role}`, { defaultValue: preview.role.replace(/_/g, " ") })
    : t("roles.member", { defaultValue: "Member" });
  const workspaceName = preview.tenantName ?? t("auth.activate.workspaceFallback", { defaultValue: "workspace" });

  return (
    <AuthShell
      tone="activate"
      eyebrow={t("auth.activate.title", { defaultValue: "Activate your account" })}
      title={t("auth.activate.title", { defaultValue: "Activate your account" })}
      subtitle={
        <>
          {t("auth.activate.subtitlePrefix", { defaultValue: "Set up your" })}{" "}
          <span className="font-bold text-foreground">{workspaceName}</span>{" "}
          {t("auth.activate.subtitleAs", { defaultValue: "as" })}{" "}
          <span className="font-bold text-foreground">{roleLabel}</span>.
        </>
      }
    >
      <div className="rounded-[1.5rem] border border-primary/20 bg-primary/8 p-4 text-sm font-medium text-foreground/72">
        {t("auth.activate.activating", { defaultValue: "Activating" })} <span className="font-bold">{preview.email}</span>
      </div>

      <form onSubmit={handleActivate} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name" className="text-sm font-black tracking-tight">
            {t("auth.activate.fields.name", { defaultValue: "Your name" })}
          </Label>
          <Input
            id="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-2xl border-2 border-border/80 bg-background/80 px-4 text-base shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] focus:border-primary focus-visible:ring-0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-sm font-black tracking-tight">
            {t("auth.activate.fields.password", { defaultValue: "Create password" })}
          </Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-2xl border-2 border-border/80 bg-background/80 px-4 text-base shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] focus:border-primary focus-visible:ring-0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm" className="text-sm font-black tracking-tight">
            {t("auth.activate.fields.confirm", { defaultValue: "Confirm password" })}
          </Label>
          <Input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-12 rounded-2xl border-2 border-border/80 bg-background/80 px-4 text-base shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] focus:border-primary focus-visible:ring-0"
          />
        </div>
        <Button
          type="submit"
          className="mt-2 h-12 w-full rounded-2xl text-base font-black shadow-[0_18px_34px_-22px_rgba(15,23,42,0.5)]"
          disabled={loading}
        >
          {loading
            ? t("auth.activate.actions.activating", { defaultValue: "Activating…" })
            : t("auth.activate.actions.activate", { defaultValue: "Activate account" })}
        </Button>
      </form>
    </AuthShell>
  );
}
