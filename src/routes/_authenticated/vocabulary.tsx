import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Brain, Heart, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AudioButton } from "@/components/lingua/AudioButton";
import { CardSkeletonGrid, LevelBadge, PageHeader, StatCard } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { VOCAB_CATEGORIES, showIndonesian, type LevelCode } from "@/lib/lingua";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/vocabulary")({
  head: () => ({
    meta: [
      { title: "Vocabulary — LINGUA" },
      { name: "description", content: "Build your English word bank with pronunciation, meaning and examples." },
      { property: "og:title", content: "Vocabulary — LINGUA" },
      { property: "og:description", content: "Learn and save English words with audio, meanings and examples." },
    ],
  }),
  component: VocabularyPage,
});

type Word = {
  id: string;
  word: string;
  ipa: string | null;
  word_type: string | null;
  meaning_id: string;
  meaning_en: string | null;
  example: string | null;
  example_id: string | null;
  category: string;
  level_code: string;
};

function VocabularyPage() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const withID = showIndonesian((profile?.level_code ?? "A0") as LevelCode);

  const { data: words, isLoading } = useQuery({
    queryKey: ["vocabulary"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("vocabulary").select("*").order("word");
      if (error) throw error;
      return data as Word[];
    },
  });

  const { data: mine } = useQuery({
    queryKey: ["user-vocabulary"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const { data } = await supabase
        .from("user_vocabulary")
        .select("id,vocabulary_id,status,favorite,due_at")
        .eq("user_id", auth.user.id);
      return data ?? [];
    },
  });

  const saved = useMemo(
    () => new Map((mine ?? []).map((m) => [m.vocabulary_id, m])),
    [mine],
  );

  const addWord = useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite?: boolean }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const existing = saved.get(id);
      if (existing) {
        await supabase
          .from("user_vocabulary")
          .update({ favorite: favorite ?? !existing.favorite })
          .eq("id", existing.id);
        return "updated" as const;
      }
      await supabase.from("user_vocabulary").insert({
        user_id: auth.user.id,
        vocabulary_id: id,
        status: "learning",
        favorite: favorite ?? false,
        due_at: new Date().toISOString(),
      });
      return "added" as const;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["user-vocabulary"] });
      qc.invalidateQueries({ queryKey: ["vocab", "due-count"] });
      if (result === "added") toast.success("Word added to your review deck");
    },
    onError: () => toast.error("Could not save that word. Please try again."),
  });

  const filtered = (words ?? []).filter((w) => {
    const matchesCategory = category === "All" || w.category === category;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q || w.word.toLowerCase().includes(q) || w.meaning_id.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const dueCount = (mine ?? []).filter((m) => new Date(m.due_at) <= new Date()).length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Vocabulary bank"
        description="Simpan kata baru, dengarkan pengucapannya, lalu ulangi dengan spaced repetition."
        action={
          <Button asChild className="gap-2">
            <Link to="/review">
              <Brain className="size-4" aria-hidden /> Review {dueCount > 0 ? `(${dueCount})` : ""}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Words in bank" value={words?.length ?? 0} />
        <StatCard icon={Heart} tone="violet" label="Saved by you" value={mine?.length ?? 0} />
        <StatCard icon={Brain} tone="success" label="Due for review" value={dueCount} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a word or meaning…"
            aria-label="Search vocabulary"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", ...VOCAB_CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === c
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading ? <CardSkeletonGrid count={6} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((w) => {
          const mineRow = saved.get(w.id);
          return (
            <article key={w.id} className="surface-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold">{w.word}</h2>
                    <AudioButton text={w.word} label={`Pronounce ${w.word}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {w.ipa ? `${w.ipa} · ` : ""}
                    {w.word_type ?? ""}
                  </p>
                </div>
                <LevelBadge level={w.level_code} />
              </div>
              <p className="mt-2 text-sm font-medium">{withID ? w.meaning_id : w.meaning_en ?? w.meaning_id}</p>
              {w.example ? (
                <p className="mt-1 text-sm italic text-muted-foreground">“{w.example}”</p>
              ) : null}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant={mineRow ? "secondary" : "default"}
                  className="gap-1.5"
                  onClick={() => addWord.mutate({ id: w.id })}
                >
                  {mineRow ? (
                    <>
                      <Heart className={cn("size-4", mineRow.favorite && "fill-current")} aria-hidden />
                      {mineRow.favorite ? "Favorite" : "Saved"}
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" aria-hidden /> Add to deck
                    </>
                  )}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {!isLoading && filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No words match your search yet.</p>
      ) : null}
    </div>
  );
}
