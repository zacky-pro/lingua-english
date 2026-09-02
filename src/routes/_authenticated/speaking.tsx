import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, MicOff, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AudioButton } from "@/components/lingua/AudioButton";
import { PageHeader, ProgressBar } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAward, useProfile } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { speakingFeedback } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/speaking")({
  head: () => ({
    meta: [
      { title: "Speaking — LINGUA" },
      { name: "description", content: "Speak English out loud and get scores for pronunciation, grammar and fluency." },
      { property: "og:title", content: "Speaking — LINGUA" },
      { property: "og:description", content: "Practice speaking English with instant AI coaching." },
    ],
  }),
  component: SpeakingPage,
});

const PROMPTS = [
  "Introduce yourself in English.",
  "Describe your morning routine.",
  "Talk about your favourite food and why you like it.",
  "Describe the place where you live.",
  "Tell me about your last holiday.",
  "What do you want to do next year? Why?",
];

type Scores = {
  overall: number;
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
  corrected: string;
  feedback: string;
  tips: string[];
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function SpeakingPage() {
  const { data: profile } = useProfile();
  const award = useAward();
  const getFeedback = useServerFn(speakingFeedback);
  const [prompt, setPrompt] = useState<string>(PROMPTS[0]!);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [result, setResult] = useState<Scores | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += `${event.results[i]?.[0]?.transcript ?? ""} `;
      setTranscript(text.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => rec.stop();
  }, []);

  function toggle() {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      setTranscript("");
      setResult(null);
      startedAt.current = Date.now();
      rec.start();
      setListening(true);
    }
  }

  const analyse = useMutation({
    mutationFn: async () => {
      const scores = (await getFeedback({
        data: { transcript, prompt, level: profile?.level_code ?? "A1" },
      })) as Scores;
      const seconds = Math.max(10, Math.round((Date.now() - startedAt.current) / 1000));
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        await supabase.from("speaking_sessions").insert({
          user_id: auth.user.id,
          prompt,
          transcript,
          scores,
          feedback: scores.feedback,
          seconds,
        });
      }
      await award.mutateAsync({
        xp: 20,
        minutes: Math.max(1, Math.round(seconds / 60)),
        speaking_minutes: Math.max(1, Math.round(seconds / 60)),
        source: "speaking",
      });
      return scores;
    },
    onSuccess: setResult,
    onError: () => toast.error("Could not analyse your speech right now. Please try again."),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        icon={Mic}
        title="Speaking lab"
        description="Bicara dalam bahasa Inggris, lalu dapatkan skor pengucapan, tata bahasa, dan kelancaran."
      />

      <div className="surface-card space-y-3 p-5">
        <h2 className="text-sm font-semibold">Choose a prompt</h2>
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrompt(p)}
              aria-pressed={prompt === p}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                prompt === p ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-muted",
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3">
          <AudioButton text={prompt} label="Hear the prompt" />
          <p className="text-sm font-medium">{prompt}</p>
        </div>
      </div>

      <div className="surface-card space-y-4 p-6 text-center">
        {supported ? (
          <>
            <Button
              size="lg"
              variant={listening ? "destructive" : "default"}
              onClick={toggle}
              className={cn("size-24 rounded-full", listening && "animate-pulse")}
              aria-label={listening ? "Stop recording" : "Start recording"}
            >
              {listening ? <MicOff className="size-8" aria-hidden /> : <Mic className="size-8" aria-hidden />}
            </Button>
            <p className="text-sm text-muted-foreground">
              {listening ? "Listening… speak clearly in English" : "Tap the microphone and start speaking"}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your browser doesn't support speech recognition — you can type what you would say instead.
          </p>
        )}

        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={4}
          aria-label="Your speech transcript"
          placeholder="Your words will appear here…"
        />

        <Button
          onClick={() => analyse.mutate()}
          disabled={analyse.isPending || transcript.trim().length < 3}
          className="gap-2"
        >
          {analyse.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
          Get my score
        </Button>
      </div>

      {result ? (
        <div className="surface-card animate-pop-in space-y-4 p-5">
          <div className="text-center">
            <p className="font-display text-5xl font-extrabold text-primary">{result.overall}</p>
            <p className="text-xs text-muted-foreground">overall score</p>
          </div>
          <div className="space-y-2">
            {(
              [
                ["Pronunciation", result.pronunciation],
                ["Grammar", result.grammar],
                ["Vocabulary", result.vocabulary],
                ["Fluency", result.fluency],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{label}</span>
                  <span className="text-muted-foreground">{value}</span>
                </div>
                <ProgressBar value={value} label={label} />
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-success-soft p-3 text-sm text-success">
            <strong>Better version:</strong> {result.corrected}
          </div>
          <p className="text-sm">{result.feedback}</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {result.tips.map((t, i) => (
              <li key={i}>💡 {t}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
