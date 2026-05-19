# FitLog — Sporto & Mitybos Tracker

Next.js · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Vercel

## Greitas startas

1. **Supabase** — paleisk SQL skriptus `sql/` aplanke eilės tvarka (`001` → `004`), tada sukurk RLS politikas (`005_rls_policies.md`).
2. **Auth** — Authentication → Providers: išjunk „Confirm email“, jei nori registruotis be patvirtinimo.
3. **Env** — nukopijuok `.env.example` į `.env.local` ir įrašyk Supabase URL + anon raktą.
4. **Įdiegimas:**

```bash
cd fitlog
npm install
npm run dev
```

Atidaryk [http://localhost:3000](http://localhost:3000).

## Puslapiai

| Puslapis | URL |
|----------|-----|
| Prisijungimas | `/login` |
| Registracija | `/signup` |
| Dashboard | `/dashboard` |
| Treniruotės | `/workouts` |
| Nauja treniruotė | `/workouts/new` |
| Mityba | `/nutrition` |
| Statistika | `/stats` |
| Nustatymai | `/settings` |

## Deploy (Vercel)

Pridėk aplinkos kintamuosius `NEXT_PUBLIC_SUPABASE_URL` ir `NEXT_PUBLIC_SUPABASE_ANON_KEY`, tada Supabase → Authentication → URL Configuration: Site URL ir Redirect URLs (Vercel + `http://localhost:3000`).

## Struktūra

Pagal build planą: vienas `(app)` layout su sidebar; `/login` ir `/signup` be sidebar. Middleware saugo apsaugotus maršrutus.
