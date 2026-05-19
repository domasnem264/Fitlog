create table user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  daily_calories int default 2800,
  daily_protein_g int default 210,
  daily_carbs_g int default 315,
  daily_fat_g int default 78,
  squat_goal_kg numeric,
  bench_goal_kg numeric,
  deadlift_goal_kg numeric,
  created_at timestamptz default now()
);
