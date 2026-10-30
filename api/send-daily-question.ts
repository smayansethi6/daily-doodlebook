import { dailyEmail, type EmailQuestion } from "./_lib/daily-email.js";
import { dubaiDate, emailConfig, emailDb, sendEmail } from "./_lib/email.js";

export const config = { maxDuration: 60 };

export async function GET(request: Request): Promise<Response> {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const db = emailDb();
    const date = dubaiDate();
    const { data: questions, error: questionError } = await db.rpc("get_daily_question", { target_date: date });
    if (questionError) throw questionError;
    const question = questions?.[0] as EmailQuestion | undefined;
    if (!question?.question) throw new Error(`No daily question for ${date}`);

    // Fetch at most 101 so an unexpectedly large list fails visibly before sending.
    const { data: subscribers, error: subscriberError } = await db.from("email_subscribers")
      .select("id,email,unsubscribe_token").eq("status", "active").order("id").limit(101);
    if (subscriberError) throw subscriberError;
    if ((subscribers?.length ?? 0) > 100) throw new Error("More than 100 active subscribers; add a queued sender before enabling this list size");

    const siteUrl = emailConfig().siteUrl;
    const answerUrl = `${siteUrl}/?utm_source=daily_email&utm_medium=email&utm_campaign=daily_question`;
    let sent = 0;
    let failed = 0;
    for (const subscriber of subscribers ?? []) {
      const { data: prior, error: priorError } = await db.from("daily_email_deliveries")
        .select("subscriber_id").eq("subscriber_id", subscriber.id).eq("question_date", date).maybeSingle();
      if (priorError) throw priorError;
      if (prior) continue;

      const unsubscribeUrl = `${siteUrl}/api/email-unsubscribe?token=${subscriber.unsubscribe_token}`;
      const { subject, html, text } = dailyEmail({ question, date, answerUrl, unsubscribeUrl });
      try {
        await sendEmail({ to: subscriber.email, subject, html, text, idempotencyKey: `daily-${date}-${subscriber.id}` });
        const { error: deliveryError } = await db.from("daily_email_deliveries").insert({ subscriber_id: subscriber.id, question_date: date });
        if (deliveryError && deliveryError.code !== "23505") throw deliveryError;
        sent += 1;
      } catch (error) {
        console.error("Daily email failed", { subscriberId: subscriber.id, date, error });
        failed += 1;
      }
    }
    return Response.json({ date, sent, failed }, { status: failed ? 503 : 200 });
  } catch (error) {
    console.error("Daily email run failed", error);
    return Response.json({ error: "Daily email run failed" }, { status: 503 });
  }
}
