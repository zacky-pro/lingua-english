import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Flame, LineChart, Zap } from "lucide-react";

import { PageHeader, ProgressBar, StatCard } from "@/components/lingua/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyActivity, useProfile, useSessionUser } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { LEVEL_META, xpLevel, type LevelCode } from "@/lib/lingua";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress — LINGUA" },
      { name: "description", content: "See your XP, streak, study minutes and skill balance week by week." },
      { property: "og:title", content: "Progress — LINGUA" },
      { property: "og:description", content: "Learning analytics for your English journey." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { data: profile } = useProfile();
  const { userId } = useSessionUser();
  const { data: activity, isLoading } = useDailyActivity(14);

  const { data: counts } = useQuery({
    queryKey: ["progress-counts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [lessons, words] = await Promise.all([
        supabase
          .from("lesson_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId!)
          .eq("status", "completed"),
        supabase.from("user_vocabulary").select("id", { count: "exact", head: true }).eq("user_id", userId!),
      ]);
      return { lessons: lessons.count ?? 0, words: words.count ?? 0 };
    },
  });

  const level = xpLevel(profile?.xp ?? 0);
  const rows = activity ?? [];
  const maxMinutes = Math.max(30, ...rows.map((r) => r.minutes));
  const totalMinutes = rows.reduce((sum, r) => sum + r.minutes, 0);
  const skills = {
    Speaking: rows.reduce((s, r) => s + r.speaking_minutes, 0),
    Listening: rows.reduce((s, r) => s + r.listening_minutes, 0),
    Vocabulary: rows.reduce((s, r) => s + r.words_reviewed, 0),
    Lessons: rows.reduce((s, r) => s + r.lessons_completed, 0),
  };
  const maxSkill = Math.max(1, ...Object.values(skills));
  const meta = LEVEL_META[(profile?.level_code ?? "A1") as LevelCode];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={LineChart}
        title="Your progress"
        description="Lihat perkembanganmu dalam dua minggu terakhir."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Zap} label="Total XP" value={profile?.xp ?? 0} hint={`Level ${level.level} · ${level.title}`} />
        <StatCard icon={Flame} label="Streak" value={`${profile?.streak_count ?? 0} days`} hint={`Best ${profile?.longest_streak ?? 0}`} />
        <StatCard icon={BookOpen} label="Lessons done" value={counts?.lessons ?? 0} hint="Completed lessons" />
        <StatCard icon={LineChart} label="Minutes (14d)" value={totalMinutes} hint={`${counts?.words ?? 0} words in deck`} />
      </div>

      <section className="surface-card p-5">
        <h2 className="font-display text-lg font-bold">Study minutes</h2>
        {isLoading ? (
          <Skeleton className="mt-4 h-40 rounded-xl" />
        ) : (
          <div className="mt-4 flex h-40 items-end gap-1.5">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet — finish a lesson to start your chart.</p>
            ) : (
              rows.map((r) => (
                <div key={r.activity_date} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md gradient-hero"
                    style={{ height: `${Math.max(4, (r.minutes / maxMinutes) * 100)}%` }}
                    title={`${r.activity_date}: ${r.minutes} min`}
                  />
                  <span className="text-[0.6rem] text-muted-foreground">{r.activity_date.slice(8)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <section className="surface-card space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">Skill balance</h2>
        {Object.entries(skills).map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{label}</span>
              <span className="text-muted-foreground">{value}</span>
            </div>
            <ProgressBar value={(value / maxSkill) * 100} label={label} />
          </div>
        ))}
      </section>

      <section className="surface-card p-5">
        <h2 className="font-display text-lg font-bold">Current level</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile?.level_code} — {meta?.name}. {meta?.blurb}
        </p>
        <div className="mt-3">
          <ProgressBar value={level.progress} label="Progress to next XP level" />
          <p className="mt-1 text-xs text-muted-foreground">
            {level.toNext} XP to level {level.level + 1}
          </p>
        </div>
      </section>
    </div>
  );
}
