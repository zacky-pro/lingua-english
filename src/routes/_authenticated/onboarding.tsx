import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { ProgressBar } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { useProfile, useUpdateProfile } from "@/hooks/useLingua";
import { LEVELS, LEVEL_META, type LevelCode } from "@/lib/lingua";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const LEVEL_CHOICES: { label: string; sub: string; level: LevelCode }[] = [
  { label: "I know almost nothing", sub: "Saya hampir tidak tahu apa-apa", level: "A0" },
  { label: "Beginner", sub: "Tahu beberapa kata", level: "A1" },
  { label: "Elementary", sub: "Bisa kalimat sederhana", level: "A2" },
  { label: "Intermediate", sub: "Bisa ngobrol sedikit", level: "B1" },
  { label: "Upper Intermediate", sub: "Cukup lancar", level: "B2" },
  { label: "Advanced", sub: "Sangat lancar", level: "C1" },
  { label: "I'm not sure", sub: "Kami akan mulai dari dasar", level: "A0" },
];

const GOALS = [
  "Speak English confidently",
  "Understand English movies",
  "Study",
  "Work",
  "Travel",
  "Make international friends",
  "Improve grammar",
  "Improve pronunciation",
  "Improve vocabulary",
  "Prepare for exams",
];

const TIMES = [5, 10, 15, 20, 30, 45];

const FOCUS = ["Listening", "Speaking", "Vocabulary", "Grammar", "Reading", "Writing", "Pronunciation"];

function Chip({
  active,
  children,
  onClick,
  sub,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
        active
          ? "border-primary bg-primary-soft text-primary shadow-soft"
          : "border-border hover:border-primary/50 hover:bg-muted",
      )}
    >
      <span>
        <span className="block">{children}</span>
        {sub ? <span className="block text-xs font-normal text-muted-foreground">{sub}</span> : null}
      </span>
      {active ? <Check className="size-4 shrink-0" aria-hidden /> : null}
    </button>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<LevelCode>("A0");
  const [goals, setGoals] = useState<string[]>([]);
  const [minutes, setMinutes] = useState(15);
  const [focus, setFocus] = useState<string[]>([]);

  const steps = 5;

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function finish() {
    await update.mutateAsync({
      level_code: level,
      goals,
      focus_skills: focus,
      daily_goal_minutes: minutes,
      onboarded: true,
    });
    navigate({ to: "/dashboard" });
  }

  const path = LEVELS.slice(LEVELS.indexOf(level)).slice(0, 5);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="mb-2 text-sm text-muted-foreground">
          Step {step + 1} of {steps}
        </p>
        <ProgressBar value={((step + 1) / steps) * 100} label="Onboarding progress" />
      </div>

      <div className="surface-card animate-pop-in p-6">
        {step === 0 ? (
          <>
            <h1 className="font-display text-2xl font-bold">What's your English level?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tidak apa-apa kalau belum tahu apa-apa.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {LEVEL_CHOICES.map((c) => (
                <Chip key={c.label} active={level === c.level} sub={c.sub} onClick={() => setLevel(c.level)}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h1 className="font-display text-2xl font-bold">What is your main goal?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pilih sebanyak yang kamu mau.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {GOALS.map((g) => (
                <Chip key={g} active={goals.includes(g)} onClick={() => toggle(goals, setGoals, g)}>
                  {g}
                </Chip>
              ))}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h1 className="font-display text-2xl font-bold">How much time can you study every day?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Kamu bisa mengubahnya kapan saja.</p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TIMES.map((t) => (
                <Chip key={t} active={minutes === t} onClick={() => setMinutes(t)}>
                  {t === 45 ? "45+ minutes" : `${t} minutes`}
                </Chip>
              ))}
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h1 className="font-display text-2xl font-bold">What do you want to improve most?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Kami akan mengutamakan latihan ini.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {FOCUS.map((f) => (
                <Chip key={f} active={focus.includes(f)} onClick={() => toggle(focus, setFocus, f)}>
                  {f}
                </Chip>
              ))}
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
              <Sparkles className="size-3.5" aria-hidden /> Your recommended path
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold">
              Nice, {profile?.display_name ?? "friend"} — here's your plan
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mulai dari {level} · {minutes} menit setiap hari
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {path.map((l, i) => (
                <span key={l} className="flex items-center gap-2">
                  <span className="rounded-xl bg-primary-soft px-3 py-2 text-sm font-semibold text-primary">
                    {l}
                  </span>
                  {i < path.length - 1 ? (
                    <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                  ) : null}
                </span>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-muted/60 p-4 text-sm">
              <p className="font-semibold">First milestone</p>
              <p className="mt-1 text-muted-foreground">{LEVEL_META[level].can}</p>
            </div>
          </>
        ) : null}

        <div className="mt-7 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="gap-1.5"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back
          </Button>
          {step < steps - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} className="gap-1.5">
              Continue <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button onClick={finish} disabled={update.isPending} className="gap-1.5">
              {update.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Start learning
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
