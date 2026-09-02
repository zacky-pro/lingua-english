import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AudioButton } from "@/components/lingua/AudioButton";
import { CardSkeletonGrid, LevelBadge, PageHeader, ProgressBar } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAward, useProfile } from "@/hooks/useLingua";
import { supabase } from "@/integrations/supabase/client";
import { conversationReply, conversationReview } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/conversation")({
  head: () => ({
    meta: [
      { title: "Real Talk — LINGUA" },
      { name: "description", content: "Practise real English conversations: cafés, interviews, travel and small talk." },
      { property: "og:title", content: "Real Talk — LINGUA" },
      { property: "og:description", content: "Have real English conversations with an AI partner and get reviewed." },
    ],
  }),
  component: ConversationPage,
});

type Scenario = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  situation: string;
  partner_style: string;
  difficulty: string;
  icon: string;
  opener: string;
};

type Msg = { role: "user" | "assistant"; content: string };

type Review = {
  scores: { vocabulary: number; grammar: number; naturalness: number; fluency: number };
  summary: string;
  improvements: string[];
  phrases: string[];
};

function ConversationPage() {
  const { data: profile } = useProfile();
  const award = useAward();
  const reply = useServerFn(conversationReply);
  const review = useServerFn(conversationReview);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<Review | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: scenarios, isLoading } = useQuery({
    queryKey: ["scenarios"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("conversation_scenarios").select("*").order("sort_order");
      if (error) throw error;
      return data as Scenario[];
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function start(s: Scenario) {
    setScenario(s);
    setResult(null);
    setMessages([{ role: "assistant", content: s.opener }]);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data } = await supabase
      .from("conversation_sessions")
      .insert({
        user_id: auth.user.id,
        scenario_id: s.id,
        title: s.title,
        partner_style: s.partner_style,
        difficulty: s.difficulty,
      })
      .select("id")
      .single();
    setSessionId(data?.id ?? null);
  }

  async function persist(role: "user" | "assistant", content: string) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || !sessionId) return;
    await supabase
      .from("conversation_messages")
      .insert({ session_id: sessionId, user_id: auth.user.id, role, content });
  }

  const send = useMutation({
    mutationFn: async (text: string) => {
      if (!scenario) return;
      const next: Msg[] = [...messages, { role: "user", content: text }];
      setMessages(next);
      setInput("");
      void persist("user", text);
      const res = (await reply({
        data: {
          messages: next,
          situation: scenario.situation,
          partnerStyle: scenario.partner_style,
          difficulty: scenario.difficulty,
          hint: "none",
        },
      })) as { reply: string };
      setMessages([...next, { role: "assistant", content: res.reply }]);
      void persist("assistant", res.reply);
    },
    onError: () => toast.error("Your conversation partner is unavailable right now. Try again."),
  });

  const endChat = useMutation({
    mutationFn: async () => {
      const res = (await review({
        data: { messages, level: profile?.level_code ?? "A1" },
      })) as Review;
      if (sessionId) {
        await supabase
          .from("conversation_sessions")
          .update({ review: res, ended_at: new Date().toISOString() })
          .eq("id", sessionId);
      }
      await award.mutateAsync({ xp: 30, minutes: 8, speaking_minutes: 4, source: "conversation" });
      return res;
    },
    onSuccess: setResult,
    onError: () => toast.error("Could not create your review. Please try again."),
  });

  if (!scenario) {
    return (
      <div className="space-y-5">
        <PageHeader
          icon={MessageCircle}
          title="Real Talk"
          description="Pilih situasi nyata dan mulai mengobrol dalam bahasa Inggris. Partner AI menyesuaikan levelmu."
        />
        {isLoading ? <CardSkeletonGrid count={6} /> : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios?.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => start(s)}
              className="surface-card p-4 text-left transition-shadow hover:shadow-lift"
            >
              <div className="flex items-center gap-2">
                <LevelBadge level={s.difficulty} />
                <span className="text-xs text-muted-foreground">{s.partner_style}</span>
              </div>
              <h2 className="mt-2 font-display font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setScenario(null)}>
          <ArrowLeft className="size-4" aria-hidden /> Scenarios
        </Button>
        <div className="flex items-center gap-2">
          <LevelBadge level={scenario.difficulty} />
          <span className="font-display font-semibold">{scenario.title}</span>
        </div>
      </div>

      <div className="surface-card flex min-h-[24rem] flex-col gap-3 p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex items-end gap-2", m.role === "user" ? "justify-end" : "justify-start")}
          >
            {m.role === "assistant" ? <AudioButton text={m.content} label="Play message" /> : null}
            <p
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm bg-muted",
              )}
            >
              {m.content}
            </p>
          </div>
        ))}
        {send.isPending ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> typing…
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
          placeholder="Type your reply in English…"
          aria-label="Your message"
        />
        <Button type="submit" disabled={send.isPending || !input.trim()} aria-label="Send message">
          <Send className="size-4" aria-hidden />
        </Button>
      </form>

      <Button
        variant="outline"
        className="gap-2"
        onClick={() => endChat.mutate()}
        disabled={endChat.isPending || messages.length < 3}
      >
        {endChat.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="size-4" aria-hidden />
        )}
        End conversation & get review
      </Button>

      {result ? (
        <div className="surface-card animate-pop-in space-y-4 p-5">
          <h2 className="font-display text-lg font-bold">Conversation review</h2>
          <div className="space-y-2">
            {Object.entries(result.scores).map(([key, value]) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-xs capitalize">
                  <span>{key}</span>
                  <span className="text-muted-foreground">{value}</span>
                </div>
                <ProgressBar value={value} label={key} />
              </div>
            ))}
          </div>
          <p className="text-sm">{result.summary}</p>
          <div>
            <h3 className="text-sm font-semibold">What to improve</h3>
            <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
              {result.improvements.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Useful phrases</h3>
            <ul className="mt-1.5 space-y-1 text-sm">
              {result.phrases.map((p, i) => (
                <li key={i} className="flex items-center gap-2">
                  <AudioButton text={p} label={`Play phrase ${i + 1}`} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
