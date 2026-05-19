import "server-only";

import { calcVolume } from "@/lib/utils";
import type { Exercise, Workout, WorkoutWithExercises } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export function workoutVolume(exercises: Exercise[]): number {
  return exercises.reduce(
    (sum, e) => sum + calcVolume(e.sets, e.reps, e.weight_kg),
    0
  );
}

export async function getWorkoutsWithExercises(
  userId: string
): Promise<WorkoutWithExercises[]> {
  const supabase = await createClient();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (!workouts?.length) return [];

  const workoutIds = workouts.map((w: Workout) => w.id);
  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .in("workout_id", workoutIds);

  const byWorkout = new Map<string, Exercise[]>();
  (exercises ?? []).forEach((e: Exercise) => {
    const list = byWorkout.get(e.workout_id) ?? [];
    list.push(e);
    byWorkout.set(e.workout_id, list);
  });

  const maxByName = await getMaxWeightByExerciseName(userId);

  return workouts.map((w: Workout) => {
    const ex = byWorkout.get(w.id) ?? [];
    const totalVolume = workoutVolume(ex);
    const hasPr = ex.some(
      (e) =>
        e.weight_kg != null &&
        e.weight_kg >= (maxByName.get(e.name) ?? 0) &&
        e.weight_kg === maxByName.get(e.name)
    );
    return {
      ...w,
      exercises: ex,
      totalVolume,
      exerciseCount: ex.length,
      hasPr,
    };
  });
}

export async function getMaxWeightByExerciseName(
  userId: string
): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("name, weight_kg")
    .eq("user_id", userId);

  const map = new Map<string, number>();
  (data ?? []).forEach((row: { name: string; weight_kg: number | null }) => {
    const w = row.weight_kg ?? 0;
    map.set(row.name, Math.max(map.get(row.name) ?? 0, w));
  });
  return map;
}

export async function getCurrentStreak(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workouts")
    .select("date")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (!data?.length) return 0;

  const dates = [...new Set(data.map((w: { date: string }) => w.date))].sort(
    (a, b) => b.localeCompare(a)
  );

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const start = dates[0];
  if (start !== today && start !== yesterday) return 0;

  let streak = 0;
  const cursor = new Date(start + "T12:00:00");

  for (const dateStr of dates) {
    const expected = cursor.toISOString().slice(0, 10);
    if (dateStr !== expected) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function getWeeklyStats(userId: string) {
  const supabase = await createClient();
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  const mondayStr = monday.toISOString().slice(0, 10);

  const { data: weekWorkouts } = await supabase
    .from("workouts")
    .select("id, date")
    .eq("user_id", userId)
    .gte("date", mondayStr);

  const ids = (weekWorkouts ?? []).map((w: { id: string }) => w.id);
  let weeklyVolume = 0;

  if (ids.length) {
    const { data: ex } = await supabase
      .from("exercises")
      .select("sets, reps, weight_kg")
      .in("workout_id", ids);
    weeklyVolume = workoutVolume((ex ?? []) as Exercise[]);
  }

  return {
    workoutCount: weekWorkouts?.length ?? 0,
    weeklyVolume,
  };
}

export async function getNewPrsThisMonth(userId: string): Promise<number> {
  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const monthStart = startOfMonth.toISOString().slice(0, 10);

  const { data: monthEx } = await supabase
    .from("exercises")
    .select("name, weight_kg, created_at")
    .eq("user_id", userId)
    .gte("created_at", monthStart);

  if (!monthEx?.length) return 0;

  const maxBefore = await getMaxWeightByExerciseName(userId);
  let prCount = 0;
  const seen = new Set<string>();

  for (const row of monthEx as Exercise[]) {
    if (!row.weight_kg || seen.has(row.name)) continue;
    const prev = maxBefore.get(row.name) ?? 0;
    if (row.weight_kg >= prev && row.created_at >= monthStart) {
      prCount++;
      seen.add(row.name);
    }
  }

  return prCount;
}

export async function getWeeklyVolumeChart(userId: string, weeks = 8) {
  const supabase = await createClient();
  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, date")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (!workouts?.length) {
    return Array.from({ length: weeks }, (_, i) => ({
      week: `W${weeks - i}`,
      volume: 0,
    }));
  }

  const ids = workouts.map((w: { id: string }) => w.id);
  const { data: exercises } = await supabase
    .from("exercises")
    .select("workout_id, sets, reps, weight_kg")
    .in("workout_id", ids);

  const workoutDate = new Map(
    workouts.map((w: { id: string; date: string }) => [w.id, w.date])
  );

  const buckets = new Map<string, number>();
  (exercises ?? []).forEach(
    (e: {
      workout_id: string;
      sets: number | null;
      reps: number | null;
      weight_kg: number | null;
    }) => {
      const date = workoutDate.get(e.workout_id);
      if (!date) return;
      const d = new Date(date + "T12:00:00");
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(
        ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
      );
      const key = `${d.getFullYear()}-W${week}`;
      buckets.set(
        key,
        (buckets.get(key) ?? 0) +
          calcVolume(e.sets, e.reps, e.weight_kg)
      );
    }
  );

  const keys = [...buckets.keys()].sort().slice(-weeks);
  while (keys.length < weeks) {
    keys.unshift(`—${keys.length}`);
  }

  return keys.map((k) => ({
    week: k.includes("W") ? k.split("-")[1] ?? k : k,
    volume: buckets.get(k) ?? 0,
  }));
}

export async function getPersonalRecords(userId: string) {
  const supabase = await createClient();
  const names = [
    "Pritūpimai",
    "Deadlift",
    "Stūmimas gulint",
    "Overhead Press",
  ];

  const { data: goals } = await supabase
    .from("user_goals")
    .select("squat_goal_kg, bench_goal_kg, deadlift_goal_kg")
    .eq("user_id", userId)
    .maybeSingle();

  const goalMap: Record<string, number | null> = {
    Pritūpimai: goals?.squat_goal_kg ?? null,
    Deadlift: goals?.deadlift_goal_kg ?? null,
    "Stūmimas gulint": goals?.bench_goal_kg ?? null,
    "Overhead Press": null,
  };

  const results = [];
  for (const name of names) {
    const { data } = await supabase
      .from("exercises")
      .select("weight_kg, created_at")
      .eq("user_id", userId)
      .eq("name", name)
      .order("weight_kg", { ascending: false })
      .limit(1)
      .maybeSingle();

    results.push({
      name,
      maxKg: data?.weight_kg ?? 0,
      date: data?.created_at?.slice(0, 10) ?? null,
      goalKg: goalMap[name],
    });
  }

  return results;
}

export async function getMonthHeatmap(userId: string) {
  const supabase = await createClient();
  const start = new Date();
  start.setDate(1);
  const monthStart = start.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("workouts")
    .select("date")
    .eq("user_id", userId)
    .gte("date", monthStart);

  return new Set((data ?? []).map((w: { date: string }) => w.date));
}

export function muscleGroupBreakdown(exercises: { name: string }[]) {
  const groups: Record<string, number> = {
    Kojos: 0,
    Krūtinė: 0,
    Nugaros: 0,
    Pečiai: 0,
    Rankos: 0,
  };

  const rules: [RegExp, keyof typeof groups][] = [
    [/squat|lunge|pritūp|koj/i, "Kojos"],
    [/deadlift|row|trauk|nugar/i, "Nugaros"],
    [/press|fly|stūm|krūt/i, "Krūtinė"],
    [/overhead|peč|shoulder/i, "Pečiai"],
    [/curl|tricep|bicep|rank/i, "Rankos"],
  ];

  exercises.forEach((e) => {
    let matched = false;
    for (const [re, group] of rules) {
      if (re.test(e.name)) {
        groups[group]++;
        matched = true;
        break;
      }
    }
    if (!matched) groups["Rankos"]++;
  });

  const total = Object.values(groups).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(groups).map(([name, value]) => ({
    name,
    value: Math.round((value / total) * 100),
  }));
}
