import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, PenLine, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { LevelBadge, PageHeader } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAward, useProfile } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { writingFeedback } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/writing")({
  head: () => ({
    meta: [
      { title: "Writing — LINGUA" },
      { name: "description", content: "Write in English and get instant, kind corrections that explain every fix." },
      { property: "og:title", content: "Writing — LINGUA" },
      { property: "og:description", content: "Practice English writing with instant AI feedback and corrections." },
    ],
  }),
  component: WritingPage,
});

type Prompt = {
  id: string;
  title: string;
  level_code: string;
  prompt: string;
  guidance: string | null;
  min_words: number;
};

type Feedback = {
  scores: {
    grammar: number;
    vocabulary: number;
    structure: number;
    clarity: number;
    naturalness: number;
  };
  improved: string;
  explanations: string[];
  encouragement: string;
};

function WritingPage() {
  const { data: profile } = useProfile();
  const award = useAward();
  const getFeedback = useServerFn(writingFeedback);
  const [selected, setSelected] = useState<Prompt | null>(null);
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["writing-prompts"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("writing_prompts").select("*").order("sort_order");
      if (error) throw error;
      return data as Prompt[];
    },
  });

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const submit = useMutation({
    mutationFn: async () => {
      const result = (await getFeedback({
        data: { text, prompt: selected?.prompt ?? "Free writing", level: profile?.level_code ?? "A1" },
      })) as Feedback;
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        await supabase.from("writing_submissions").insert({
          user_id: auth.user.id,
          prompt_id: selected?.id ?? null,
          prompt_text: selected?.prompt ?? "Free writing",
          content: text,
          feedback: result,
        });
      }
      await award.mutateAsync({ xp: 20, minutes: 6, source: "writing" });
      return result;
    },
    onSuccess: (result) => setFeedback(result),
    onError: () => toast.error("Feedback is unavailable right now. Please try again in a moment."),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        icon={PenLine}
        title="Writing studio"
        description="Tulis dalam bahasa Inggris, lalu dapatkan koreksi dengan penjelasan kenapa salah."
      />

      {isLoading ? <Skeleton className="h-24 rounded-2xl" /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {prompts?.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setSelected(p);
              setFeedback(null);
              setText("");
            }}
            className={cn(
              "surface-card p-4 text-left transition-shadow hover:shadow-lift",
              selected?.id === p.id && "ring-2 ring-primary",
            )}
          >
            <div className="flex items-center gap-2">
              <LevelBadge level={p.level_code} />
              <span className="font-display font-semibold">{p.title}</span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{p.prompt}</p>
            <p className="mt-2 text-xs text-muted-foreground">Min {p.min_words} words</p>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="surface-card animate-pop-in space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">{selected.title}</h2>
          <p className="text-sm text-muted-foreground">{selected.guidance}</p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            aria-label="Your writing"
            placeholder="Write your answer in English…"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={cn("text-xs", words < selected.min_words ? "text-muted-foreground" : "text-success")}>
              {words} / {selected.min_words} words
            </span>
            <Button
              onClick={() => submit.mutate()}
              disabled={submit.isPending || words < 5}
              className="gap-2"
            >
              {submit.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-4" aria-hidden />
              )}
              Get feedback
            </Button>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <div className="surface-card animate-pop-in space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Object.entries(feedback.scores).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-muted/60 p-3 text-center">
                <p className="font-display text-2xl font-extrabold text-primary">{value}</p>
                <p className="text-xs capitalize text-muted-foreground">{key}</p>
              </div>
            ))}
          </div>
          <div>
            <h3 className="text-sm font-semibold">Improved version</h3>
            <p className="mt-1 rounded-xl bg-success-soft p-3 text-sm text-success">{feedback.improved}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">What changed and why</h3>
            <ul className="mt-2 space-y-2">
              {feedback.explanations.map((e, i) => (
                <li key={i} className="rounded-xl bg-muted/60 p-3 text-sm">
                  {e}
                </li>
              ))}
            </ul>
          </div>
          <p className="rounded-xl bg-primary-soft p-3 text-sm text-primary">💡 {feedback.encouragement}</p>
        </div>
      ) : null}
    </div>
  );
}
