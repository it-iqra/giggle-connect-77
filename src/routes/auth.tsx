import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Sparkles, ShoppingBag, Briefcase, Users } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).catch("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
});

type Role = "buyer" | "seller" | "both";

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("buyer");
  const [busy, setBusy] = useState(false);

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.error) {
        toast.error("Google sign-in failed");
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left visual */}
      <div className="relative hidden overflow-hidden lg:flex flex-col justify-between p-12 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </span>
          Giggr
        </Link>
        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Where talent<br />meets opportunity.
          </h2>
          <p className="max-w-md text-white/85 text-lg">
            Join thousands of freelancers and businesses building remarkable things together.
          </p>
          <div className="flex gap-8 pt-4">
            <div><div className="text-3xl font-bold">50K+</div><div className="text-sm text-white/75">Freelancers</div></div>
            <div><div className="text-3xl font-bold">200+</div><div className="text-sm text-white/75">Categories</div></div>
            <div><div className="text-3xl font-bold">98%</div><div className="text-sm text-white/75">Satisfaction</div></div>
          </div>
        </div>
        <div className="text-sm text-white/70">© {new Date().getFullYear()} Giggr</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden mb-8 flex items-center gap-2 font-bold">
            <Sparkles className="h-5 w-5 text-primary" /> Giggr
          </Link>

          <h1 className="text-3xl font-bold tracking-tight">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isSignup ? "Join the marketplace in 30 seconds." : "Sign in to continue to your dashboard."}
          </p>

          <Button
            variant="outline"
            type="button"
            disabled={busy}
            onClick={handleGoogle}
            className="mt-8 w-full h-11"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 border-t" /> OR <div className="flex-1 border-t" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {isSignup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label>I want to join as</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { v: "buyer" as const, icon: ShoppingBag, label: "Buyer" },
                      { v: "seller" as const, icon: Briefcase, label: "Seller" },
                      { v: "both" as const, icon: Users, label: "Both" },
                    ]).map((opt) => (
                      <button
                        type="button"
                        key={opt.v}
                        onClick={() => setRole(opt.v)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                          role === opt.v
                            ? "border-primary bg-primary/5 text-primary shadow-[var(--shadow-elegant)]"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <opt.icon className="h-5 w-5" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="w-full h-11 bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-95"
            >
              {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account? " : "New to Giggr? "}
            <Link
              to="/auth"
              search={{ mode: isSignup ? "login" : "signup" }}
              className="font-medium text-primary hover:underline"
            >
              {isSignup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
