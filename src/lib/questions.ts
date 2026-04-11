import { supabase } from "@/lib/supabase";

export interface Question {
  id: string;
  question: string;
  category: string;
}

export async function fetchDailyQuestion(): Promise<Question | undefined> {
  const { data, error } = await supabase.rpc<Question[]>("get_random_question");

  if (error) {
    console.error("Unable to load today's question", error);
    return undefined;
  }

  return data?.[0] ?? undefined;
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
