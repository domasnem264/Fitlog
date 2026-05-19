export type Workout = {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  date: string;
  duration_min: number | null;
  created_at: string;
};

export type Exercise = {
  id: string;
  workout_id: string;
  user_id: string;
  name: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  created_at: string;
};

export type Meal = {
  id: string;
  user_id: string;
  name: string;
  time_label: string | null;
  date: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  created_at: string;
};

export type Supplement = {
  id: string;
  user_id: string;
  name: string;
  dose: string | null;
  timing: string | null;
  active: boolean;
  created_at: string;
};

export type UserGoals = {
  id: string;
  user_id: string;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  squat_goal_kg: number | null;
  bench_goal_kg: number | null;
  deadlift_goal_kg: number | null;
  created_at: string;
};

export type WorkoutWithExercises = Workout & {
  exercises: Exercise[];
  totalVolume: number;
  exerciseCount: number;
  hasPr?: boolean;
};
