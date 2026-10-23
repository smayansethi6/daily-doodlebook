import {
  clip,
  FAST_THINKING,
  generate,
  GEMINI_MODEL,
  getGeminiClient,
  json,
  parseVerdict,
  readJson,
  SCREEN_INSTRUCTION,
} from "./_lib/gemini.js";

/**
 * Screens a reflection the visitor chose to share. Advisory only: anything
 * short of a clear flag comes back "pending" for a human to review.
 */
export async function POST(request: Request): Promise<Response> {
  const ai = getGeminiClient();
  if (!ai) return json({ status: "pending" });

  const body = await readJson<{ text?: string }>(request);
  const text = clip(body?.text, 2000).trim();
  if (!text) return json({ status: "pending" });

  try {
    const result = await generate(ai, {
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        systemInstruction: SCREEN_INSTRUCTION,
        temperature: 0,
        maxOutputTokens: 512,
        thinkingConfig: FAST_THINKING,
        responseMimeType: "application/json",
      },
    });
    return json(parseVerdict(result.text ?? ""));
  } catch (error) {
    console.error("Screening request to Gemini failed", error);
    return json({ status: "pending" });
  }
}
