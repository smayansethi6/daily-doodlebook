import type { Question } from "@/lib/questions";
import { isFallbackQuestion } from "@/lib/questions";

// Gemini is only ever called from the server functions in /api, which hold the
// key. Nothing here needs it, so it never ships to the browser.

export interface InkContext {
  question?: Question;
  hasTodayResponse: boolean;
  /** An opposing reflection the visitor asked Ink to steelman. */
  otherSideExcerpt?: string;
}

export interface InkMessage {
  role: "assistant" | "user";
  content: string;
}

export class InkUnavailableError extends Error {}

/** Gemini's rate limit was hit; trying again shortly usually works. */
export class InkBusyError extends Error {}

/** Sends the conversation so far (ending with the visitor's message) and returns Ink's reply. */
export async function sendInkMessage(context: InkContext, messages: InkMessage[]): Promise<string> {
  const response = await fetch("/api/ink", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: {
        questionText: context.question?.question,
        questionCategory: context.question?.category,
        isFallback: isFallbackQuestion(context.question),
        hasTodayResponse: context.hasTodayResponse,
        otherSideExcerpt: context.otherSideExcerpt,
      },
      messages,
    }),
  });

  if (response.status === 503) throw new InkUnavailableError("Ink is not configured.");
  if (response.status === 429) throw new InkBusyError("Ink is busy.");
  if (!response.ok) throw new Error(`Ink request failed with ${response.status}`);

  const { reply } = (await response.json()) as { reply?: string };
  return reply ?? "";
}
