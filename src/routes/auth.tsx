import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: call your backend sign-in API
      // const res = await api.signIn({ email, password });
      // store session/token, then redirect to ROLE_CONFIG[role].home
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Signed in (stub)");
      navigate({ to: "/" });
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    // TODO: call your backend Google OAuth start endpoint
    toast.info("Google sign-in (stub)");
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
