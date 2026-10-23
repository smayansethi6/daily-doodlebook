import {
  buildInkInstruction,
  clip,
  FAST_THINKING,
  generate,
  GEMINI_MODEL,
  getGeminiClient,
  json,
  readJson,
  type InkContext,
} from "./_lib/gemini.js";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

interface InkRequest {
  context?: InkContext;
  /** The whole conversation so far, oldest first, ending with the visitor's new message. */
  messages?: { role?: string; content?: string }[];
}

/**
 * One turn of the Ink chat. The browser sends the conversation; the prompt is
 * built here so the endpoint cannot be repurposed as a general chatbot on the
 * site's key.
 */
export async function POST(request: Request): Promise<Response> {
  const ai = getGeminiClient();
  if (!ai) return json({ error: "Ink is not configured." }, 503);

  const body = await readJson<InkRequest>(request);
  const messages = (body?.messages ?? [])
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: clip(message.content, MAX_MESSAGE_LENGTH) }],
    }))
    .filter((message) => message.parts[0].text.trim());
  // Gemini expects the conversation to open with the visitor.
  while (messages.length && messages[0].role === "model") messages.shift();

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json({ error: "Send at least one message from the visitor." }, 400);
  }

  try {
    const result = await generate(ai, {
      model: GEMINI_MODEL,
      contents: messages,
      config: {
        systemInstruction: buildInkInstruction(body?.context ?? {}),
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 1024,
        thinkingConfig: FAST_THINKING,
      },
    });
    return json({ reply: result.text?.trim() ?? "" });
  } catch (error) {
    console.error("Ink request to Gemini failed", error);
    if ((error as { status?: number }).status === 429) {
      return json({ error: "Ink is busy. Try again in a minute." }, 429);
    }
    return json({ error: "Ink could not reach the model." }, 502);
  }
}
