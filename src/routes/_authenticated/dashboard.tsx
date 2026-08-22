import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Circle,
  Flame,
  Headphones,
  MessageCircle,
  Mic,
  PenLine,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useEffect, useMemo } from "react";

import { LevelBadge, ProgressBar, SectionTitle, StatCard } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurriculum, useDueVocabularyCount, useLessonProgress } from "@/hooks/useCurriculum";
import { useDailyActivity, useProfile } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { greeting, immersion, LEVEL_META, todayISO, xpLevel, type LevelCode } from "@/lib/lingua";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LINGUA" },
      { name: "description", content: "Your English learning home: streak, XP, daily plan and next lesson." },
      { property: "og:title", content: "Dashboard — LINGUA" },
      { property: "og:description", content: "Track your streak, XP and today's English learning plan." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const { data: curriculum } = useCurriculum();
  const { data: progress } = useLessonProgress();
  const { data: due } = useDueVocabularyCount();
  const { data: activity } = useDailyActivity(7);

  useEffect(() => {
    if (profile && !profile.onboarded) navigate({ to: "/onboarding" });
  }, [profile, navigate]);

  const { data: recentAchievements } = useQuery({
    queryKey: ["achievements", "recent"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const { data } = await supabase
        .from("user_achievements")
        .select("unlocked_at, achievements(title, icon)")
        .eq("user_id", auth.user.id)
        .not("unlocked_at", "is", null)
        .order("unlocked_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const level = (profile?.level_code ?? "A0") as LevelCode;
  const course = curriculum?.find((c) => c.level_code === level);
  const lessons = useMemo(() => course?.modules.flatMap((m) => m.lessons) ?? [], [course]);
  const completed = lessons.filter((l) => progress?.[l.id]?.status === "completed").length;
  const coursePercent = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;
  const nextLesson = lessons.find((l) => progress?.[l.id]?.status !== "completed") ?? lessons[0];

  const today = activity?.find((a) => a.activity_date === todayISO());
  const goal = profile?.daily_goal_minutes ?? 15;
  const minutes = today?.minutes ?? 0;
  const goalPercent = Math.min(100, Math.round((minutes / goal) * 100));
  const xpInfo = xpLevel(profile?.xp ?? 0);

  const plan = [
    { label: "10 new words", to: "/vocabulary", done: (today?.words_reviewed ?? 0) >= 10, icon: BookOpen },
    { label: "Today's lesson", to: "/learn", done: (today?.lessons_completed ?? 0) > 0, icon: Sparkles },
    { label: "Listening practice", to: "/listening", done: (today?.listening_minutes ?? 0) > 0, icon: Headphones },
    { label: "Speaking practice", to: "/speaking", done: (today?.speaking_minutes ?? 0) > 0, icon: Mic },
    { label: "Real Talk conversation", to: "/conversation", done: false, icon: MessageCircle },
    { label: "Review your words", to: "/review", done: (due ?? 0) === 0, icon: Brain },
  ] as const;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="gradient-hero animate-rise overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-glow sm:p-8">
        <p className="text-sm opacity-90">{greeting(profile?.display_name ?? "friend")} 👋</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
          Ready for your next {goal} minutes of English?
        </h1>
        <p className="mt-2 max-w-lg text-sm text-primary-foreground/85">
          {LEVEL_META[level].can} · {immersion(level).label}
        </p>

        <div className="mt-6 max-w-md">
          <div className="mb-1.5 flex items-center justify-between text-sm font-medium">
            <span>Level {level}</span>
            <span>{coursePercent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary-foreground/25">
            <div
              className="h-full rounded-full bg-primary-foreground transition-[width] duration-700"
              style={{ width: `${coursePercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-primary-foreground/80">
            Next milestone: <strong>{nextLesson?.title ?? "Choose a lesson"}</strong>
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button size="lg" variant="secondary" asChild className="gap-2">
            <Link to={nextLesson ? "/learn/$slug" : "/learn"} params={{ slug: nextLesson?.slug ?? "" }}>
              Continue Learning <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button size="lg" variant="ghost" asChild className="border border-primary-foreground/30">
            <Link to="/placement">Take placement test</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Flame} tone="warning" label="Streak" value={`${profile?.streak_count ?? 0} days`} hint="Keep it going" />
        <StatCard icon={Zap} label="Total XP" value={profile?.xp ?? 0} hint={`Lv ${xpInfo.level} · ${xpInfo.title}`} />
        <StatCard icon={Target} tone="success" label="Today's goal" value={`${minutes} / ${goal} min`} hint={`${goalPercent}% complete`} />
        <StatCard icon={BookOpen} tone="violet" label="Words to review" value={due ?? 0} hint="Spaced repetition" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle
            action={
              <span className="text-sm text-muted-foreground">
                {plan.filter((p) => p.done).length}/{plan.length} done
              </span>
            }
          >
            Today's plan
          </SectionTitle>
          <div className="surface-card divide-y divide-border">
            {plan.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-muted/60"
              >
                {item.done ? (
                  <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className={item.done ? "text-muted-foreground line-through" : "font-medium"}>
                  {item.label}
                </span>
                <item.icon className="ml-auto size-4 text-muted-foreground" aria-hidden />
              </Link>
            ))}
          </div>

          <div className="mt-6">
            <SectionTitle action={<Link to="/learn" className="text-sm text-primary hover:underline">See path</Link>}>
              Recommended next
            </SectionTitle>
            {nextLesson ? (
              <Link
                to="/learn/$slug"
                params={{ slug: nextLesson.slug }}
                className="surface-card flex items-center gap-4 p-4 transition-shadow hover:shadow-lift"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Sparkles className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <LevelBadge level={nextLesson.level_code} />
                    <span className="text-xs capitalize text-muted-foreground">{nextLesson.skill}</span>
                  </span>
                  <span className="mt-1 block font-display font-semibold">{nextLesson.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {nextLesson.objective ?? "Start learning"}
                  </span>
                </span>
                <span className="text-sm font-semibold text-primary">+{nextLesson.xp_reward} XP</span>
              </Link>
            ) : (
              <div className="surface-card p-6 text-sm text-muted-foreground">
                Your path is loading — start with the vocabulary trainer meanwhile.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <SectionTitle>This week</SectionTitle>
            <div className="surface-card p-4">
              <div className="flex items-end justify-between gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10);
                  const day = activity?.find((a) => a.activity_date === date);
                  const height = Math.min(100, ((day?.minutes ?? 0) / Math.max(goal, 1)) * 100);
                  return (
                    <div key={date} className="flex flex-1 flex-col items-center gap-1.5">
                      <div className="flex h-24 w-full items-end rounded-lg bg-muted">
                        <div
                          className="w-full rounded-lg gradient-hero transition-[height] duration-700"
                          style={{ height: `${Math.max(4, height)}%` }}
                        />
                      </div>
                      <span className="text-[0.65rem] text-muted-foreground">
                        {new Date(date).toLocaleDateString("en", { weekday: "short" })[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <ProgressBar value={goalPercent} className="mt-4" tone="success" label="Daily goal" />
              <p className="mt-2 text-xs text-muted-foreground">
                {minutes} of {goal} minutes today
              </p>
            </div>
          </div>

          <div>
            <SectionTitle action={<Link to="/achievements" className="text-sm text-primary hover:underline">All</Link>}>
              Recent achievements
            </SectionTitle>
            <div className="surface-card p-4">
              {recentAchievements?.length ? (
                <ul className="space-y-3">
                  {recentAchievements.map((a, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-xl">{(a.achievements as { icon?: string })?.icon ?? "🏆"}</span>
                      <span className="font-medium">{(a.achievements as { title?: string })?.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Trophy className="size-5 shrink-0" aria-hidden />
                  Finish your first lesson to unlock your first achievement.
                </div>
              )}
            </div>
          </div>

          <div>
            <SectionTitle>Quick practice</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {[
                { to: "/review", label: "Review words", icon: Brain },
                { to: "/speaking", label: "Speaking", icon: Mic },
                { to: "/conversation", label: "Real Talk", icon: MessageCircle },
                { to: "/writing", label: "Writing", icon: PenLine },
              ].map((q) => (
                <Link
                  key={q.to}
                  to={q.to}
                  className="surface-card flex flex-col gap-2 p-4 text-sm font-medium transition-shadow hover:shadow-lift"
                >
                  <q.icon className="size-5 text-primary" aria-hidden />
                  {q.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
