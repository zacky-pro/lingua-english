import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Lightbulb, Loader2, Mic, MicOff, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/lingua/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAward, useProfile } from "@/hooks/useLingua";
import { buddyReply } from "@/lib/ai.functions";
import { speakBilingual, stopSpeaking } from "@/lib/lingua";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/live")({
  head: () => ({
    meta: [
      { title: "Ngobrol Live — LINGUA" },
      {
        name: "description",
        content: "Talk out loud with an AI friend who answers in English and Indonesian and fixes your mistakes gently.",
      },
      { property: "og:title", content: "Ngobrol Live — LINGUA" },
      { property: "og:description", content: "Latihan ngobrol bahasa Inggris pakai suara, dikoreksi santai kayak teman." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LivePage,
});

const TOPICS = [
  "Ngobrol bebas",
  "Kenalan & basa-basi",
  "Makanan favorit",
  "Kerjaan & sekolah",
  "Jalan-jalan",
  "Belanja di toko",
  "Cerita hari ini",
];

type Turn = {
  role: "user" | "assistant";
  content: string;
  id?: string;
  correction?: string;
  note?: string;
  suggestion?: string;
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

function LivePage() {
  const { data: profile } = useProfile();
  const award = useAward();
  const reply = useServerFn(buddyReply);

  const [topic, setTopic] = useState(TOPICS[0]!);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [micLang, setMicLang] = useState<"en-US" | "id-ID">("en-US");
  const [supported, setSupported] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

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
    rec.lang = micLang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += `${event.results[i]?.[0]?.transcript ?? ""} `;
      setDraft(text.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => {
      rec.onresult = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    };
  }, [micLang]);

  const send = useMutation({
    mutationFn: async (text: string) => {
      const next: Turn[] = [...turns, { role: "user", content: text }];
      setTurns(next);
      setDraft("");
      stopSpeaking();
      const out = (await reply({
        data: {
          messages: next.map((t) => ({ role: t.role, content: t.content })),
          level: profile?.level_code ?? "A1",
          topic,
        },
      })) as {
        reply_en: string;
        reply_id: string;
        correction: string;
        correction_note: string;
        suggestion: string;
      };
      setTurns([
        ...next,
        {
          role: "assistant",
          content: out.reply_en,
          id: out.reply_id,
          correction: out.correction,
          note: out.correction_note,
          suggestion: out.suggestion,
        },
      ]);
      if (autoSpeak) speakBilingual(out.reply_en, out.reply_id);
      await award
        .mutateAsync({ xp: 6, minutes: 1, speakingMinutes: 1 })
        .catch(() => undefined);
    },
    onError: (err: unknown) =>
      toast.error(
        err instanceof Error && err.message ? err.message : "Temanmu lagi nggak bisa jawab. Coba lagi sebentar ya.",
      ),
  });

  function toggleMic() {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
      return;
    }
    stopSpeaking();
    setDraft("");
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Sparkles}
        title="Ngobrol Live"
        subtitle="Ngomong langsung pakai suara. Bimo jawab pakai Inggris + Indonesia dan ngoreksi santai kayak teman."
      />

      <div className="flex flex-wrap items-center gap-2">
        {TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTopic(t)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              topic === t ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setAutoSpeak((v) => !v);
              stopSpeaking();
            }}
            aria-pressed={autoSpeak}
          >
            {autoSpeak ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
            <span>{autoSpeak ? "Suara nyala" : "Suara mati"}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMicLang((l) => (l === "en-US" ? "id-ID" : "en-US"))}
          >
            Mic: {micLang === "en-US" ? "English" : "Indonesia"}
          </Button>
        </div>
      </div>

      <div className="surface-card flex min-h-[24rem] flex-col gap-4 p-4">
        {turns.length === 0 ? (
          <div className="m-auto max-w-md space-y-2 text-center text-sm text-muted-foreground">
            <p className="text-base font-semibold text-foreground">Halo! Aku Bimo 👋</p>
            <p>
              Tekan tombol mic terus ngomong aja — bahasa Inggris, Indonesia, atau campur juga boleh. Aku bakal jawab
              pakai dua bahasa dan benerin kalimatmu pelan-pelan.
            </p>
            <p className="text-xs">Contoh: “Hi Bimo, my name is Zacky. I want practice English.”</p>
          </div>
        ) : null}

        {turns.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {t.content}
              </p>
            </div>
          ) : (
            <div key={i} className="space-y-2">
              <div className="max-w-[90%] space-y-1.5 rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-sm">
                <p className="font-medium">{t.content}</p>
                {t.id ? <p className="text-muted-foreground">{t.id}</p> : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => speakBilingual(t.content, t.id ?? "")}
                >
                  <Volume2 className="size-3.5" aria-hidden /> Dengerin lagi
                </Button>
              </div>
              {t.correction ? (
                <div className="max-w-[90%] rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm">
                  <p className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="size-4" aria-hidden /> {t.correction}
                  </p>
                  {t.note ? <p className="mt-1 text-muted-foreground">{t.note}</p> : null}
                </div>
              ) : null}
              {t.suggestion ? (
                <button
                  type="button"
                  onClick={() => setDraft(t.suggestion ?? "")}
                  className="flex max-w-[90%] items-center gap-1.5 rounded-xl border border-dashed px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted"
                >
                  <Lightbulb className="size-3.5 shrink-0" aria-hidden /> Coba jawab: “{t.suggestion}”
                </button>
              ) : null}
            </div>
          ),
        )}

        {send.isPending ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> Bimo lagi mikir…
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      {!supported ? (
        <p className="text-xs text-muted-foreground">
          Browser ini belum bisa merekam suara. Kamu masih bisa mengetik di kotak bawah, atau coba pakai Chrome.
        </p>
      ) : null}

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim() && !send.isPending) send.mutate(draft.trim());
        }}
      >
        <Button
          type="button"
          onClick={toggleMic}
          disabled={!supported || send.isPending}
          variant={listening ? "destructive" : "secondary"}
          size="icon"
          aria-label={listening ? "Berhenti merekam" : "Mulai bicara"}
        >
          {listening ? <MicOff className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />}
        </Button>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={listening ? "Aku dengerin… ngomong aja" : "Ngomong atau ketik di sini…"}
          aria-label="Pesanmu"
        />
        <Button type="submit" disabled={send.isPending || !draft.trim()} aria-label="Kirim">
          <Send className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
