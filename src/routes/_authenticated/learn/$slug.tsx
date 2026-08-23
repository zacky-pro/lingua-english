import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, PartyPopper, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { AudioButton } from "@/components/lingua/AudioButton";
import { ExerciseView, type Exercise } from "@/components/lingua/ExerciseRunner";
import { LevelBadge, ProgressBar } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAward, useProfile } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { showIndonesian, type LevelCode } from "@/lib/lingua";

export const Route = createFileRoute("/_authenticated/learn/$slug")({
  component: LessonPlayer,
});

type TeachItem = { en: string; id?: string };

function LessonPlayer() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const award = useAward();
  const [phase, setPhase] = useState<"teach" | "practice" | "done">("teach");
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["lesson", slug],
    queryFn: async () => {
      const { data: lesson, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      const { data: exercises } = await supabase
        .from("exercises")
        .select("*")
        .eq("lesson_id", lesson.id)
        .order("sort_order");
      return { lesson, exercises: (exercises ?? []) as Exercise[] };
    },
  });

  const level = (profile?.level_code ?? "A0") as LevelCode;
  const withID = showIndonesian(level);
  const teach = useMemo<TeachItem[]>(
    () => (Array.isArray(data?.lesson.teach) ? (data.lesson.teach as TeachItem[]) : []),
    [data],
  );
  const exercises = data?.exercises ?? [];

  async function finish(finalCorrect: number) {
    if (saved || !data) return;
    setSaved(true);
    const accuracy = exercises.length ? Math.round((finalCorrect / exercises.length) * 100) : 100;
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    const xp = Math.max(5, Math.round((data.lesson.xp_reward * accuracy) / 100));
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      await supabase.from("lesson_progress").upsert(
        {
          user_id: auth.user.id,
          lesson_id: data.lesson.id,
          status: "completed",
          accuracy,
          xp_earned: xp,
          seconds_spent: seconds,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      );
      await supabase.from("quiz_attempts").insert({
        user_id: auth.user.id,
        lesson_id: data.lesson.id,
        kind: "lesson",
        score: finalCorrect,
        total: exercises.length,
        details: {},
      });
    }
    await award.mutateAsync({
      xp,
      minutes: Math.max(1, Math.round(seconds / 60)),
      lessons_completed: 1,
      listening_minutes: data.lesson.skill === "listening" ? Math.max(1, Math.round(seconds / 60)) : 0,
      source: `lesson:${data.lesson.slug}`,
    });
  }

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-10 w-1/2 rounded-lg" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const lesson = data.lesson;
  const accuracy = exercises.length ? Math.round((correct / exercises.length) * 100) : 100;
  const xpEarned = Math.max(5, Math.round((lesson.xp_reward * accuracy) / 100));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link to="/learn">
            <ArrowLeft className="size-4" aria-hidden /> Path
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <LevelBadge level={lesson.level_code} />
          <span className="text-xs capitalize text-muted-foreground">{lesson.skill}</span>
        </div>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold">{lesson.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {withID && lesson.objective_id ? lesson.objective_id : lesson.objective}
        </p>
      </div>

      {phase === "teach" ? (
        <div className="surface-card animate-pop-in space-y-4 p-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" aria-hidden /> Learn first
          </span>
          <ul className="space-y-3">
            {teach.map((item, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl bg-muted/60 p-3">
                <AudioButton text={item.en} label={`Play "${item.en}"`} />
                <span>
                  <span className="block font-medium">{item.en}</span>
                  {withID && item.id ? (
                    <span className="block text-sm text-muted-foreground">{item.id}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          <Button
            className="w-full gap-2"
            onClick={() => setPhase(exercises.length ? "practice" : "done")}
          >
            {exercises.length ? "Start practice" : "Finish lesson"}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      ) : null}

      {phase === "practice" && exercises[index] ? (
        <>
          <ProgressBar value={((index) / exercises.length) * 100} label="Lesson progress" />
          <ExerciseView
            key={exercises[index].id}
            exercise={exercises[index]}
            index={index}
            total={exercises.length}
            showIndonesian={withID}
            onResult={(ok) => {
              const nextCorrect = correct + (ok ? 1 : 0);
              setCorrect(nextCorrect);
              if (index + 1 < exercises.length) setIndex(index + 1);
              else {
                setPhase("done");
                void finish(nextCorrect);
              }
            }}
          />
        </>
      ) : null}

      {phase === "done" ? (
        <div className="surface-card animate-pop-in space-y-4 p-6 text-center">
          <PartyPopper className="mx-auto size-10 text-primary" aria-hidden />
          <h2 className="font-display text-2xl font-bold">Lesson complete!</h2>
          <p className="text-sm text-muted-foreground">
            You got {correct} of {exercises.length} right — {accuracy}% accuracy.
          </p>
          <div className="mx-auto flex max-w-xs items-center justify-center gap-6">
            <div>
              <p className="animate-xp font-display text-3xl font-extrabold text-primary">+{xpEarned}</p>
              <p className="text-xs text-muted-foreground">XP earned</p>
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold text-success">{accuracy}%</p>
              <p className="text-xs text-muted-foreground">accuracy</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                setIndex(0);
                setCorrect(0);
                setPhase("teach");
              }}
            >
              <RotateCcw className="size-4" aria-hidden /> Practice again
            </Button>
            <Button className="gap-1.5" onClick={() => navigate({ to: "/learn" })}>
              Next lesson <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
