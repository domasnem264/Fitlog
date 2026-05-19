# RLS politikos

Supabase → Authentication → Policies — kiekvienai lentelei:

- **Policy Name:** `users can access own [table name]`
- **Policy Command:** ALL
- **using:** `auth.uid() = user_id`
- **with check:** `auth.uid() = user_id`

Pakartok: `workouts`, `exercises`, `meals`, `supplements`, `user_goals`.
