import { Check, Lightbulb, X } from "lucide-react";
import { useMemo, useState } from "react";

import { AudioButton } from "@/components/lingua/AudioButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { answersMatch, normalize } from "@/lib/lingua";

export type Exercise = {
  id: string;
  kind: string;
  prompt: string;
  prompt_id?: string | null;
  options: unknown;
  answer: string;
  explanation?: string | null;
  audio_text?: string | null;
};

function toOptions(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

function hintFor(kind: string, given: string, expected: string) {
  if (kind === "sentence_order") return "Almost! In English the subject usually comes before the verb.";
  if (normalize(given).length === 0) return "Try writing something — even a short answer helps.";
  if (normalize(given).replace(/s$/, "") === normalize(expected).replace(/s$/, ""))
    return "So close — check the ending of the verb (he/she/it needs an -s).";
  return "Not quite yet — read the explanation and try to notice the pattern.";
}

export function ExerciseView({
  exercise,
  showIndonesian,
  onResult,
  index,
  total,
}: {
  exercise: Exercise;
  showIndonesian: boolean;
  onResult: (correct: boolean) => void;
  index: number;
  total: number;
}) {
  const options = toOptions(exercise.options);
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [built, setBuilt] = useState<string[]>([]);
  const [checked, setChecked] = useState<null | boolean>(null);
  const pool = useMemo(() => shuffle(options), [exercise.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isChoice = ["multiple_choice", "true_false", "matching"].includes(exercise.kind);
  const isOrder = exercise.kind === "sentence_order";
  const isTyping = ["fill_blank", "translate", "listening", "speaking"].includes(exercise.kind);

  function check() {
    let correct = false;
    if (isChoice) correct = selected === exercise.answer;
    else if (isOrder) correct = answersMatch(built.join(" "), exercise.answer);
    else correct = answersMatch(typed, exercise.answer);
    setChecked(correct);
  }

  const answered = checked !== null;

  return (
    <div className="surface-card animate-pop-in p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>
          Question {index + 1} of {total}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
          {exercise.kind.replace(/_/g, " ")}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold">{exercise.prompt}</p>
          {showIndonesian && exercise.prompt_id ? (
            <p className="mt-1 text-sm text-muted-foreground">{exercise.prompt_id}</p>
          ) : null}
        </div>
        {exercise.audio_text ? <AudioButton text={exercise.audio_text} /> : null}
      </div>

      {exercise.audio_text ? (
        <div className="mt-3 flex gap-2">
          <AudioButton text={exercise.audio_text} size="sm" label="Listen" />
          <AudioButton text={exercise.audio_text} slow size="sm" label="Slow" />
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {isChoice ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((option) => {
              const isRight = option === exercise.answer;
              const isPicked = option === selected;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={answered}
                  onClick={() => setSelected(option)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                    "hover:border-primary hover:bg-primary-soft/60 disabled:cursor-default",
                    isPicked && !answered && "border-primary bg-primary-soft",
                    answered && isRight && "border-success bg-success-soft text-success",
                    answered && isPicked && !isRight && "border-destructive bg-destructive-soft text-destructive",
                    !isPicked && !answered && "border-border",
                  )}
                >
                  <span>{option}</span>
                  {answered && isRight ? <Check className="size-4" aria-hidden /> : null}
                  {answered && isPicked && !isRight ? <X className="size-4" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {isOrder ? (
          <div className="space-y-3">
            <div className="flex min-h-14 flex-wrap items-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 p-3">
              {built.length === 0 ? (
                <span className="text-sm text-muted-foreground">Tap the words in the right order…</span>
              ) : (
                built.map((word, i) => (
                  <button
                    key={`${word}-${i}`}
                    type="button"
                    disabled={answered}
                    onClick={() => setBuilt((b) => b.filter((_, idx) => idx !== i))}
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                  >
                    {word}
                  </button>
                ))
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {pool.map((word, i) => {
                const usedCount = built.filter((w) => w === word).length;
                const poolCount = pool.filter((w) => w === word).length;
                const disabled = answered || usedCount >= poolCount;
                return (
                  <button
                    key={`${word}-${i}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => setBuilt((b) => [...b, word])}
                    className={cn(
                      "rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary",
                      disabled && "opacity-40",
                    )}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {isTyping ? (
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={answered}
            placeholder="Type your answer…"
            aria-label="Your answer"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !answered) check();
            }}
          />
        ) : null}
      </div>

      {answered ? (
        <div
          className={cn(
            "mt-5 animate-rise rounded-xl p-4 text-sm",
            checked ? "bg-success-soft text-success" : "bg-warning-soft text-warning-foreground",
          )}
        >
          <p className="flex items-center gap-2 font-semibold">
            {checked ? <Check className="size-4" aria-hidden /> : <Lightbulb className="size-4" aria-hidden />}
            {checked ? "Nice work." : hintFor(exercise.kind, isOrder ? built.join(" ") : typed, exercise.answer)}
          </p>
          {!checked ? (
            <p className="mt-1">
              Answer: <strong>{exercise.answer}</strong>
            </p>
          ) : null}
          {exercise.explanation ? <p className="mt-1 opacity-90">{exercise.explanation}</p> : null}
        </div>
      ) : null}

      <div className="mt-5 flex justify-end gap-2">
        {!answered ? (
          <Button
            onClick={check}
            disabled={isChoice ? !selected : isOrder ? built.length === 0 : typed.trim().length === 0}
          >
            Check
          </Button>
        ) : (
          <Button onClick={() => onResult(checked === true)}>
            {index + 1 === total ? "Finish" : "Continue"}
          </Button>
        )}
      </div>
    </div>
  );
}
