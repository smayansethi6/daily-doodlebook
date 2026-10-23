export type ModerationStatus = "pending" | "rejected";

export interface ModerationVerdict {
  status: ModerationStatus;
  reason?: string;
}

const SCREEN_TIMEOUT_MS = 8000;

/**
 * Advisory only: a flag keeps the entry out of the public pool, but nothing is
 * ever shown to another visitor until a human approves it in Supabase. The
 * screen runs in /api/screen, which holds the Gemini key; a slow or failing
 * screen must never hold up the visitor's submission.
 */
export async function screenReflection(text: string): Promise<ModerationVerdict> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCREEN_TIMEOUT_MS);

  try {
    const response = await fetch("/api/screen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!response.ok) return { status: "pending" };

    const verdict = (await response.json()) as Partial<ModerationVerdict>;
    return verdict.status === "rejected"
      ? { status: "rejected", reason: verdict.reason?.slice(0, 300) }
      : { status: "pending" };
  } catch (error) {
    console.error("Moderation screen failed", error);
    return { status: "pending" };
  } finally {
    clearTimeout(timer);
  }
}
