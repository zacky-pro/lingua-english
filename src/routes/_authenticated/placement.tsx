import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { LevelBadge, PageHeader, ProgressBar } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { useProfile, useUpdateProfile } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { LEVELS, type LevelCode } from "@/lib/lingua";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/placement")({
  head: () => ({
    meta: [
      { title: "Placement test — LINGUA" },
      { name: "description", content: "A short test that finds your English level from A0 to C2 in a few minutes." },
      { property: "og:title", content: "Placement test — LINGUA" },
      { property: "og:description", content: "Find the right starting point for your English." },
    ],
  }),
  component: PlacementPage,
});

type Question = { level: LevelCode; prompt: string; options: string[]; answer: string };

const QUESTIONS: Question[] = [
  { level: "A0", prompt: "Choose the greeting.", options: ["Hello", "Table", "Green", "Slowly"], answer: "Hello" },
  { level: "A0", prompt: "I ___ a student.", options: ["am", "is", "are", "be"], answer: "am" },
  { level: "A1", prompt: "She ___ coffee every morning.", options: ["drink", "drinks", "drinking", "drank"], answer: "drinks" },
  { level: "A1", prompt: "Where ___ you from?", options: ["is", "are", "do", "does"], answer: "are" },
  { level: "A2", prompt: "Yesterday I ___ to the market.", options: ["go", "goes", "went", "gone"], answer: "went" },
  { level: "A2", prompt: "This book is ___ than that one.", options: ["interesting", "more interesting", "most interesting", "interestinger"], answer: "more interesting" },
  { level: "B1", prompt: "I have lived here ___ 2019.", options: ["for", "since", "from", "during"], answer: "since" },
  { level: "B1", prompt: "If it rains, we ___ inside.", options: ["stay", "will stay", "stayed", "would stay"], answer: "will stay" },
  { level: "B2", prompt: "The report ___ by the team last week.", options: ["was completed", "completed", "has complete", "is completing"], answer: "was completed" },
  { level: "B2", prompt: "She suggested ___ earlier.", options: ["to leave", "leaving", "leave", "left"], answer: "leaving" },
  { level: "C1", prompt: "Had I known, I ___ differently.", options: ["would act", "would have acted", "will act", "acted"], answer: "would have acted" },
  { level: "C1", prompt: "His argument was ___ at best.", options: ["tenuous", "tense", "tender", "tentative"], answer: "tenuous" },
];

function decideLevel(correctByLevel: Record<string, number>): LevelCode {
  let best: LevelCode = "A0";
  for (const level of LEVELS) {
    const asked = QUESTIONS.filter((q) => q.level === level).length;
    if (!asked) continue;
    if ((correctByLevel[level] ?? 0) >= Math.ceil(asked / 2)) best = level;
    else break;
  }
  return best;
}

function PlacementPage() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<LevelCode | null>(null);

  const question = QUESTIONS[index]!;

  const finish = useMutation({
    mutationFn: async (all: string[]) => {
      const breakdown: Record<string, number> = {};
      let score = 0;
      QUESTIONS.forEach((q, i) => {
        if (all[i] === q.answer) {
          score += 1;
          breakdown[q.level] = (breakdown[q.level] ?? 0) + 1;
        }
      });
      const level = decideLevel(breakdown);
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        await supabase.from("placement_results").insert({
          user_id: auth.user.id,
          level_code: level,
          score,
          total: QUESTIONS.length,
          breakdown,
        });
      }
      await update.mutateAsync({ level_code: level });
      return level;
    },
    onSuccess: setResult,
    onError: () => toast.error("Could not save your result. Please try again."),
  });

  function choose(option: string) {
    const all = [...answers, option];
    setAnswers(all);
    if (index + 1 < QUESTIONS.length) setIndex(index + 1);
    else finish.mutate(all);
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg space-y-5 text-center">
        <div className="surface-card animate-pop-in space-y-4 p-8">
          <p className="text-sm text-muted-foreground">Your English level is</p>
          <p className="font-display text-6xl font-extrabold text-primary">{result}</p>
          <LevelBadge level={result} className="mx-auto" />
          <p className="text-sm text-muted-foreground">
            We've set your course to start at {result}. You can change this any time in your profile.
          </p>
          <Button onClick={() => navigate({ to: "/learn" })}>Start learning</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        icon={Compass}
        title="Placement test"
        description="12 pertanyaan singkat untuk menemukan level bahasa Inggrismu."
      />

      <ProgressBar value={(index / QUESTIONS.length) * 100} label="Test progress" />
      <p className="text-xs text-muted-foreground">
        Question {index + 1} of {QUESTIONS.length} · current level {profile?.level_code}
      </p>

      <div className="surface-card space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">{question.prompt}</h2>
        <div className="grid gap-2">
          {question.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => choose(opt)}
              disabled={finish.isPending}
              className={cn(
                "rounded-xl border border-border px-4 py-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary-soft",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
