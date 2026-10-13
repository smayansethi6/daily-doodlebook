import { supabase } from "@/lib/supabase";

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error("Invalid credentials");
  }

  return { email: data.user?.email ?? email };
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}

export async function fetchQuestions() {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createQuestion(question: string, category: string) {
  const { data, error } = await supabase
    .from("questions")
    .insert({ question, category })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export interface QuestionStanceSettings {
  stance_enabled: boolean;
  stance_label_low: string | null;
  stance_label_high: string | null;
}

export async function updateQuestion(
  id: string,
  question: string,
  category: string,
  stance?: QuestionStanceSettings
) {
  const { data, error } = await supabase
    .from("questions")
    .update({ question, category, ...(stance ?? {}) })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

export interface QuestionSchedule {
  id: string;
  question_id: string;
  scheduled_date: string;
  created_at: string;
  question?: {
    id: string;
    question: string;
    category: string;
  };
}

export async function fetchQuestionSchedules() {
  const { data, error } = await supabase
    .from("question_schedules")
    .select("*, question:questions(id, question, category)")
    .order("scheduled_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addQuestionSchedule(questionId: string, scheduledDate: string) {
  const { data, error } = await supabase
    .from("question_schedules")
    .insert({ question_id: questionId, scheduled_date: scheduledDate })
    .select("*, question:questions(id, question, category)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return null;
    }
    throw error;
  }

  return data;
}

export async function deleteQuestionSchedule(id: string) {
  const { error } = await supabase.from("question_schedules").delete().eq("id", id);
  if (error) throw error;
}

interface ResponseFilter {
  category?: string;
  search?: string;
  from?: string;
  to?: string;
}

export async function fetchResponses(filters: ResponseFilter = {}) {
  const query = supabase
    .from("responses")
    .select("*, question:questions(*)")
    .order("created_at", { ascending: false });

  if (filters.category) {
    query.eq("category", filters.category);
  }

  if (filters.search) {
    query.ilike("response", `%${filters.search}%`);
  }

  if (filters.from) {
    query.gte("created_at", filters.from);
  }

  if (filters.to) {
    query.lte("created_at", filters.to);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export type ModerationStatus = "pending" | "approved" | "rejected" | "hidden";

export interface ModerationEntry {
  id: string;
  response: string;
  category: string;
  created_at: string;
  stance: number | null;
  moderation_status: ModerationStatus;
  moderation_reason: string | null;
  question?: { question: string } | null;
}

/** Only entries the visitor consented to share can ever need a decision. */
export async function fetchModerationQueue(status: ModerationStatus) {
  const { data, error } = await supabase
    .from("responses")
    .select(
      "id, response, category, created_at, stance, moderation_status, moderation_reason, question:questions(question)"
    )
    .eq("share_consent", true)
    .eq("moderation_status", status)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as ModerationEntry[];
}

export async function setModerationStatus(id: string, status: ModerationStatus) {
  const { error } = await supabase
    .from("responses")
    .update({ moderation_status: status })
    .eq("id", id);

  if (error) throw error;
}
