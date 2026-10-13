import { getDayKey, getTodayDateKey } from "@/lib/time";

export interface LocalResponseEntry {
  id: string;
  questionId: string;
  category: string;
  question: string;
  response: string;
  createdAt: string;
  stance: number | null;
  shareConsent: boolean;
}

const LOG_KEY = "thinkphil-response-log";
const DRAFT_KEY = "thinkphil-draft";
const LEGACY_LOG_KEY = "daily-doodlebook-response-log";
const LEGACY_IDS_KEY = "daily-doodlebook-response-ids";

export const RESPONSE_HISTORY_EVENT = "thinkphil-responses-updated";

function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("Unable to parse localStorage key", key, error);
    return null;
  }
}

function migrateLegacyKeys() {
  if (typeof window === "undefined") return;

  const legacy = window.localStorage.getItem(LEGACY_LOG_KEY);
  if (legacy) {
    if (!window.localStorage.getItem(LOG_KEY)) {
      window.localStorage.setItem(LOG_KEY, legacy);
    }
    window.localStorage.removeItem(LEGACY_LOG_KEY);
  }

  window.localStorage.removeItem(LEGACY_IDS_KEY);
}

export function persistLocalResponse(entry: LocalResponseEntry) {
  if (typeof window === "undefined") return;
  migrateLegacyKeys();

  const history = readJSON<LocalResponseEntry[]>(LOG_KEY) ?? [];
  history.push(entry);
  window.localStorage.setItem(LOG_KEY, JSON.stringify(history));

  window.dispatchEvent(new CustomEvent(RESPONSE_HISTORY_EVENT));
}

export function loadLocalResponseHistory(): LocalResponseEntry[] {
  migrateLegacyKeys();
  const history = readJSON<LocalResponseEntry[]>(LOG_KEY) ?? [];
  return history.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getTodayEntry(): LocalResponseEntry | undefined {
  const today = getTodayDateKey();
  return loadLocalResponseHistory().find((entry) => getDayKey(new Date(entry.createdAt)) === today);
}

export function hasLocalResponseForToday(): boolean {
  return Boolean(getTodayEntry());
}

/** Consecutive answered days ending today or yesterday, counted in Dubai days. */
export function getStreak(): number {
  const days = new Set(
    loadLocalResponseHistory().map((entry) => getDayKey(new Date(entry.createdAt)))
  );
  if (!days.size) return 0;

  const cursor = new Date();
  if (!days.has(getDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(getDayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(getDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function exportHistoryAsText(): string {
  const history = loadLocalResponseHistory();
  const header = [
    "ThinkPhil — my reflections",
    `Exported ${new Date().toLocaleString("en-GB")}`,
    `${history.length} ${history.length === 1 ? "entry" : "entries"}`,
    "",
  ];

  const body = history.map((entry) =>
    [
      new Date(entry.createdAt).toLocaleString("en-GB"),
      entry.category,
      entry.question,
      "",
      entry.response,
      "",
      "—".repeat(40),
      "",
    ].join("\n")
  );

  return [...header, ...body].join("\n");
}

interface StoredDraft {
  date: string;
  text: string;
}

export function saveDraft(text: string) {
  if (typeof window === "undefined") return;
  const payload: StoredDraft = { date: getTodayDateKey(), text };
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

export function loadDraft(): string {
  const draft = readJSON<StoredDraft>(DRAFT_KEY);
  if (!draft || draft.date !== getTodayDateKey()) return "";
  return draft.text;
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}
