import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Check, Eye, PartyPopper, X } from "lucide-react";
import { useState } from "react";

import { AudioButton } from "@/components/lingua/AudioButton";
import { EmptyState, PageHeader, ProgressBar } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAward, useProfile } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { scheduleReview, showIndonesian, type LevelCode } from "@/lib/lingua";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({
    meta: [
      { title: "Word Review — LINGUA" },
      { name: "description", content: "Spaced repetition review so the English words you learn actually stick." },
      { property: "og:title", content: "Word Review — LINGUA" },
      { property: "og:description", content: "Review your saved English words with spaced repetition flashcards." },
    ],
  }),
  component: ReviewPage,
});

type Card = {
  id: string;
  ease: number;
  interval_days: number;
  reps: number;
  lapses: number;
  vocabulary: {
    word: string;
    ipa: string | null;
    meaning_id: string;
    meaning_en: string | null;
    example: string | null;
  } | null;
};

function ReviewPage() {
  const qc = useQueryClient();
  const award = useAward();
  const { data: profile } = useProfile();
  const withID = showIndonesian((profile?.level_code ?? "A0") as LevelCode);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const { data: cards, isLoading } = useQuery({
    queryKey: ["review", "due"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const { data, error } = await supabase
        .from("user_vocabulary")
        .select("id,ease,interval_days,reps,lapses,vocabulary(word,ipa,meaning_id,meaning_en,example)")
        .eq("user_id", auth.user.id)
        .lte("due_at", new Date().toISOString())
        .order("due_at")
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as Card[];
    },
  });

  const card = cards?.[index];

  async function grade(quality: 0 | 1 | 2 | 3) {
    if (!card) return;
    const next = scheduleReview(quality, {
      ease: card.ease,
      interval_days: card.interval_days,
      reps: card.reps,
      lapses: card.lapses,
    });
    await supabase
      .from("user_vocabulary")
      .update({
        ease: next.ease,
        interval_days: next.interval_days,
        reps: next.reps,
        lapses: next.lapses,
        status: next.status,
        due_at: next.due_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", card.id);

    const good = quality >= 2;
    const nextCorrect = correct + (good ? 1 : 0);
    setCorrect(nextCorrect);
    setRevealed(false);

    if (index + 1 < (cards?.length ?? 0)) {
      setIndex(index + 1);
    } else {
      setDone(true);
      await award.mutateAsync({
        xp: (cards?.length ?? 0) * 3,
        minutes: Math.max(1, Math.round((cards?.length ?? 0) * 0.2)),
        words_reviewed: cards?.length ?? 0,
        source: "review",
      });
      qc.invalidateQueries({ queryKey: ["review", "due"] });
      qc.invalidateQueries({ queryKey: ["vocab", "due-count"] });
    }
  }

  if (isLoading) return <Skeleton className="h-72 rounded-2xl" />;

  if (done) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="surface-card animate-pop-in space-y-4 p-8 text-center">
          <PartyPopper className="mx-auto size-10 text-primary" aria-hidden />
          <h1 className="font-display text-2xl font-bold">Review finished!</h1>
          <p className="text-sm text-muted-foreground">
            {correct} of {cards?.length ?? 0} remembered · +{(cards?.length ?? 0) * 3} XP
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/vocabulary">Add more words</Link>
            </Button>
            <Button asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <EmptyState
        icon={Brain}
        title="Nothing to review right now"
        description="Semua kata sudah kamu ulang. Tambahkan kata baru dari bank kosakata."
        actionLabel="Go to vocabulary"
        actionTo="/vocabulary"
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader icon={Brain} title="Word review" description="Ingat artinya sebelum membuka jawaban." />
      <ProgressBar value={(index / (cards?.length ?? 1)) * 100} label="Review progress" />

      <div className="surface-card animate-pop-in space-y-5 p-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <h2 className="font-display text-3xl font-extrabold">{card.vocabulary?.word}</h2>
          <AudioButton text={card.vocabulary?.word ?? ""} label="Pronounce word" />
        </div>
        {card.vocabulary?.ipa ? (
          <p className="text-sm text-muted-foreground">{card.vocabulary.ipa}</p>
        ) : null}

        {revealed ? (
          <div className="space-y-2">
            <p className="font-display text-lg font-semibold text-primary">
              {withID ? card.vocabulary?.meaning_id : card.vocabulary?.meaning_en ?? card.vocabulary?.meaning_id}
            </p>
            {card.vocabulary?.example ? (
              <p className="text-sm italic text-muted-foreground">“{card.vocabulary.example}”</p>
            ) : null}
          </div>
        ) : (
          <Button variant="outline" className="gap-2" onClick={() => setRevealed(true)}>
            <Eye className="size-4" aria-hidden /> Show meaning
          </Button>
        )}
      </div>

      {revealed ? (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="destructive" className="gap-1.5" onClick={() => grade(0)}>
            <X className="size-4" aria-hidden /> Forgot
          </Button>
          <Button variant="secondary" onClick={() => grade(3)}>
            Hard
          </Button>
          <Button className="gap-1.5" onClick={() => grade(5)}>
            <Check className="size-4" aria-hidden /> Easy
          </Button>
        </div>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        Card {index + 1} of {cards?.length}
      </p>
    </div>
  );
}
