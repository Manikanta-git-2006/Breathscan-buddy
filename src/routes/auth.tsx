import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Activity } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — PulmoScan AI" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app" });
  }, [loading, user, navigate]);

  const handleEmail = async (mode: "signin" | "signup") => {
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/app" },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      toast.error(e.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/app",
    });
    if (res.error) {
      toast.error(res.error.message ?? "Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div
      className="grid min-h-screen place-items-center px-4"
      style={{ background: "var(--gradient-soft)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-card p-8"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <Link to="/" className="mb-6 inline-flex items-center gap-2 font-semibold">
          <div
            className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Activity className="h-5 w-5" />
          </div>
          PulmoScan AI
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to access your scan history.</p>

        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={handleGoogle}
          disabled={busy}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
          </svg>
          Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or email
          <div className="h-px flex-1 bg-border" />
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          {(["signin", "signup"] as const).map((mode) => (
            <TabsContent key={mode} value={mode} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={`email-${mode}`}>Email</Label>
                <Input
                  id={`email-${mode}`}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pw-${mode}`}>Password</Label>
                <Input
                  id={`pw-${mode}`}
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={busy || !email || !password}
                onClick={() => handleEmail(mode)}
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}