import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";

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
  const navigate = useNavigate();
  const search = Route.useSearch();
  const token = search.token ?? "";

  const [preview, setPreview] = useState<SetupPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setPreviewError("No setup token found in the link. Please use the full link from your email.");
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
      .catch(() => setPreviewError("This setup link is invalid or has already been used."));
  }, [token]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      if (isBackendApiEnabled()) {
        await apiRequest("/auth/setup-account", {
          method: "POST",
          body: { token, newPassword: password, fullName: name.trim() || undefined },
          skipTenantHeader: true,
        });
        toast.success("Account ready — please sign in.");
        navigate({ to: "/auth", replace: true });
      } else {
        await new Promise((r) => setTimeout(r, 700));
        toast.success("Account set up");
        navigate({ to: "/", replace: true });
      }
    } catch {
      toast.error("Setup link is invalid or expired");
    } finally {
      setLoading(false);
    }
  };

  if (previewError || (!token && !preview)) {
    return (
      <AuthShell title="Link unavailable" subtitle={previewError ?? "No token provided."}>
        <p className="text-sm text-foreground/60">
          Please use the full link from your email, or request a new one.
        </p>
      </AuthShell>
    );
  }

  if (!preview) {
    return (
      <AuthShell title="Setting up your account…" subtitle="Validating your link.">
        <div className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set up your account"
      subtitle={
        preview.tenantName ? (
          <>
            {preview.inviterName ? (
              <>{preview.inviterName} invited you to <span className="font-bold text-foreground">{preview.tenantName}</span>.</>
            ) : (
              <>Welcome to <span className="font-bold text-foreground">{preview.tenantName}</span>.</>
            )}
          </>
        ) : (
          "Choose a password to activate your account."
        )
      }
    >
      <div className="rounded-2xl border border-border bg-muted/40 p-3 text-xs font-medium">
        Activating <span className="font-bold">{preview.email}</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          {loading ? "Setting up…" : "Activate account"}
        </Button>
      </form>
    </AuthShell>
  );
}
