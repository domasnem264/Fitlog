import { createClient } from "@/lib/supabase/server";
import { getUserGoals } from "@/lib/nutrition";
import { SettingsPageClient } from "@/components/settings-page-client";
import type { UserGoals } from "@/lib/types";

const defaultGoals: UserGoals = {
  id: "",
  user_id: "",
  daily_calories: 2800,
  daily_protein_g: 210,
  daily_carbs_g: 315,
  daily_fat_g: 78,
  squat_goal_kg: 200,
  bench_goal_kg: 100,
  deadlift_goal_kg: 220,
  created_at: "",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    { data: exerciseRows },
    goals,
    { data: supplementRows },
  ] = await Promise.all([
    supabase.from("exercises").select("name").eq("user_id", user.id),
    getUserGoals(user.id),
    supabase.from("supplements").select("*").eq("user_id", user.id).order("name"),
  ]);

  const names = [
    ...new Set((exerciseRows ?? []).map((e: { name: string }) => e.name)),
  ].sort();

  return (
    <SettingsPageClient
      exerciseNames={names}
      supplements={supplementRows ?? []}
      goals={goals ?? { ...defaultGoals, user_id: user.id }}
    />
  );
}
