import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AudioButton } from "@/components/lingua/AudioButton";
import { PageHeader } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/useLingua";
import { askTutor } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({
    meta: [
      { title: "AI Tutor — LINGUA" },
      { name: "description", content: "Ask anything about English grammar, words or pronunciation and get a clear answer." },
      { property: "og:title", content: "AI Tutor — LINGUA" },
      { property: "og:description", content: "Your patient English tutor, available any time." },
    ],
  }),
  component: TutorPage,
});

const MODES = [
  { key: "normal", label: "Explain" },
  { key: "simpler", label: "Say it simpler" },
  { key: "example", label: "Give examples" },
  { key: "translate", label: "In Indonesian" },
  { key: "quiz", label: "Mini quiz" },
  { key: "practice", label: "Practice with me" },
];

const STARTERS = [
  "What is the difference between 'do' and 'make'?",
  "Correct this: I go to school yesterday.",
  "How do I use the present perfect?",
  "Give me 5 polite ways to ask for help.",
];

type Msg = { role: "user" | "assistant"; content: string };

function TutorPage() {
  const { data: profile } = useProfile();
  const ask = useServerFn(askTutor);
  const [mode, setMode] = useState<"normal" | "simpler" | "example" | "translate" | "quiz" | "practice">("normal");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useMutation({
    mutationFn: async (text: string) => {
      const next: Msg[] = [...messages, { role: "user", content: text }];
      setMessages(next);
      setInput("");
      const res = (await ask({
        data: { messages: next, level: profile?.level_code ?? "A1", mode },
      })) as { reply: string };
      setMessages([...next, { role: "assistant", content: res.reply }]);
    },
    onError: () => toast.error("The tutor is unavailable right now. Please try again."),
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageHeader
        icon={Brain}
        title="AI Tutor"
        description="Tanya apa saja tentang bahasa Inggris — grammar, kosakata, atau cara pengucapan."
      />

      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key as typeof mode)}
            aria-pressed={mode === m.key}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              mode === m.key ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-muted",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="surface-card flex min-h-[22rem] flex-col gap-3 p-4">
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Try one of these:</p>
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send.mutate(s)}
                className="block w-full rounded-xl bg-muted/60 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex items-end gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
            {m.role === "assistant" ? <AudioButton text={m.content} label="Play answer" /> : null}
            <p
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted",
              )}
            >
              {m.content}
            </p>
          </div>
        ))}
        {send.isPending ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> thinking…
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) send.mutate(input.trim());
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your question…"
          aria-label="Your question"
        />
        <Button type="submit" disabled={send.isPending || !input.trim()} aria-label="Send question">
          <Send className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
