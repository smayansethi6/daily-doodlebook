export const RESET_TIMEZONE = "Asia/Dubai";
export const RESET_LABEL = "00:00 GST (UTC+4)";

const DAY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: RESET_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const LABEL_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: RESET_TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Calendar date in Dubai, as YYYY-MM-DD. One shared "today" for every visitor. */
export function getDayKey(date: Date = new Date()): string {
  return DAY_FORMATTER.format(date);
}

export function getTodayDateKey(): string {
  return getDayKey();
}

export function getTodayDateLabel(): string {
  return LABEL_FORMATTER.format(new Date());
}

export function isToday(value: string | Date): boolean {
  const date = typeof value === "string" ? new Date(value) : value;
  return getDayKey(date) === getTodayDateKey();
}

export function msUntilNextReset(from: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: RESET_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(from);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const elapsed = (get("hour") % 24) * 3600_000 + get("minute") * 60_000 + get("second") * 1000;
  return 86_400_000 - elapsed;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
