import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApiError, login } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { ROLE_CONFIG, type Role } from "@/lib/roles";

export const Route = createFileRoute("/auth")({
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const { isBackendEnabled, refetch } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function homeForRole(role?: Role) {
    return ROLE_CONFIG[role ?? "instructor"].home;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!isBackendEnabled) {
        await new Promise((r) => setTimeout(r, 400));
        toast.success("Signed in (prototype)");
        navigate({ to: "/" });
        return;
      }

      await login({ email: email.trim(), password });
      const context = await refetch();
      toast.success("Signed in");
      navigate({ to: homeForRole(context?.activeRole) });
    } catch (error) {
      const message =
        error instanceof ApiError && error.status !== 500
          ? error.message
          : "Invalid credentials";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    toast.info("Google sign-in is not wired yet");
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back to your workspace"
      footer={<>Need access? Ask your administrator for an invite.</>}
    >
      <Button
        type="button"
        variant="outline"
        className="w-full font-bold"
        onClick={handleGoogle}
      >
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 my-1">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
          or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSignIn} className="flex flex-col gap-4">
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

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/auth/forgot-password"
              className="text-xs font-bold text-primary hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full font-bold" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
