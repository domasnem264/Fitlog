create table meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  time_label text,
  date date not null default current_date,
  calories int,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  created_at timestamptz default now()
);
