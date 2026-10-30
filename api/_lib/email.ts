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

// The site's palette (src/index.css) as hex: email clients don't read CSS variables.
export const colors = { paper: "#f1ede4", card: "#e9e3d7", ink: "#1c212b", muted: "#5c6270", ochre: "#da962f", ochreDeep: "#9e691a", rule: "#c9c2b4" };
const serif = "'Playfair Display',Georgia,'Times New Roman',serif";
export const mono = "'Space Mono','Courier New',Courier,monospace";
const sans = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

/** A dark, full-width button; clients without border-radius support still show a clean block. */
export function emailButton(label: string, url: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${colors.ink}" style="background:${colors.ink};border:2px solid ${colors.ink};box-shadow:4px 4px 0 ${colors.ochre}"><a href="${escapeHtml(url)}" style="display:block;padding:16px 20px;font:700 13px/1 ${mono};letter-spacing:.12em;text-transform:uppercase;color:${colors.paper};text-decoration:none;text-align:center">${escapeHtml(label)} &rarr;</a></td></tr></table>`;
}

/**
 * Table-based so it renders in Gmail and Outlook alike. `body` is trusted HTML;
 * escape anything user- or database-supplied before passing it in.
 */
export function emailLayout(input: { preheader: string; dateLabel?: string; body: string; footer: string }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Space+Mono:wght@400;700&family=Inter:wght@400;500&display=swap" rel="stylesheet"><title>ThinkPhil</title></head>
<body style="margin:0;padding:0;background:${colors.card}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${colors.card}">${escapeHtml(input.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.card}" style="background:${colors.card}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${colors.paper};border:2px solid ${colors.ink}" bgcolor="${colors.paper}">
<tr><td style="padding:24px 28px 18px;border-bottom:2px solid ${colors.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="vertical-align:bottom"><div style="font:900 34px/1 ${serif};color:${colors.ink};letter-spacing:-.02em">ThinkPhil<span style="color:${colors.ochreDeep}">.</span></div><div style="margin-top:6px;font:400 11px/1 ${mono};letter-spacing:.12em;text-transform:uppercase;color:${colors.muted}">One question a day</div></td>
${input.dateLabel ? `<td align="right" style="vertical-align:bottom;font:400 11px/1.4 ${mono};color:${colors.muted}">${escapeHtml(input.dateLabel)}</td>` : ""}
</tr></table></td></tr>
<tr><td style="padding:32px 28px 36px;font:400 16px/1.6 ${sans};color:${colors.ink}">${input.body}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid ${colors.rule};font:400 11px/1.7 ${mono};color:${colors.muted}">${input.footer}</td></tr>
</table></td></tr></table></body></html>`;
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
