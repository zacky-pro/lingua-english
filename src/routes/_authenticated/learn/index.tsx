import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";

import { CardSkeletonGrid, LevelBadge, PageHeader, ProgressBar } from "@/components/lingua/primitives";
import { useCurriculum, useLessonProgress } from "@/hooks/useCurriculum";
import { useProfile } from "@/hooks/useLingua";
import { LEVELS, LEVEL_META, type LevelCode } from "@/lib/lingua";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/learn/")({
  head: () => ({
    meta: [
      { title: "Learning Path — LINGUA" },
      { name: "description", content: "Your structured English course from A0 to C2, module by module." },
      { property: "og:title", content: "Learning Path — LINGUA" },
      { property: "og:description", content: "Follow a structured English course from absolute beginner to mastery." },
    ],
  }),
  component: LearnMap,
});

function LearnMap() {
  const { data: profile } = useProfile();
  const { data: curriculum, isLoading } = useCurriculum();
  const { data: progress } = useLessonProgress();

  const level = (profile?.level_code ?? "A0") as LevelCode;
  const unlockedIndex = LEVELS.indexOf(level);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your learning path"
        description="Setiap level membuka kemampuan baru. Selesaikan pelajaran secara berurutan untuk hasil terbaik."
      />

      {isLoading ? <CardSkeletonGrid count={3} height={200} /> : null}

      {curriculum?.map((course) => {
        const lessons = course.modules.flatMap((m) => m.lessons);
        const done = lessons.filter((l) => progress?.[l.id]?.status === "completed").length;
        const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
        const courseLevel = course.level_code as LevelCode;
        const locked = LEVELS.indexOf(courseLevel) > unlockedIndex + 1;

        return (
          <section key={course.id} className={cn("surface-card p-5", locked && "opacity-70")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <LevelBadge level={course.level_code} />
                  <h2 className="font-display text-xl font-bold">{course.title}</h2>
                  {locked ? <Lock className="size-4 text-muted-foreground" aria-hidden /> : null}
                </div>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {course.description ?? LEVEL_META[courseLevel]?.can}
                </p>
              </div>
              <div className="min-w-[10rem]">
                <ProgressBar value={percent} label={`${course.title} progress`} />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {done}/{lessons.length} lessons
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {course.modules.map((module) => (
                <div key={module.id}>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <span aria-hidden>{module.icon ?? "📘"}</span>
                    {module.title}
                  </h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {module.lessons.map((lesson) => {
                      const state = progress?.[lesson.id]?.status;
                      return (
                        <li key={lesson.id}>
                          <Link
                            to="/learn/$slug"
                            params={{ slug: lesson.slug }}
                            className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm transition-all hover:border-primary/50 hover:bg-muted/60"
                          >
                            {state === "completed" ? (
                              <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
                            ) : state === "in_progress" ? (
                              <PlayCircle className="size-5 shrink-0 text-primary" aria-hidden />
                            ) : (
                              <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{lesson.title}</span>
                              <span className="block truncate text-xs capitalize text-muted-foreground">
                                {lesson.skill} · {lesson.estimated_minutes} min
                              </span>
                            </span>
                            <span className="shrink-0 text-xs font-semibold text-primary">
                              +{lesson.xp_reward}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {course.modules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Lessons for this level are coming soon.</p>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
