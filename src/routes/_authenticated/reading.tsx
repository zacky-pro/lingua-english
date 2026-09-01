import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpenCheck } from "lucide-react";
import { useState } from "react";

import { AudioButton } from "@/components/lingua/AudioButton";
import { CardSkeletonGrid, LevelBadge, PageHeader } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { useAward } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reading")({
  head: () => ({
    meta: [
      { title: "Reading — LINGUA" },
      { name: "description", content: "Short English texts with glossary and comprehension questions for every level." },
      { property: "og:title", content: "Reading — LINGUA" },
      { property: "og:description", content: "Read short English passages with word help and questions." },
    ],
  }),
  component: ReadingPage,
});

type Passage = {
  id: string;
  title: string;
  level_code: string;
  body: string;
  glossary: { word: string; meaning: string }[];
  questions: { prompt: string; options: string[]; answer: string }[];
};

function PassageCard({ passage }: { passage: Passage }) {
  const award = useAward();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const questions = Array.isArray(passage.questions) ? passage.questions : [];
  const score = questions.filter((q, i) => answers[i] === q.answer).length;

  return (
    <article className="surface-card space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <LevelBadge level={passage.level_code} />
        <h2 className="font-display text-lg font-bold">{passage.title}</h2>
        <AudioButton text={passage.body} size="sm" label="Read aloud" className="ml-auto" />
      </div>

      <p className="text-[0.95rem] leading-relaxed">{passage.body}</p>

      <div className="flex flex-wrap gap-2">
        {(passage.glossary ?? []).map((g) => (
          <span key={g.word} className="rounded-full bg-muted px-3 py-1 text-xs">
            <strong>{g.word}</strong> — {g.meaning}
          </span>
        ))}
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        {questions.map((q, i) => (
          <div key={i}>
            <p className="text-sm font-medium">{q.prompt}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {q.options.map((opt) => {
                const selected = answers[i] === opt;
                const right = checked && opt === q.answer;
                const wrong = checked && selected && opt !== q.answer;
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
          </div>
        ))}
      </div>

      {!checked ? (
        <Button
          size="sm"
          onClick={() => {
            setChecked(true);
            const gained = questions.filter((q, i) => answers[i] === q.answer).length * 5;
            award.mutate({ xp: gained, minutes: 4, source: "reading" });
          }}
        >
          Check answers
        </Button>
      ) : (
        <p className="text-sm font-semibold text-primary">
          {score}/{questions.length} correct · +{score * 5} XP
        </p>
      )}
    </article>
  );
}

function ReadingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reading"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("reading_passages").select("*").order("sort_order");
      if (error) throw error;
      return data as unknown as Passage[];
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        icon={BookOpenCheck}
        title="Reading room"
        description="Teks pendek dengan bantuan kosakata, lalu pertanyaan pemahaman."
      />
      {isLoading ? <CardSkeletonGrid count={3} /> : null}
      <div className="space-y-4">{data?.map((p) => <PassageCard key={p.id} passage={p} />)}</div>
    </div>
  );
}
