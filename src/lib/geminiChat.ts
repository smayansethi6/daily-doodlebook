import { GoogleGenAI, type Chat } from "@google/genai";
import type { Question } from "@/lib/questions";

const fallbackModelName = "gemini-2.5-flash";
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const hasGeminiConfig = Boolean(geminiApiKey);

function buildSystemInstruction(question?: Question, hasTodayResponse?: boolean) {
  const questionContext = question
    ? `Today's reflection prompt is in the "${question.category}" category: "${question.question}".`
    : "Today's reflection prompt has not loaded yet, so keep guidance general and invite the user to refresh if they want prompt-specific help.";

  const responseContext = hasTodayResponse
    ? "The user has already submitted today's reflection, so focus on helping them unpack, expand, or revisit it rather than telling them to submit a new answer."
    : "The user may still be writing today's reflection, so help them brainstorm, clarify, and structure their response without pretending to know what they think."
  ;

  return [
    "You are Ink, a warm reflection companion inside the Daily Doodlebook app.",
    "Help users think more deeply about the daily prompt, but do not write full essays unless they explicitly ask.",
    "Prefer short, thoughtful responses with concrete follow-up questions or writing cues.",
    "Keep the tone calm, encouraging, and literary.",
    "Never claim to save responses or modify app data.",
    questionContext,
    responseContext,
  ].join(" ");
}

function getGeminiClient() {
  if (!geminiApiKey) {
    throw new Error("Gemini is not configured for this app.");
  }

  return new GoogleGenAI({ apiKey: geminiApiKey });
}

function createChat(question?: Question, hasTodayResponse?: boolean): Chat {
  const ai = getGeminiClient();
  const modelName = import.meta.env.VITE_GEMINI_MODEL || fallbackModelName;

  return ai.chats.create({
    model: modelName,
    config: {
      systemInstruction: buildSystemInstruction(question, hasTodayResponse),
      temperature: 0.8,
      topP: 0.9,
      maxOutputTokens: 400,
    },
  });
}

export function createReflectionChatSession(
  question?: Question,
  hasTodayResponse?: boolean
): Chat {
  return createChat(question, hasTodayResponse);
}
