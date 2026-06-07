import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
        email: "owner@acme.com",
        fullName: null,
        role: "owner",
        tenantName: "Acme Academy",
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
      .catch(() => setPreviewError("This activation link is invalid or has already been used."));
  }, [isBackendEnabled, token]);

  const handleActivate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      if (isBackendEnabled) {
        await apiRequest("/auth/setup-account", {
          method: "POST",
          body: { token, newPassword: password, fullName: name.trim() || undefined },
          skipTenantHeader: true,
        });
        toast.success("Account activated — please sign in.");
        navigate({ to: "/auth", replace: true });
      } else {
        await new Promise((r) => setTimeout(r, 700));
        toast.success("Account activated");
        navigate({ to: "/", replace: true });
      }
    } catch {
      toast.error("Activation link is invalid or expired");
    } finally {
      setLoading(false);
    }
  };

  if (!preview) {
    return (
      <AuthShell
        title={previewError ? "Activation unavailable" : "Loading…"}
        subtitle={previewError ?? "Validating your activation link."}
      >
        {previewError ? (
          <p className="text-sm text-foreground/60">
            Ask your administrator for a fresh activation link.
          </p>
        ) : (
          <div className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
        )}
      </AuthShell>
    );
  }

  const roleLabel =
    preview.role === "owner"
      ? "Company Owner"
      : preview.role === "company_admin"
      ? "Company Admin"
      : (preview.role ?? "member");

  return (
    <AuthShell
      title="Activate your account"
      subtitle={
        <>
          Set up your{" "}
          <span className="font-bold text-foreground">
            {preview.tenantName ?? "workspace"}
          </span>{" "}
          as <span className="font-bold text-foreground">{roleLabel}</span>.
        </>
      }
    >
      <div className="rounded-2xl border border-border bg-muted/40 p-3 text-xs font-medium">
        Activating <span className="font-bold">{preview.email}</span>
      </div>

      <form onSubmit={handleActivate} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Create password</Label>
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
          <Label htmlFor="confirm">Confirm password</Label>
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
          {loading ? "Activating…" : "Activate account"}
        </Button>
      </form>
    </AuthShell>
  );
}
