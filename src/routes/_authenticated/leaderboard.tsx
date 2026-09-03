import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { EmptyState, LevelBadge, PageHeader } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useSessionUser, useUpdateProfile } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — LINGUA" },
      { name: "description", content: "See how your XP compares with other learners this season." },
      { property: "og:title", content: "Leaderboard — LINGUA" },
      { property: "og:description", content: "Friendly competition to keep your English streak alive." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { data: profile } = useProfile();
  const { userId } = useSessionUser();
  const update = useUpdateProfile();
  const optedIn = profile?.leaderboard_opt_in ?? false;

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    enabled: optedIn,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_emoji, xp, streak_count, level_code")
        .eq("leaderboard_opt_in", true)
        .order("xp", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Sparkles}
        title="Leaderboard"
        description="Bandingkan XP-mu dengan pelajar lain. Kamu bisa keluar kapan saja."
      />

      {!optedIn ? (
        <EmptyState
          icon={Sparkles}
          title="Join the leaderboard"
          description="Share only your nickname, avatar and XP with other learners."
          actionLabel="Join leaderboard"
          onAction={() => update.mutate({ leaderboard_opt_in: true })}
        />
      ) : (
        <>
          {isLoading ? <Skeleton className="h-64 rounded-2xl" /> : null}
          <ol className="surface-card divide-y divide-border p-2">
            {data?.map((row, i) => (
              <li
                key={row.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5",
                  row.id === userId && "bg-primary-soft",
                )}
              >
                <span className="w-6 text-center font-display text-sm font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="grid size-9 place-items-center rounded-full bg-muted text-lg" aria-hidden>
                  {row.avatar_emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{row.display_name}</span>
                  <span className="text-xs text-muted-foreground">🔥 {row.streak_count} day streak</span>
                </span>
                <LevelBadge level={row.level_code} />
                <span className="font-display text-sm font-bold text-primary">{row.xp} XP</span>
              </li>
            ))}
          </ol>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update.mutate({ leaderboard_opt_in: false })}
            disabled={update.isPending}
          >
            Leave the leaderboard
          </Button>
        </>
      )}
    </div>
  );
}
