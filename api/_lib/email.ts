import { createClient } from "@supabase/supabase-js";

export function emailConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const siteUrl = process.env.SITE_URL;
  if (!url || !key || !resendKey || !from || !siteUrl) {
    throw new Error("Email is not configured");
  }
  return { url, key, resendKey, from, siteUrl: siteUrl.replace(/\/$/, "") };
}

export function emailDb() {
  const { url, key } = emailConfig();
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function page(title: string, message: string, action?: { label: string; url: string; token: string }) {
  const form = action
    ? `<form method="post" action="${action.url}"><input type="hidden" name="token" value="${action.token}"><button type="submit">${action.label}</button></form>`
    : "";
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · ThinkPhil</title><style>body{font:18px/1.5 Georgia,serif;background:#efe9df;color:#29231e;max-width:36rem;margin:10vh auto;padding:1.5rem}button{font:inherit;padding:.6rem 1rem;cursor:pointer}a{color:inherit}</style><h1>${title}</h1><p>${message}</p>${form}<p><a href="/">Back to ThinkPhil</a></p></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

export async function sendEmail(input: { to: string; subject: string; html: string; text: string; idempotencyKey: string }) {
  const { resendKey, from } = emailConfig();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, text: input.text }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}: ${await response.text()}`);
}

export function dubaiDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
