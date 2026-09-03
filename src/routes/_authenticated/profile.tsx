import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, LogOut, User, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { LevelBadge, PageHeader, ProgressBar, StatCard } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, useUpdateProfile } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { LEVELS, xpLevel } from "@/lib/lingua";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — LINGUA" },
      { name: "description", content: "Edit your learner profile, level and daily goal." },
      { property: "og:title", content: "Profile — LINGUA" },
      { property: "og:description", content: "Your English learning identity and goals." },
    ],
  }),
  component: ProfilePage,
});

const AVATARS = ["🦊", "🐨", "🐼", "🦉", "🐬", "🐝", "🌵", "🚀", "🎧", "📚"];

function ProfilePage() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  useEffect(() => {
    if (profile) setName(profile.display_name);
  }, [profile]);

  const level = xpLevel(profile?.xp ?? 0);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader icon={User} title="Profile" description="Atur nama, avatar, level, dan target harianmu." />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={Zap} label="XP" value={profile?.xp ?? 0} hint={`Level ${level.level}`} />
        <StatCard icon={Flame} label="Streak" value={profile?.streak_count ?? 0} hint={`Best ${profile?.longest_streak ?? 0}`} />
        <StatCard icon={User} label="Level" value={profile?.level_code ?? "A1"} hint={level.title} />
      </div>

      <section className="surface-card space-y-4 p-5">
        <div>
          <Label htmlFor="display-name">Display name</Label>
          <div className="mt-1.5 flex gap-2">
            <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button
              onClick={() => {
                update.mutate({ display_name: name.trim() || "Learner" });
                toast.success("Profile updated");
              }}
              disabled={update.isPending}
            >
              Save
            </Button>
          </div>
        </div>

        <div>
          <Label>Avatar</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`Choose avatar ${emoji}`}
                aria-pressed={profile?.avatar_emoji === emoji}
                onClick={() => update.mutate({ avatar_emoji: emoji })}
                className={cn(
                  "grid size-11 place-items-center rounded-xl border text-xl transition-colors",
                  profile?.avatar_emoji === emoji ? "border-primary bg-primary-soft" : "border-border hover:bg-muted",
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Current level</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {LEVELS.map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={profile?.level_code === code}
                onClick={() => update.mutate({ level_code: code })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  profile?.level_code === code ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-muted",
                )}
              >
                {code}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Not sure? <Link to="/placement" className="text-primary underline">Take the placement test</Link>.
          </p>
        </div>

        <div>
          <Label htmlFor="goal">Daily goal ({profile?.daily_goal_minutes ?? 10} minutes)</Label>
          <input
            id="goal"
            type="range"
            min={5}
            max={60}
            step={5}
            value={profile?.daily_goal_minutes ?? 10}
            onChange={(e) => update.mutate({ daily_goal_minutes: Number(e.target.value) })}
            className="mt-2 w-full accent-[var(--primary)]"
          />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span>Level {level.level} · {level.title}</span>
            <span className="text-muted-foreground">{level.toNext} XP to next</span>
          </div>
          <ProgressBar value={level.progress} label="XP level progress" />
        </div>
      </section>

      <section className="surface-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-display font-semibold">Signed in</h2>
          <p className="text-sm text-muted-foreground">You can sign back in any time — your progress is saved.</p>
        </div>
        <div className="flex items-center gap-2">
          <LevelBadge level={profile?.level_code ?? "A1"} />
          <Button variant="outline" className="gap-2" onClick={signOut}>
            <LogOut className="size-4" aria-hidden /> Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}
