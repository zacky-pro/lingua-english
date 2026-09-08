import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LINGUA English Learning" },
      {
        name: "description",
        content: "Create your free LINGUA account and start learning English from zero today.",
      },
      { property: "og:title", content: "Sign in — LINGUA" },
      { property: "og:description", content: "Start learning English from zero with LINGUA." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created. Let's set up your learning path.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast.error(
        message.includes("Invalid login") ? "Email or password isn't right. Please try again." : message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      const err = result.error as unknown;
      const detail =
        typeof err === "string" ? err : ((err as { message?: string } | null)?.message ?? "");
      toast.error(detail ? `Google sign-in failed: ${detail}` : "Google sign-in didn't work. Please try again.");
      return;
    }

    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  async function handleReset() {
    if (!email) {
      toast.info("Enter your email first, then tap reset.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error("We couldn't send that email. Please try again.");
    else toast.success("Check your inbox for the reset link.");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between gradient-hero p-10 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-extrabold">
          <Zap className="size-6" aria-hidden /> LINGUA
        </Link>
        <div>
          <h2 className="max-w-md font-display text-4xl font-extrabold leading-tight">
            From Zero English to Real Conversations.
          </h2>
          <p className="mt-4 max-w-sm text-primary-foreground/85">
            Learn. Practice. Speak. Become fluent — 15 minutes a day is enough to start.
          </p>
          <ul className="mt-8 space-y-2 text-sm text-primary-foreground/90">
            <li>• Structured path A0 → C2</li>
            <li>• Spaced repetition vocabulary</li>
            <li>• AI conversation and speaking practice</li>
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/70">Belajar bahasa Inggris dari nol, langkah demi langkah.</p>
      </div>

      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back
          </Link>
          <h1 className="font-display text-2xl font-bold">Welcome to LINGUA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buat akun gratis untuk menyimpan progres belajarmu.
          </p>

          <Tabs value={mode} onValueChange={setMode} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value={mode} className="mt-5">
              <form onSubmit={handleEmail} className="space-y-4">
                {mode === "signup" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Display name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" />
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  {mode === "signup" ? "Create free account" : "Sign in"}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>

              <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
                Continue with Google
              </Button>

              {mode === "signin" ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </button>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
