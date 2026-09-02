import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeftRight, Languages, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AudioButton } from "@/components/lingua/AudioButton";
import { PageHeader } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useLingua";
import { translateForLearning } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/translate")({
  head: () => ({
    meta: [
      { title: "Translate — LINGUA" },
      { name: "description", content: "Translate between Indonesian and English and learn why the sentence works." },
      { property: "og:title", content: "Translate — LINGUA" },
      { property: "og:description", content: "Translations that teach, not just convert." },
    ],
  }),
  component: TranslatePage,
});

type Result = {
  translation: string;
  explanation: string;
  alternatives: string[];
  keyWords: { word: string; meaning: string }[];
};

function TranslatePage() {
  const { data: profile } = useProfile();
  const translate = useServerFn(translateForLearning);
  const [direction, setDirection] = useState<"id-en" | "en-id">("id-en");
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const run = useMutation({
    mutationFn: async () =>
      (await translate({
        data: { text, direction, level: profile?.level_code ?? "A1" },
      })) as Result,
    onSuccess: setResult,
    onError: () => toast.error("Translation is unavailable right now. Please try again."),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        icon={Languages}
        title="Learning translator"
        description="Bukan sekadar terjemahan — kamu juga dapat penjelasan kenapa kalimatnya begitu."
      />

      <div className="surface-card space-y-3 p-5">
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm font-semibold">{direction === "id-en" ? "Indonesian" : "English"}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Swap languages"
            onClick={() => {
              setDirection((d) => (d === "id-en" ? "en-id" : "id-en"));
              setResult(null);
            }}
          >
            <ArrowLeftRight className="size-4" aria-hidden />
          </Button>
          <span className="text-sm font-semibold">{direction === "id-en" ? "English" : "Indonesian"}</span>
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          aria-label="Text to translate"
          placeholder={direction === "id-en" ? "Tulis kalimat bahasa Indonesia…" : "Type an English sentence…"}
        />
        <Button onClick={() => run.mutate()} disabled={run.isPending || text.trim().length < 2} className="gap-2">
          {run.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Translate & explain
        </Button>
      </div>

      {result ? (
        <div className="surface-card animate-pop-in space-y-4 p-5">
          <div className="flex items-start gap-2">
            <AudioButton text={result.translation} label="Play translation" />
            <p className="font-display text-lg font-semibold">{result.translation}</p>
          </div>
          <p className="text-sm text-muted-foreground">{result.explanation}</p>
          {result.alternatives.length ? (
            <div>
              <h2 className="text-sm font-semibold">Other ways to say it</h2>
              <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                {result.alternatives.map((a, i) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.keyWords.length ? (
            <div className="flex flex-wrap gap-2">
              {result.keyWords.map((k) => (
                <span key={k.word} className="rounded-full bg-muted px-3 py-1 text-xs">
                  <strong>{k.word}</strong> — {k.meaning}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
