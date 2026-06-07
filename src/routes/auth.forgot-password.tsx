import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
      toast.error("Could not send reset code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle={
        sent
          ? "Check your email for a 6-digit reset code."
          : "We'll email you a one-time code to reset your password."
      }
      footer={
        <Link to="/auth" className="font-bold text-primary hover:underline">
          ← Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm font-medium">
          A reset code was sent to <span className="font-bold">{email}</span>. Redirecting…
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
            {loading ? "Sending…" : "Send reset code"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
