import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gateway } from "./ai-gateway.server";
import {
  ConversationInput,
  ReviewInput,
  ReviewSchema,
  SpeakingInput,
  SpeakingSchema,
  TranslateInput,
  TranslateSchema,
  TutorInput,
  WritingInput,
  WritingSchema,
  conversationSystem,
  tutorSystem,
} from "./ai-schemas";

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TutorInput.parse(input))
  .handler(async ({ data }) => {
    const result = await generateText({
      model: gateway(),
      system: tutorSystem(data.level, data.mode),
      messages: data.messages,
    });
    return { reply: result.text };
  });

export const conversationReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ConversationInput.parse(input))
  .handler(async ({ data }) => {
    const result = await generateText({
      model: gateway(),
      system: conversationSystem(data.situation, data.partnerStyle, data.difficulty, data.hint),
      messages: data.messages,
    });
    return { reply: result.text };
  });

export const conversationReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReviewInput.parse(input))
  .handler(async ({ data }) => {
    const transcript = data.messages
      .map((m) => `${m.role === "user" ? "Learner" : "Partner"}: ${m.content}`)
      .join("\n");
    const result = await generateText({
      model: gateway(),
      output: Output.object({ schema: ReviewSchema }),
      system: `You review an English conversation by a ${data.level} learner. Score 0-100 for vocabulary, grammar, naturalness and fluency, judged fairly for their level. Give exactly 3 short, concrete improvements and up to 4 useful phrases they could have used. Be encouraging.`,
      prompt: transcript,
    });
    return result.output;
  });

export const speakingFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SpeakingInput.parse(input))
  .handler(async ({ data }) => {
    const result = await generateText({
      model: gateway(),
      output: Output.object({ schema: SpeakingSchema }),
      system: `You coach spoken English for a ${data.level} Indonesian learner. You receive a speech-to-text transcript, so judge grammar, vocabulary, sentence structure, fluency and filler words; estimate pronunciation from likely transcription confusions. Score 0-100. "corrected" is the improved version of what they said. "feedback" explains the main mistake in one or two simple sentences (add Bahasa Indonesia if level is A0-A2). Be kind and specific.`,
      prompt: `Task: ${data.prompt}\nTranscript: ${data.transcript}`,
    });
    return result.output;
  });

export const writingFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => WritingInput.parse(input))
  .handler(async ({ data }) => {
    const result = await generateText({
      model: gateway(),
      output: Output.object({ schema: WritingSchema }),
      system: `You give writing feedback to a ${data.level} English learner from Indonesia. Score 0-100. "improved" keeps the learner's own ideas and voice but fixes mistakes. "explanations" lists each important change and WHY, in simple language (Indonesian if level is A0-A2). Never rewrite without explaining.`,
      prompt: `Prompt: ${data.prompt}\n\nLearner text:\n${data.content}`,
    });
    return result.output;
  });

export const translateForLearning = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TranslateInput.parse(input))
  .handler(async ({ data }) => {
    const result = await generateText({
      model: gateway(),
      output: Output.object({ schema: TranslateSchema }),
      system: `You are a learning-focused translator for a ${data.level} learner. Translate ${data.direction === "id-en" ? "Indonesian to English" : "English to Indonesian"}. Then explain the grammar choice simply (in Bahasa Indonesia), give natural alternatives, and list key words with meanings. Teaching matters more than the translation itself.`,
      prompt: data.text,
    });
    return result.output;
  });
