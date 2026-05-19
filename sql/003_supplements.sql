create table supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  dose text,
  timing text,
  active boolean default true,
  created_at timestamptz default now()
);
