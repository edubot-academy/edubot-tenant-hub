import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/activate/$token")({
  component: ActivateAccountPage,
});

interface ActivationPreview {
  email: string;
  role: "owner" | "company_admin";
  tenantName?: string;
}

function ActivateAccountPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<ActivationPreview | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: resolve activation token from main-app provisioning
    // api.resolveActivation(token).then(setPreview).catch(...)
    const t = setTimeout(() => {
      setPreview({
        email: "owner@acme.com",
        role: "owner",
        tenantName: "Acme Academy",
      });
    }, 300);
    return () => clearTimeout(t);
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      // TODO: call your backend activation endpoint
      // await api.activateAccount({ token, name, password });
      await new Promise((r) => setTimeout(r, 700));
      toast.success("Account activated");
      navigate({ to: "/" });
    } catch {
      toast.error("Activation link is invalid or expired");
    } finally {
      setLoading(false);
    }
  };

  if (!preview) {
    return (
      <AuthShell title="Loading…" subtitle="Validating your activation link.">
        <div className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
      </AuthShell>
    );
  }

  const roleLabel =
    preview.role === "owner" ? "Workspace Owner" : "Company Admin";

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
