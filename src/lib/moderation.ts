import { GEMINI_MODEL, getGeminiClient } from "@/lib/geminiChat";

export type ModerationStatus = "pending" | "rejected";

export interface ModerationVerdict {
  status: ModerationStatus;
  reason?: string;
}

const CATEGORIES = ["personal_data", "abuse", "self_harm", "spam"] as const;

const INSTRUCTION = [
  "You screen short anonymous philosophical reflections before a human reviews them.",
  "Classify the text for: personal_data (names, contacts, addresses, anything identifying),",
  "abuse (harassment, slurs, threats), self_harm (intent or encouragement of self-harm),",
  "and spam (advertising, links, nonsense).",
  'Reply with JSON only: {"flagged": boolean, "categories": string[], "note": string}.',
  "Flag only what clearly belongs in one of those categories. Disagreement and dark subject matter are not grounds to flag.",
].join(" ");

function parseVerdict(text: string): ModerationVerdict {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { status: "pending" };

  const parsed = JSON.parse(match[0]) as {
    flagged?: boolean;
    categories?: string[];
    note?: string;
  };

  if (!parsed.flagged) return { status: "pending" };

  const categories = (parsed.categories ?? []).filter((category) =>
    (CATEGORIES as readonly string[]).includes(category)
  );

  return {
    status: "rejected",
    reason: [categories.join(", ") || "flagged", parsed.note?.trim()]
      .filter(Boolean)
      .join(" — ")
      .slice(0, 300),
  };
}

const SCREEN_TIMEOUT_MS = 8000;

/**
 * Advisory only: a flag keeps the entry out of the public pool, but nothing is
 * ever shown to another visitor until a human approves it in /admin. A slow or
 * unreachable model must therefore never hold up the visitor's submission.
 */
export async function screenReflection(text: string): Promise<ModerationVerdict> {
  const ai = getGeminiClient();
  if (!ai) return { status: "pending" };

  const timeout = new Promise<ModerationVerdict>((resolve) =>
    setTimeout(() => resolve({ status: "pending", reason: "Automatic screen timed out" }), SCREEN_TIMEOUT_MS)
  );

  try {
    const screen = ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        systemInstruction: INSTRUCTION,
        temperature: 0,
        maxOutputTokens: 200,
        responseMimeType: "application/json",
      },
    }).then((result) => parseVerdict(result.text ?? ""));

    return await Promise.race([screen, timeout]);
  } catch (error) {
    console.error("Moderation screen failed", error);
    return { status: "pending" };
  }
}
