import { supabase } from "@/lib/supabase";
import { getTodayDateKey } from "@/lib/time";

export interface Question {
  id: string;
  question: string;
  category: string;
  stance_enabled?: boolean;
  stance_label_low?: string | null;
  stance_label_high?: string | null;
}

/**
 * "cache" is today's question read back from this device — the normal fast
 * path. "stale" and "fallback" mean the network failed and the visitor is
 * seeing something older or bundled, which the page tells them about.
 */
export type QuestionSource = "network" | "cache" | "stale" | "fallback";

export interface DailyQuestion {
  question: Question;
  source: QuestionSource;
}

const DAILY_QUESTION_KEY = "thinkphil-daily-question";
const LEGACY_DAILY_QUESTION_KEY = "daily-doodlebook-daily-question";

/**
 * Bundled with the app so a visitor always has something to answer, even with
 * the network down. Its id is not a real row, so entries against it stay local.
 */
export const FALLBACK_QUESTION: Question = {
  id: "fallback-evergreen",
  question: "What is something you believe today that you did not believe a year ago?",
  category: "Self",
  stance_enabled: false,
};

export function isFallbackQuestion(question: Question | undefined): boolean {
  return question?.id === FALLBACK_QUESTION.id;
}

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

function getCachedDailyQuestion(): StoredDailyQuestion | null {
  return (
    readJSON<StoredDailyQuestion>(DAILY_QUESTION_KEY) ??
    readJSON<StoredDailyQuestion>(LEGACY_DAILY_QUESTION_KEY)
  );
}

function saveDailyQuestion(question: Question) {
  if (typeof window === "undefined") return;

  const payload: StoredDailyQuestion = {
    date: getTodayDateKey(),
    savedAt: new Date().toISOString(),
    question,
  };

  window.localStorage.setItem(DAILY_QUESTION_KEY, JSON.stringify(payload));
  window.localStorage.removeItem(LEGACY_DAILY_QUESTION_KEY);
}

const RETRY_DELAYS_MS = [400, 1200, 3000];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadQuestionFromNetwork(): Promise<Question | undefined> {
  const { data, error } = await supabase.rpc("get_daily_question", {
    target_date: getTodayDateKey(),
  });

  if (error) throw error;
  return (data as Question[] | null)?.[0];
}

/**
 * Three attempts with backoff, then today's cached question, then the bundled
 * evergreen one. Never resolves to nothing: the page always has a question.
 */
export async function fetchDailyQuestion(): Promise<DailyQuestion> {
  const cached = getCachedDailyQuestion();
  if (cached?.date === getTodayDateKey()) {
    return { question: cached.question, source: "cache" };
  }

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const question = await loadQuestionFromNetwork();
      if (question) {
        saveDailyQuestion(question);
        return { question, source: "network" };
      }
      break;
    } catch (error) {
      console.error(`Unable to load today's question (attempt ${attempt + 1})`, error);
      if (attempt < RETRY_DELAYS_MS.length - 1) {
        await wait(RETRY_DELAYS_MS[attempt]);
      }
    }
  }

  if (cached) {
    return { question: cached.question, source: "stale" };
  }

  return { question: FALLBACK_QUESTION, source: "fallback" };
}

export interface ResponseRecord {
  id: string;
  question_id: string;
  category: string;
  response: string;
  stance: number | null;
  created_at: string;
}

export interface SubmitResponseInput {
  questionId: string;
  category: string;
  response: string;
  stance: number | null;
  shareConsent: boolean;
  moderationStatus: "pending" | "rejected";
  moderationReason?: string;
}

// Visitors may insert into responses but not read it back, and Postgres applies
// SELECT policies to INSERT ... RETURNING, so an .insert().select() would be
// rejected. The id is generated here instead and the record built locally.
export async function submitResponse(input: SubmitResponseInput): Promise<ResponseRecord> {
  const record: ResponseRecord = {
    id: crypto.randomUUID(),
    question_id: input.questionId,
    category: input.category,
    response: input.response,
    stance: input.stance,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("responses").insert({
    id: record.id,
    question_id: record.question_id,
    category: record.category,
    response: record.response,
    stance: record.stance,
    share_consent: input.shareConsent,
    moderation_status: input.moderationStatus,
    moderation_reason: input.moderationReason ?? null,
  });

  if (error) throw error;
  return record;
}

export interface StanceCounts {
  /** Index 0..4 maps to stance −2..2. */
  buckets: number[];
  withStance: number;
  noStance: number;
  total: number;
}

export async function fetchStanceCounts(questionId: string): Promise<StanceCounts> {
  const { data, error } = await supabase.rpc("stance_counts", { p_question_id: questionId });
  if (error) throw error;

  const buckets = [0, 0, 0, 0, 0];
  let noStance = 0;

  ((data as { stance_value: number | null; response_count: number }[] | null) ?? []).forEach(
    (row) => {
      const count = Number(row.response_count);
      if (row.stance_value === null) {
        noStance += count;
        return;
      }
      buckets[row.stance_value + 2] += count;
    }
  );

  const withStance = buckets.reduce((sum, value) => sum + value, 0);
  return { buckets, withStance, noStance, total: withStance + noStance };
}

export interface OtherSideReflection {
  response_id: string;
  excerpt: string;
  stance_value: number;
}

export async function fetchOtherSide(
  questionId: string,
  opposingSign: -1 | 1,
  excludeIds: string[]
): Promise<OtherSideReflection | undefined> {
  const { data, error } = await supabase.rpc("other_side", {
    p_question_id: questionId,
    p_opposing_sign: opposingSign,
    p_exclude_ids: excludeIds,
  });

  if (error) throw error;
  return (data as OtherSideReflection[] | null)?.[0];
}

export async function reportResponse(responseId: string): Promise<void> {
  const { error } = await supabase.rpc("report_response", { p_response_id: responseId });
  if (error) throw error;
}
