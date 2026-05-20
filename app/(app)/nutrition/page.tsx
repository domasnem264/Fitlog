import { createClient } from "@/lib/supabase/server";
import { getActiveSupplements, getTodayMeals, getUserGoals } from "@/lib/nutrition";
import { NutritionPageClient } from "@/components/nutrition-page-client";
import type { UserGoals } from "@/lib/types";

const defaultGoals: UserGoals = {
  id: "",
  user_id: "",
  daily_calories: 2800,
  daily_protein_g: 210,
  daily_carbs_g: 315,
  daily_fat_g: 78,
  squat_goal_kg: null,
  bench_goal_kg: null,
  deadlift_goal_kg: null,
  created_at: "",
};

export default async function NutritionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [goals, meals, supplements] = await Promise.all([
    getUserGoals(user.id),
    getTodayMeals(user.id),
    getActiveSupplements(user.id),
  ]);

  return (
    <NutritionPageClient
      goals={goals ?? { ...defaultGoals, user_id: user.id }}
      initialMeals={meals}
      supplements={supplements}
    />
  );
}
