import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Award, Lock } from "lucide-react";

import { CardSkeletonGrid, PageHeader, ProgressBar } from "@/components/lingua/primitives";
import { useSessionUser } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — LINGUA" },
      { name: "description", content: "Track badges for streaks, XP, lessons and words mastered on your English journey." },
      { property: "og:title", content: "Achievements — LINGUA" },
      { property: "og:description", content: "Unlock badges as your English improves." },
    ],
  }),
  component: AchievementsPage,
});

type Achievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  target: number;
};

function AchievementsPage() {
  const { userId } = useSessionUser();

  const { data, isLoading } = useQuery({
    queryKey: ["achievements", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [all, mine] = await Promise.all([
        supabase.from("achievements").select("*").order("sort_order"),
        supabase.from("user_achievements").select("*").eq("user_id", userId!),
      ]);
      if (all.error) throw all.error;
      if (mine.error) throw mine.error;
      const map = new Map(mine.data.map((r) => [r.achievement_id, r]));
      return (all.data as Achievement[]).map((a) => ({
        ...a,
        progress: map.get(a.id)?.progress ?? 0,
        unlocked: !!map.get(a.id)?.unlocked_at,
      }));
    },
  });

  const unlocked = data?.filter((a) => a.unlocked).length ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Award}
        title="Achievements"
        description={`Kamu sudah membuka ${unlocked} dari ${data?.length ?? 0} lencana.`}
      />
      {isLoading ? <CardSkeletonGrid count={8} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((a) => (
          <div
            key={a.id}
            className={cn("surface-card p-4", a.unlocked ? "ring-2 ring-warning" : "opacity-80")}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden>
                {a.unlocked ? a.icon : "🔒"}
              </span>
              <div>
                <h2 className="font-display font-semibold">{a.title}</h2>
                <p className="text-xs text-muted-foreground">{a.description}</p>
              </div>
              {!a.unlocked ? <Lock className="ml-auto size-4 text-muted-foreground" aria-hidden /> : null}
            </div>
            <div className="mt-3">
              <ProgressBar value={Math.min(100, (a.progress / a.target) * 100)} label={a.title} />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {Math.min(a.progress, a.target)} / {a.target}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
