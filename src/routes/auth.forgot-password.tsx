import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { isBackendEnabled } = useAppContext();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBackendEnabled) {
      toast.error("Password reset email is not wired to the backend yet.");
      return;
    }
    setLoading(true);
    try {
      // TODO: call your backend password reset endpoint
      // await api.requestPasswordReset({ email });
      await new Promise((r) => setTimeout(r, 600));
      setSent(true);
    } catch {
      toast.error("Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle={
        sent
          ? "Check your email for a reset link."
          : "We'll email you a link to set a new password."
      }
      footer={
        <Link to="/auth" className="font-bold text-primary hover:underline">
          ← Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm font-medium">
          If an account exists for <span className="font-bold">{email}</span>,
          you'll receive a reset link shortly.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
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
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
