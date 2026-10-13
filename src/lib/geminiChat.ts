import { GoogleGenAI, type Chat } from "@google/genai";
import type { Question } from "@/lib/questions";
import { isFallbackQuestion } from "@/lib/questions";

const fallbackModelName = "gemini-2.5-flash";
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const hasGeminiConfig = Boolean(geminiApiKey);
export const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || fallbackModelName;

export function getGeminiClient(): GoogleGenAI | null {
  if (!geminiApiKey) return null;
  return new GoogleGenAI({ apiKey: geminiApiKey });
}

export interface InkContext {
  question?: Question;
  hasTodayResponse: boolean;
  /** An opposing reflection the visitor asked Ink to steelman. */
  otherSideExcerpt?: string;
}

function buildSystemInstruction({ question, hasTodayResponse, otherSideExcerpt }: InkContext) {
  const questionContext = question
    ? `${
        isFallbackQuestion(question)
          ? "Today's scheduled prompt could not be loaded, so the visitor is answering ThinkPhil's evergreen standby prompt"
          : `Today's reflection prompt is in the "${question.category}" category`
      }: "${question.question}".`
    : "Today's reflection prompt has not loaded yet, so keep guidance general.";

  const responseContext = hasTodayResponse
    ? "The visitor has already submitted today's reflection, so help them unpack, expand, or revisit it rather than telling them to submit a new answer."
    : "The visitor may still be writing today's reflection, so help them brainstorm, clarify, and structure their response without pretending to know what they think.";

  const otherSideContext = otherSideExcerpt
    ? `The visitor has just read this anonymous reflection from someone who disagreed with them: "${otherSideExcerpt}" When they ask you to steelman it, make the strongest honest case for that specific position before offering any critique.`
    : "";

  return [
    "You are Ink, a warm reflection companion inside ThinkPhil, a site that asks one philosophical question a day.",
    "Help visitors think more deeply about the daily prompt, but do not write full essays unless they explicitly ask.",
    "Prefer short, thoughtful responses with concrete follow-up questions or writing cues.",
    "Keep the tone calm, encouraging, and literary.",
    "Never claim to save responses or modify app data.",
    questionContext,
    responseContext,
    otherSideContext,
  ]
    .filter(Boolean)
    .join(" ");
}

export function createReflectionChatSession(context: InkContext): Chat {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("Gemini is not configured for this app.");
  }

  return ai.chats.create({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: buildSystemInstruction(context),
      temperature: 0.8,
      topP: 0.9,
      maxOutputTokens: 400,
    },
  });
}
