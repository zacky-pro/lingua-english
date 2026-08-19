import { z } from "zod";

export const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
});
export type ChatMessage = z.infer<typeof MessageSchema>;

export const TutorInput = z.object({
  messages: z.array(MessageSchema).max(30),
  level: z.string().default("A0"),
  mode: z.enum(["normal", "simpler", "example", "translate", "quiz", "practice"]).default("normal"),
});

export const ConversationInput = z.object({
  messages: z.array(MessageSchema).max(40),
  situation: z.string().max(500),
  partnerStyle: z.string().max(60).default("Friendly"),
  difficulty: z.string().max(4).default("A1"),
  hint: z.enum(["none", "explain"]).default("none"),
});

export const ReviewInput = z.object({
  messages: z.array(MessageSchema).max(60),
  level: z.string().default("A1"),
});

export const ReviewSchema = z.object({
  scores: z.object({
    vocabulary: z.number(),
    grammar: z.number(),
    naturalness: z.number(),
    fluency: z.number(),
  }),
  summary: z.string(),
  improvements: z.array(z.string()).max(3),
  phrases: z.array(z.string()).max(4),
});

export const SpeakingInput = z.object({
  transcript: z.string().min(1).max(2000),
  prompt: z.string().max(500).default("Free speaking"),
  level: z.string().default("A1"),
});

export const SpeakingSchema = z.object({
  overall: z.number(),
  pronunciation: z.number(),
  grammar: z.number(),
  vocabulary: z.number(),
  fluency: z.number(),
  corrected: z.string(),
  feedback: z.string(),
  tips: z.array(z.string()).max(3),
});

export const WritingInput = z.object({
  content: z.string().min(1).max(4000),
  prompt: z.string().max(500).default(""),
  level: z.string().default("A1"),
});

export const WritingSchema = z.object({
  scores: z.object({
    grammar: z.number(),
    vocabulary: z.number(),
    structure: z.number(),
    clarity: z.number(),
    naturalness: z.number(),
  }),
  improved: z.string(),
  explanations: z.array(z.string()).max(5),
  encouragement: z.string(),
});

export const TranslateInput = z.object({
  text: z.string().min(1).max(600),
  direction: z.enum(["id-en", "en-id"]).default("id-en"),
  level: z.string().default("A1"),
});

export const TranslateSchema = z.object({
  translation: z.string(),
  explanation: z.string(),
  alternatives: z.array(z.string()).max(3),
  keyWords: z.array(z.object({ word: z.string(), meaning: z.string() })).max(5),
});

export function tutorSystem(level: string, mode: string) {
  const modeLine: Record<string, string> = {
    normal: "Answer the question clearly.",
    simpler: "Re-explain your last answer MUCH more simply, with shorter words and one tiny example.",
    example: "Give three concrete example sentences with Indonesian translations.",
    translate: "Translate your explanation into Bahasa Indonesia, keeping English examples.",
    quiz: "Give a 3-question mini quiz about the last topic, with the answers hidden at the end.",
    practice: "Give a short guided practice: 3 prompts the learner should answer, one at a time.",
  };
  return [
    "You are Lingua, a warm, patient English tutor for Indonesian learners.",
    `The learner's CEFR level is ${level}.`,
    level === "A0" || level === "A1"
      ? "Explain mostly in Bahasa Indonesia. Keep English examples very short. Never use grammar jargon without explaining it in Indonesian."
      : level === "A2"
        ? "Explain in simple English, add a short Indonesian summary at the end."
        : "Explain in clear English. Use Indonesian only for a difficult word.",
    "Never overwhelm: max ~150 words, use short paragraphs or bullets, always include an example sentence.",
    "Be encouraging, never condescending.",
    modeLine[mode] ?? modeLine["normal"],
  ].join(" ");
}

export function conversationSystem(situation: string, style: string, difficulty: string, hint: string) {
  if (hint === "explain") {
    return [
      "You are Lingua's conversation partner. The learner pressed “I don't understand”.",
      "Explain your LAST message in very simple English and then in Bahasa Indonesia.",
      "Add one suggested reply the learner could use. Keep it under 80 words. Do not continue the roleplay.",
    ].join(" ");
  }
  return [
    `You are a natural English conversation partner in this situation: ${situation}.`,
    `Your persona style is ${style}. Target learner level: ${difficulty}.`,
    "Speak like a real person: 1-3 short sentences, then usually ask a follow-up question.",
    "Do NOT correct every mistake — stay in the conversation. Only rephrase gently if the learner is impossible to understand.",
    difficulty === "A0" || difficulty === "A1"
      ? "Use very simple words and short sentences."
      : "Use natural, idiomatic English suited to the level.",
    "Never write stage directions, lists, or lesson notes. Just talk.",
  ].join(" ");
}
