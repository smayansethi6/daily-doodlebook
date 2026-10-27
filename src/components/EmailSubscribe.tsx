import { useState, type FormEvent } from "react";

export default function EmailSubscribe() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Please try again later.");
      setDone(true);
      setEmail("");
      setMessage("Check your inbox to confirm your subscription.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border-t border-foreground/20 pt-5" aria-labelledby="email-subscribe-heading">
      <h2 id="email-subscribe-heading" className="text-editorial text-xl font-bold">Get the daily question by email</h2>
      <p className="mt-1 text-sm text-foreground/70">One question each morning. Follow the link to share your answer. Unsubscribe anytime.</p>
      {!done && <form onSubmit={subscribe} className="mt-3 flex max-w-md flex-wrap gap-2">
        <label htmlFor="subscribe-email" className="sr-only">Email address</label>
        <input id="subscribe-email" type="email" required autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" className="min-w-0 flex-1 border border-foreground/40 bg-card px-3 py-2 text-sm" />
        <button type="submit" disabled={busy} className="bg-foreground px-4 py-2 text-sm text-background disabled:opacity-60">{busy ? "Sending…" : "Subscribe"}</button>
      </form>}
      {message && <p role="status" className="mt-2 text-sm">{message}</p>}
    </section>
  );
}
