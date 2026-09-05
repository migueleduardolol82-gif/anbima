import type { Attempt } from "./types";
import { getSupabase } from "./supabase";

const LOCAL_KEY = "anbima-cpro-attempts";

export async function loadAttempts(userId?: string): Promise<Attempt[]> {
  const supabase = getSupabase();
  if (supabase && userId) {
    const { data, error } = await supabase.from("attempts").select("payload").eq("user_id", userId).order("created_at", { ascending: false });
    if (!error) return (data ?? []).map((row) => row.payload as Attempt);
  }
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]") as Attempt[]; } catch { return []; }
}

export async function saveAttempt(attempt: Attempt, userId?: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase && userId) {
    const { error } = await supabase.from("attempts").insert({ id: attempt.id, user_id: userId, exam: attempt.exam, score: attempt.percentage, payload: attempt });
    if (!error) return;
  }
  const current = await loadAttempts();
  localStorage.setItem(LOCAL_KEY, JSON.stringify([attempt, ...current]));
}
