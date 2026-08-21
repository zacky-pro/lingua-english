import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  Headphones,
  LineChart,
  MessageCircle,
  Mic,
  SpellCheck,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LEVELS, LEVEL_META } from "@/lib/lingua";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LINGUA — From Zero English to Real Conversations" },
      {
        name: "description",
        content:
          "Learn English step by step with LINGUA: vocabulary, grammar, listening, speaking and real AI conversations. Free to start.",
      },
      { property: "og:title", content: "LINGUA — From Zero English to Real Conversations" },
      {
        property: "og:description",
        content: "Vocabulary, grammar, listening, speaking and AI conversation practice in one learning path.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: BookOpen,
    title: "Learn Vocabulary",
    text: "Words with meaning, pronunciation and examples — reviewed with spaced repetition so they stick.",
  },
  {
    icon: SpellCheck,
    title: "Master Grammar",
    text: "Grammar explained in plain language, with exercises that show you why, not just what.",
  },
  {
    icon: Headphones,
    title: "Train Your Ear",
    text: "Listening exercises with transcripts, slow audio and translation you can toggle on or off.",
  },
  {
    icon: Mic,
    title: "Speak With Confidence",
    text: "Speak into your mic and get a clear score for pronunciation, grammar, vocabulary and fluency.",
  },
  {
    icon: MessageCircle,
    title: "Practice Real Conversations",
    text: "Real Talk puts you in real situations — ordering food, job interviews, small talk.",
  },
  {
    icon: LineChart,
    title: "Track Your Progress",
    text: "XP, streaks, skill breakdown and achievements that show how far you have really come.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl gradient-hero text-primary-foreground shadow-glow">
              <Zap className="size-5" aria-hidden />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">LINGUA</span>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                A0 → C2 · Bahasa Indonesia friendly
              </span>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
                From Zero English to <span className="text-gradient">Real Conversations.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                Build your English step by step — vocabulary, grammar, listening, speaking, and real
                conversations. Designed for people who are starting from almost nothing.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild className="gap-2">
                  <Link to="/auth">
                    Start Learning Free <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth">Take Placement Test</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Gratis untuk memulai · Progres tersimpan otomatis
              </p>
            </div>

            <div className="animate-pop-in surface-card overflow-hidden p-0 shadow-lift">
              <div className="gradient-hero px-5 py-4 text-primary-foreground">
                <p className="text-sm opacity-90">Good morning, Alex 👋</p>
                <p className="font-display text-lg font-bold">Ready for your next 15 minutes of English?</p>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold">Level A1</span>
                    <span className="text-muted-foreground">78%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[78%] rounded-full gradient-hero" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Next milestone: <strong className="text-foreground">Order food in English</strong>
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Streak", value: "7 🔥" },
                    { label: "XP today", value: "120" },
                    { label: "Words", value: "248" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-muted/60 p-3">
                      <p className="font-display text-lg font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {["10 new words", "Basic grammar", "Speaking practice"].map((task, i) => (
                    <div key={task} className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm">
                      <span
                        className={
                          i === 0
                            ? "grid size-6 place-items-center rounded-full bg-success text-success-foreground"
                            : "size-6 rounded-full border border-border"
                        }
                      >
                        {i === 0 ? "✓" : ""}
                      </span>
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-surface py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-bold">Why Lingua?</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Semua yang kamu butuhkan untuk bisa benar-benar berbicara bahasa Inggris — dalam satu tempat.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article key={f.title} className="surface-card p-5 transition-shadow hover:shadow-lift">
                  <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <f.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-bold">Your path, level by level</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {LEVELS.map((level, i) => (
              <div key={level} className="surface-card p-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg gradient-hero text-sm font-bold text-primary-foreground">
                    {level}
                  </span>
                  <span className="text-sm font-semibold">{LEVEL_META[level].name}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{LEVEL_META[level].can}</p>
                <p className="mt-2 text-xs text-muted-foreground">Step {i + 1} of 7</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="gradient-hero flex flex-col items-center gap-5 rounded-3xl px-6 py-14 text-center text-primary-foreground shadow-glow">
            <Brain className="size-10" aria-hidden />
            <h2 className="max-w-xl font-display text-3xl font-extrabold">Your English journey starts here.</h2>
            <p className="max-w-lg text-primary-foreground/85">
              Learn. Practice. Speak. Become fluent — 15 minutes a day is all you need to begin.
            </p>
            <Button size="lg" variant="secondary" asChild className="gap-2">
              <Link to="/auth">
                Start Learning <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <p className="flex items-center gap-2 text-xs text-primary-foreground/75">
              <Award className="size-4" aria-hidden /> Free to start · No credit card
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        LINGUA · Learn. Practice. Speak. Become Fluent.
      </footer>
    </div>
  );
}
