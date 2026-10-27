import { emailDb, page } from "./_lib/email.js";

function tokenFrom(request: Request) {
  return new URL(request.url).searchParams.get("token") ?? "";
}
const isToken = (token: string) => /^[0-9a-f-]{36}$/i.test(token);

export async function GET(request: Request): Promise<Response> {
  const token = tokenFrom(request);
  if (!isToken(token)) return page("Invalid link", "This confirmation link is invalid.");
  return page("Confirm your email", "Send me the daily question by email.", { label: "Confirm subscription", url: "/api/email-confirm", token });
}

export async function POST(request: Request): Promise<Response> {
  const token = String((await request.formData()).get("token") ?? "");
  if (!isToken(token)) return page("Invalid link", "This confirmation link is invalid.");
  try {
    const db = emailDb();
    const { data, error } = await db.from("email_subscribers").select("id,status,confirmation_sent_at")
      .eq("confirmation_token", token).maybeSingle();
    if (error) throw error;
    if (!data || data.status !== "pending" || !data.confirmation_sent_at || Date.now() - new Date(data.confirmation_sent_at).getTime() > 48 * 3600_000) {
      return page("Link expired", "Please subscribe again from the website to get a new link.");
    }
    const { error: updateError } = await db.from("email_subscribers")
      .update({ status: "active", confirmed_at: new Date().toISOString(), confirmation_token: crypto.randomUUID() })
      .eq("id", data.id).eq("status", "pending");
    if (updateError) throw updateError;
    return page("You're subscribed", "Tomorrow's question will arrive by email. You can answer today's question on the website now.");
  } catch (error) {
    console.error("Confirmation failed", error);
    return page("Something went wrong", "Please try again later.");
  }
}
