import { colors, emailButton, emailConfig, emailDb, emailLayout, sendEmail } from "./_lib/email.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const success = { message: "If this address can subscribe, a confirmation email is on its way." };

export async function POST(request: Request): Promise<Response> {
  let email: string;
  try {
    const body = await request.json() as { email?: unknown };
    email = String(body.email ?? "").trim().toLowerCase();
  } catch {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (email.length > 254 || !EMAIL_RE.test(email)) return Response.json({ error: "Enter a valid email address." }, { status: 400 });

  try {
    const db = emailDb();
    const { data: existing, error: lookupError } = await db.from("email_subscribers")
      .select("id,status,confirmation_sent_at").eq("email", email).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing?.status === "active") return Response.json(success);
    if (existing?.confirmation_sent_at && Date.now() - new Date(existing.confirmation_sent_at).getTime() < 10 * 60_000) return Response.json(success);

    const token = crypto.randomUUID();
    const unsubscribeToken = crypto.randomUUID();
    const now = new Date().toISOString();
    const result = existing
      ? await db.from("email_subscribers").update({ status: "pending", confirmation_token: token, unsubscribe_token: unsubscribeToken, confirmation_sent_at: now, unsubscribed_at: null }).eq("id", existing.id)
      : await db.from("email_subscribers").insert({ email, confirmation_token: token, unsubscribe_token: unsubscribeToken, confirmation_sent_at: now });
    if (result.error) throw result.error;

    const link = `${emailConfig().siteUrl}/api/email-confirm?token=${token}`;
    try {
      await sendEmail({
        to: email,
        subject: "Confirm your ThinkPhil daily question emails",
        html: emailLayout({
          preheader: "One tap and tomorrow's question lands in your inbox.",
          body: `<h1 style="margin:0 0 16px;font:700 28px/1.25 'Playfair Display',Georgia,serif;color:${colors.ink}">One question a day, in your inbox.</h1><p style="margin:0 0 28px">Confirm this address and you'll get ThinkPhil's daily question each morning. You can answer it with a single tap.</p>${emailButton("Confirm subscription", link)}`,
          footer: "If you didn't ask for this, ignore this email and nothing will be sent.",
        }),
        text: `Confirm your ThinkPhil subscription: ${link}\n\nIf you did not ask for this, ignore this email.`,
        idempotencyKey: `confirm-${token}`,
      });
    } catch (error) {
      await db.from("email_subscribers").update({ confirmation_sent_at: null }).eq("confirmation_token", token);
      throw error;
    }
    return Response.json(success);
  } catch (error) {
    console.error("Subscription failed", error);
    return Response.json({ error: "We couldn't start your subscription right now. Please try again later." }, { status: 503 });
  }
}
