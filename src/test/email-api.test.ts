import { describe, expect, it } from "vitest";
import { POST as subscribe } from "../../api/subscribe";
import { GET as sendDaily } from "../../api/send-daily-question";
import { GET as unsubscribePage } from "../../api/email-unsubscribe";

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
