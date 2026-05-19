import { createClient } from "@/lib/supabase/server";
import type { Meal, Supplement, UserGoals } from "@/lib/types";

export const MEAL_SLOTS = [
  { time_label: "Pusryčiai", defaultTime: "07:00" },
  { time_label: "Prieštreniruotinis", defaultTime: "10:30" },
  { time_label: "Potreniruotinis", defaultTime: "14:30" },
  { time_label: "Vakarienė", defaultTime: "18:00" },
  { time_label: "Prieš miegą", defaultTime: "21:00" },
] as const;

export async function getUserGoals(userId: string): Promise<UserGoals | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_goals")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function getTodayMeals(userId: string): Promise<Meal[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today);
  return data ?? [];
}

export function sumMacros(meals: Meal[]) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + Number(m.protein_g ?? 0),
      carbs: acc.carbs + Number(m.carbs_g ?? 0),
      fat: acc.fat + Number(m.fat_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export async function getActiveSupplements(userId: string): Promise<Supplement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplements")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("timing");
  return data ?? [];
}

export function restDayGoals(goals: UserGoals): UserGoals {
  return {
    ...goals,
    daily_calories: goals.daily_calories - 300,
    daily_carbs_g: Math.max(0, goals.daily_carbs_g - 40),
  };
}
