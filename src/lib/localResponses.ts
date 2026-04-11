export interface LocalResponseEntry {
  id: string;
  questionId: string;
  category: string;
  question: string;
  response: string;
  createdAt: string;
}

const LOCAL_RESPONSE_LOG_KEY = "daily-doodlebook-response-log";
const LOCAL_RESPONSE_IDS_KEY = "daily-doodlebook-response-ids";
export const RESPONSE_HISTORY_EVENT = "daily-doodlebook-responses-updated";

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

export function persistLocalResponse(entry: LocalResponseEntry) {
  if (typeof window === "undefined") return;

  const history: LocalResponseEntry[] =
    readJSON<LocalResponseEntry[]>(LOCAL_RESPONSE_LOG_KEY) ?? [];
  history.push(entry);
  window.localStorage.setItem(LOCAL_RESPONSE_LOG_KEY, JSON.stringify(history));

  const ids =
    readJSON<{ id: string; createdAt: string }[]>(LOCAL_RESPONSE_IDS_KEY) ?? [];
  ids.push({ id: entry.id, createdAt: entry.createdAt });
  window.localStorage.setItem(LOCAL_RESPONSE_IDS_KEY, JSON.stringify(ids));

  window.dispatchEvent(new CustomEvent(RESPONSE_HISTORY_EVENT));
}

export function loadLocalResponseHistory(): LocalResponseEntry[] {
  const history =
    readJSON<LocalResponseEntry[]>(LOCAL_RESPONSE_LOG_KEY) ?? [];
  return history.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function loadLocalResponseIds(): string[] {
  const ids =
    readJSON<{ id: string; createdAt: string }[]>(LOCAL_RESPONSE_IDS_KEY) ?? [];
  return ids.map((entry) => entry.id);
}

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function hasLocalResponseForDate(date: Date) {
  const target = normalizeDate(date);
  return loadLocalResponseHistory().some((entry) => {
    const entryDate = new Date(entry.createdAt);
    return normalizeDate(entryDate) === target;
  });
}
