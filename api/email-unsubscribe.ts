import { emailDb, page } from "./_lib/email.js";

const isToken = (token: string) => /^[0-9a-f-]{36}$/i.test(token);

export async function GET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!isToken(token)) return page("Invalid link", "This unsubscribe link is invalid.");
  return page("Unsubscribe", "Stop receiving ThinkPhil's daily question emails?", { label: "Unsubscribe", url: "/api/email-unsubscribe", token });
}

export async function POST(request: Request): Promise<Response> {
  const token = String((await request.formData()).get("token") ?? "");
  if (!isToken(token)) return page("Invalid link", "This unsubscribe link is invalid.");
  try {
    const db = emailDb();
    const { data, error } = await db.from("email_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString(), confirmation_token: crypto.randomUUID() })
      .eq("unsubscribe_token", token).select("id");
    if (error) throw error;
    if (!data?.length) return page("Link expired", "This unsubscribe link is no longer valid.");
    return page("Unsubscribed", "You will no longer receive daily question emails.");
  } catch (error) {
    console.error("Unsubscribe failed", error);
    return page("Something went wrong", "Please try again later.");
  }
}
