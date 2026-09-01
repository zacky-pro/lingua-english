import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Headphones } from "lucide-react";
import { useState } from "react";

import { AudioButton } from "@/components/lingua/AudioButton";
import { CardSkeletonGrid, LevelBadge, PageHeader } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAward } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { answersMatch } from "@/lib/lingua";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/listening")({
  head: () => ({
    meta: [
      { title: "Listening — LINGUA" },
      { name: "description", content: "Train your ear with English audio, transcripts and comprehension questions." },
      { property: "og:title", content: "Listening — LINGUA" },
      { property: "og:description", content: "English listening practice with slow audio, transcript and translation." },
    ],
  }),
  component: ListeningPage,
});

type Question = { prompt: string; options?: string[]; answer: string };
type Item = {
  id: string;
  title: string;
  level_code: string;
  transcript: string;
  translation: string | null;
  questions: Question[];
};

function ListeningCard({ item }: { item: Item }) {
  const award = useAward();
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);

  const questions = Array.isArray(item.questions) ? item.questions : [];
  const score = questions.filter((q, i) => answersMatch(answers[i] ?? "", q.answer)).length;

  return (
    <article className="surface-card space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <LevelBadge level={item.level_code} />
          <h2 className="font-display text-lg font-bold">{item.title}</h2>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AudioButton text={item.transcript} size="sm" label="Play audio" />
        <AudioButton text={item.transcript} slow size="sm" label="Play slowly" />
        <Button variant="ghost" size="sm" onClick={() => setShowTranscript((v) => !v)}>
          {showTranscript ? "Hide transcript" : "Show transcript"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowTranslation((v) => !v)}>
          {showTranslation ? "Hide translation" : "Terjemahan"}
        </Button>
      </div>

      {showTranscript ? (
        <p className="rounded-xl bg-muted/60 p-3 text-sm">{item.transcript}</p>
      ) : null}
      {showTranslation && item.translation ? (
        <p className="rounded-xl bg-primary-soft p-3 text-sm text-primary">{item.translation}</p>
      ) : null}

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i}>
            <p className="text-sm font-medium">{q.prompt}</p>
            {q.options ? (
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
            ) : (
              <Input
                className="mt-2"
                value={answers[i] ?? ""}
                disabled={checked}
                aria-label={q.prompt}
                onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                placeholder="Type your answer…"
              />
            )}
          </div>
        ))}
      </div>

      {!checked ? (
        <Button
          size="sm"
          onClick={() => {
            setChecked(true);
            const gained =
              questions.filter((q, i) => answersMatch(answers[i] ?? "", q.answer)).length * 5;
            award.mutate({ xp: gained, minutes: 3, listening_minutes: 3, source: "listening" });
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

function ListeningPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["listening"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("listening_exercises").select("*").order("sort_order");
      if (error) throw error;
      return data as unknown as Item[];
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Headphones}
        title="Listening lab"
        description="Dengarkan, jawab pertanyaan, lalu cek transkrip. Bisa diputar pelan kalau terlalu cepat."
      />
      {isLoading ? <CardSkeletonGrid count={3} /> : null}
      <div className="space-y-4">{data?.map((item) => <ListeningCard key={item.id} item={item} />)}</div>
    </div>
  );
}
