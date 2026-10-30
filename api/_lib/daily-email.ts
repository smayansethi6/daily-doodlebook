import { colors, emailButton, emailLayout, escapeHtml, mono } from "./email.js";

export interface EmailQuestion {
  question: string;
  category?: string | null;
  stance_enabled?: boolean | null;
  stance_label_low?: string | null;
  stance_label_high?: string | null;
}

const STANCES = [-2, -1, 0, 1, 2] as const;

// Mirrors stanceLabel in src/lib/stance.ts, which the functions can't import.
function stanceLabel(question: EmailQuestion, stance: (typeof STANCES)[number]) {
  const low = question.stance_label_low?.trim();
  const high = question.stance_label_high?.trim();
  if (stance === 0) return "Unsure";
  if (stance < 0) return low ? (stance === -2 ? `Strongly: ${low}` : low) : stance === -2 ? "Strongly disagree" : "Disagree";
  return high ? (stance === 2 ? `Strongly: ${high}` : high) : stance === 2 ? "Strongly agree" : "Agree";
}

export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T12:00:00Z`));
}

/**
 * Stance links only open the site with the choice preselected; they never record
 * anything, because mail scanners follow every link in a message.
 */
export function dailyEmail(input: { question: EmailQuestion; date: string; answerUrl: string; unsubscribeUrl: string }) {
  const { question, answerUrl, unsubscribeUrl } = input;
  const withStance = (stance: number) => `${answerUrl}&stance=${stance}`;
  const showStance = question.stance_enabled !== false;

  const stanceRows = STANCES.map((stance) => `<tr><td style="padding:0 0 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${colors.paper}" style="background:${colors.paper};border:2px solid ${stance === 0 ? colors.rule : colors.ink}"><a href="${escapeHtml(withStance(stance))}" style="display:block;padding:13px 16px;font:500 15px/1.2 Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:${colors.ink};text-decoration:none">${escapeHtml(stanceLabel(question, stance))}<span style="float:right;color:${colors.ochreDeep}">&rarr;</span></a></td></tr></table></td></tr>`).join("");

  const stanceBlock = showStance
    ? `<div style="margin:0 0 10px;font:700 11px/1 ${mono};letter-spacing:.2em;text-transform:uppercase;color:${colors.ink}">Where do you stand?</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${stanceRows}</table>
<p style="margin:4px 0 28px;font-size:13px;line-height:1.5;color:${colors.muted}">Tap one and ThinkPhil opens with it already chosen. Add a few words, then see where everyone else landed.</p>`
    : "";

  const body = `${question.category ? `<div style="margin:0 0 14px;font:700 11px/1 ${mono};letter-spacing:.2em;text-transform:uppercase;color:${colors.ochreDeep}">${escapeHtml(question.category)}</div>` : ""}
<h1 style="margin:0 0 28px;font:700 30px/1.25 'Playfair Display',Georgia,'Times New Roman',serif;color:${colors.ink};letter-spacing:-.01em">${escapeHtml(question.question)}</h1>
${stanceBlock}
${emailButton(showStance ? "Or just start writing" : "Write your reflection", answerUrl)}`;

  const footer = `Your answer is anonymous. You get this because you subscribed at ThinkPhil.<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:${colors.muted};text-decoration:underline">Unsubscribe</a>`;

  const stanceText = showStance
    ? `Where do you stand?\n${STANCES.map((stance) => `- ${stanceLabel(question, stance)}: ${withStance(stance)}`).join("\n")}\n\n`
    : "";

  return {
    subject: question.question.length <= 70 ? question.question : "Today's ThinkPhil question",
    html: emailLayout({ preheader: `Today's question${question.category ? ` · ${question.category}` : ""}. Where do you stand?`, dateLabel: dateLabel(input.date), body, footer }),
    text: `Today's ThinkPhil question${question.category ? ` (${question.category})` : ""}:\n\n${question.question}\n\n${stanceText}Write your reflection: ${answerUrl}\n\nUnsubscribe: ${unsubscribeUrl}`,
  };
}
