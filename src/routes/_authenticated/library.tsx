import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Brain,
  Headphones,
  Languages,
  LayoutGrid,
  MessageCircle,
  Mic,
  PenLine,
  SpellCheck,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/lingua/primitives";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Library — LINGUA" },
      { name: "description", content: "Every practice lab in one place: vocabulary, grammar, listening, speaking and more." },
      { property: "og:title", content: "Library — LINGUA" },
      { property: "og:description", content: "Browse all English practice labs in LINGUA." },
    ],
  }),
  component: LibraryPage,
});

const ITEMS: { to: string; label: string; icon: LucideIcon; desc: string }[] = [
  { to: "/vocabulary", label: "Vocabulary", icon: BookOpen, desc: "Word bank with audio and spaced repetition." },
  { to: "/grammar", label: "Grammar", icon: SpellCheck, desc: "Bite-sized rules with instant quizzes." },
  { to: "/listening", label: "Listening", icon: Headphones, desc: "Audio clips with transcripts and questions." },
  { to: "/speaking", label: "Speaking", icon: Mic, desc: "Speak out loud and get scored." },
  { to: "/reading", label: "Reading", icon: BookOpen, desc: "Short texts with glossary help." },
  { to: "/writing", label: "Writing", icon: PenLine, desc: "Write and get corrections explained." },
  { to: "/conversation", label: "Real Talk", icon: MessageCircle, desc: "Roleplay real-life conversations." },
  { to: "/tutor", label: "AI Tutor", icon: Brain, desc: "Ask any English question, any time." },
  { to: "/translate", label: "Translate", icon: Languages, desc: "Translations that teach you why." },
];

function LibraryPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        icon={LayoutGrid}
        title="Library"
        description="Semua ruang latihan dalam satu tempat. Pilih apa yang mau kamu asah hari ini."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="surface-card group p-5 transition-shadow hover:shadow-lift"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <item.icon className="size-5" aria-hidden />
            </span>
            <h2 className="mt-3 font-display font-semibold">{item.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
