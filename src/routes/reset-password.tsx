import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — LINGUA" },
      { name: "description", content: "Choose a new password for your LINGUA account." },
      { property: "og:title", content: "Set a new password — LINGUA" },
      { property: "og:description", content: "Choose a new password for your LINGUA account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // Supabase consumes the recovery hash (#access_token=...&type=recovery) on
  // client init and restores the session — give it a beat, then check.
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setHasSession(!!data.session);
      setChecking(false);
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter ya.");
      return;
    }
    if (password !== confirm) {
      toast.error("Kedua password belum sama. Cek lagi ya.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password berhasil diganti! Yuk lanjut belajar.");
      navigate({ to: "/dashboard" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("session")
          ? "Link resetnya sudah kadaluarsa. Minta link baru dari halaman sign in ya."
          : "Gagal mengganti password. Coba lagi ya.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <ShieldCheck className="size-6 text-primary" aria-hidden /> Password baru
        </h1>

        {checking ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Memeriksa link reset…
          </div>
        ) : hasSession ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Tulis password baru kamu di bawah, jangan lupa ya.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Password baru</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Ulangi password baru</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Simpan password baru
            </Button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Link reset ini sudah tidak berlaku (kadaluarsa atau sudah dipakai).
            </p>
            <Button asChild className="w-full">
              <Link to="/auth">Minta link reset baru</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
