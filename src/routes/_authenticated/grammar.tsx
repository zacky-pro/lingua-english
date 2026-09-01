import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, SpellCheck, X } from "lucide-react";
import { useState } from "react";

import { AudioButton } from "@/components/lingua/AudioButton";
import { CardSkeletonGrid, LevelBadge, PageHeader } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { useAward, useProfile } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { showIndonesian, type LevelCode } from "@/lib/lingua";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/grammar")({
  head: () => ({
    meta: [
      { title: "Grammar — LINGUA" },
      { name: "description", content: "English grammar explained simply, with examples and quick practice." },
      { property: "og:title", content: "Grammar — LINGUA" },
      { property: "og:description", content: "Clear English grammar guides with examples and instant practice." },
    ],
  }),
  component: GrammarPage,
});

type Topic = {
  id: string;
  slug: string;
  title: string;
  level_code: string;
  summary: string;
  summary_id: string | null;
  explanation: string[];
  examples: { en: string; id?: string }[];
  exercises: { prompt: string; options: string[]; answer: string; explanation?: string }[];
};

function TopicCard({ topic, withID }: { topic: Topic; withID: boolean }) {
  const award = useAward();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);

  const exercises = Array.isArray(topic.exercises) ? topic.exercises : [];
  const score = exercises.filter((ex, i) => answers[i] === ex.answer).length;

  return (
    <article className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <LevelBadge level={topic.level_code} />
            <h2 className="font-display text-lg font-bold">{topic.title}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {withID && topic.summary_id ? topic.summary_id : topic.summary}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Learn"}
        </Button>
      </div>

      {open ? (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <ul className="space-y-1.5 text-sm">
            {(topic.explanation ?? []).map((line, i) => (
              <li key={i} className="rounded-lg bg-muted/60 px-3 py-2 font-medium">
                {line}
              </li>
            ))}
          </ul>

          <ul className="space-y-2">
            {(topic.examples ?? []).map((ex, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <AudioButton text={ex.en} label={`Play example ${i + 1}`} />
                <span>
                  <span className="block">{ex.en}</span>
                  {withID && ex.id ? <span className="block text-muted-foreground">{ex.id}</span> : null}
                </span>
              </li>
            ))}
          </ul>

          {exercises.length ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Quick practice</h3>
              {exercises.map((ex, i) => (
                <div key={i}>
                  <p className="text-sm font-medium">{ex.prompt}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ex.options.map((opt) => {
                      const selected = answers[i] === opt;
                      const right = checked && opt === ex.answer;
                      const wrong = checked && selected && opt !== ex.answer;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => !checked && setAnswers((a) => ({ ...a, [i]: opt }))}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                            selected && !checked && "border-primary bg-primary-soft text-primary",
                            right && "border-success bg-success-soft text-success",
                            wrong && "border-destructive bg-destructive/10 text-destructive",
                            !selected && !checked && "border-border hover:bg-muted",
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {checked && ex.explanation ? (
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                      {answers[i] === ex.answer ? (
                        <Check className="size-3.5 text-success" aria-hidden />
                      ) : (
                        <X className="size-3.5 text-destructive" aria-hidden />
                      )}
                      {ex.explanation}
                    </p>
                  ) : null}
                </div>
              ))}
              {!checked ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setChecked(true);
                    const gained = exercises.filter((ex, i) => answers[i] === ex.answer).length * 4;
                    if (gained) award.mutate({ xp: gained, minutes: 2, source: `grammar:${topic.slug}` });
                  }}
                >
                  Check answers
                </Button>
              ) : (
                <p className="text-sm font-semibold text-primary">
                  {score}/{exercises.length} correct · +{score * 4} XP
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function GrammarPage() {
  const { data: profile } = useProfile();
  const withID = showIndonesian((profile?.level_code ?? "A0") as LevelCode);
  const { data, isLoading } = useQuery({
    queryKey: ["grammar"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("grammar_topics").select("*").order("sort_order");
      if (error) throw error;
      return data as unknown as Topic[];
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        icon={SpellCheck}
        title="Grammar guides"
        description="Penjelasan sederhana, contoh nyata, lalu latihan singkat untuk setiap topik."
      />
      {isLoading ? <CardSkeletonGrid count={4} /> : null}
      <div className="space-y-4">
        {data?.map((topic) => <TopicCard key={topic.id} topic={topic} withID={withID} />)}
      </div>
    </div>
  );
}
