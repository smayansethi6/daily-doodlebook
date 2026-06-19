import { supabase } from "@/lib/supabase";

export interface Question {
  id: string;
  question: string;
  category: string;
}

const DAILY_QUESTION_KEY = "daily-doodlebook-daily-question";

interface StoredDailyQuestion {
  date: string;
  savedAt: string;
  question: Question;
}

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

export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCachedDailyQuestion(): Question | undefined {
  const stored = readJSON<StoredDailyQuestion>(DAILY_QUESTION_KEY);
  if (!stored || stored.date !== getTodayDateKey()) {
    return undefined;
  }

  return stored.question;
}

function saveDailyQuestion(question: Question) {
  if (typeof window === "undefined") return;

  const payload: StoredDailyQuestion = {
    date: getTodayDateKey(),
    savedAt: new Date().toISOString(),
    question,
  };

  window.localStorage.setItem(DAILY_QUESTION_KEY, JSON.stringify(payload));
}

export async function fetchDailyQuestion(): Promise<Question | undefined> {
  const cached = getCachedDailyQuestion();
  if (cached) {
    return cached;
  }

  const { data, error } = await supabase.rpc<Question[]>("get_daily_question", {
    target_date: getTodayDateKey(),
  });

  if (error) {
    console.error("Unable to load today's question", error);
    return undefined;
  }

  const question = data?.[0];
  if (question) {
    saveDailyQuestion(question);
  }

  return question;
}

export interface ResponseRecord {
  id: string;
  question_id: string;
  category: string;
  response: string;
  created_at: string;
}

export async function submitResponse(
  questionId: string,
  category: string,
  response: string
): Promise<ResponseRecord> {
  const { data, error } = await supabase
    .from("responses")
    .insert({ question_id: questionId, category, response })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchResponsesByIds(ids: string[]) {
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("responses")
    .select("id, response, created_at, category, question:questions(*)")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export function getTodayDateString(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getIssueNumber(): number {
  const start = new Date("2026-01-01");
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}
