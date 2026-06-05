import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/invite/$token")({
  component: InviteAcceptPage,
});

interface InvitePreview {
  email: string;
  role: string;
  inviterName?: string;
  tenantName?: string;
}

function InviteAcceptPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: resolve invite token on backend
    // api.resolveInvite(token).then(setPreview).catch(...)
    const t = setTimeout(() => {
      setPreview({
        email: "invitee@example.com",
        role: "instructor",
        inviterName: "Alex Owner",
        tenantName: "Acme Academy",
      });
    }, 300);
    return () => clearTimeout(t);
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      // TODO: call your backend accept-invite endpoint
      // const { role } = await api.acceptInvite({ token, name, password });
      // then redirect to ROLE_CONFIG[role].home
      await new Promise((r) => setTimeout(r, 700));
      toast.success("Welcome aboard!");
      navigate({ to: "/" });
    } catch {
      toast.error("Could not accept invite");
    } finally {
      setLoading(false);
    }
  };

  if (previewError) {
    return (
      <AuthShell title="Invite unavailable" subtitle={previewError}>
        <p className="text-sm text-foreground/60">
          Ask the person who invited you for a fresh link.
        </p>
      </AuthShell>
    );
  }

  if (!preview) {
    return (
      <AuthShell title="Loading invite…" subtitle="Validating your link.">
        <div className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Accept your invite"
      subtitle={
        <>
          {preview.inviterName ?? "Someone"} invited you to join{" "}
          <span className="font-bold text-foreground">
            {preview.tenantName ?? "the workspace"}
          </span>{" "}
          as <span className="font-bold text-foreground">{preview.role}</span>.
        </>
      }
    >
      <div className="rounded-2xl border border-border bg-muted/40 p-3 text-xs font-medium">
        Signing up as <span className="font-bold">{preview.email}</span>
      </div>

      <form onSubmit={handleAccept} className="flex flex-col gap-4">
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
          {loading ? "Setting up…" : "Accept & continue"}
        </Button>
      </form>
    </AuthShell>
  );
}
