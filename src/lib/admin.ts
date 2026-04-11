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

export async function updateQuestion(id: string, question: string, category: string) {
  const { data, error } = await supabase
    .from("questions")
    .update({ question, category })
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
