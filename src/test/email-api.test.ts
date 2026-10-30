import { describe, expect, it } from "vitest";
import { POST as subscribe } from "../../api/subscribe";
import { GET as sendDaily } from "../../api/send-daily-question";
import { GET as unsubscribePage } from "../../api/email-unsubscribe";
import { dailyEmail } from "../../api/_lib/daily-email";

describe("daily email API guards", () => {
  it("rejects invalid signup addresses without accessing the mailing list", async () => {
    const response = await subscribe(new Request("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    }));
    expect(response.status).toBe(400);
  });

  it("rejects unauthenticated cron requests", async () => {
    const response = await sendDaily(new Request("http://localhost/api/send-daily-question"));
    expect(response.status).toBe(401);
  });

  it("does not show an unsubscribe action without a token", async () => {
    const response = await unsubscribePage(new Request("http://localhost/api/email-unsubscribe"));
    expect(await response.text()).not.toContain('<form method="post"');
  });
});

describe("daily email", () => {
  const base = { date: "2026-10-30", answerUrl: "https://thinkphil.com/?utm_source=daily_email", unsubscribeUrl: "https://thinkphil.com/api/email-unsubscribe?token=t" };

  it("links each stance to the site and escapes the question", () => {
    const { html, text } = dailyEmail({ ...base, question: { question: "Is <b>this</b> fair?", category: "Ethics" } });
    expect(html).toContain("Is &lt;b&gt;this&lt;/b&gt; fair?");
    expect(html).toContain("utm_source=daily_email&amp;stance=-2");
    expect(html).toContain("Strongly agree");
    expect(text).toContain("Strongly disagree: https://thinkphil.com/?utm_source=daily_email&stance=-2");
  });

  it("omits stance links when the question has no stance scale", () => {
    const { html } = dailyEmail({ ...base, question: { question: "Why?", stance_enabled: false } });
    expect(html).not.toContain("stance=");
  });
});
