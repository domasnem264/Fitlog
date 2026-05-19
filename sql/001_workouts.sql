create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  notes text,
  date date not null default current_date,
  duration_min int,
  created_at timestamptz default now()
);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts on delete cascade not null,
  user_id uuid references auth.users not null,
  name text not null,
  sets int,
  reps int,
  weight_kg numeric,
  created_at timestamptz default now()
);
