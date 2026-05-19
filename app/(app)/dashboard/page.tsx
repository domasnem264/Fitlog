import Link from "next/link";
import { format } from "date-fns";
import { lt } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentStreak,
  getNewPrsThisMonth,
  getWeeklyStats,
  getWorkoutsWithExercises,
} from "@/lib/workouts";
import { getTodayMeals, getUserGoals, sumMacros } from "@/lib/nutrition";
import { MacroCard } from "@/components/macro-tracker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [streak, weekly, prs, workouts, goals, meals] = await Promise.all([
    getCurrentStreak(user.id),
    getWeeklyStats(user.id),
    getNewPrsThisMonth(user.id),
    getWorkoutsWithExercises(user.id),
    getUserGoals(user.id),
    getTodayMeals(user.id),
  ]);

  const recent = workouts.slice(0, 4);
  const macros = sumMacros(meals);
  const g = goals ?? {
    daily_calories: 2800,
    daily_protein_g: 210,
    daily_carbs_g: 315,
    daily_fat_g: 78,
  };

  const summaryCards = [
    { label: "Serija", value: `${streak} d.`, sub: "iš eilės" },
    { label: "Šios savaitės treniruotės", value: String(weekly.workoutCount), sub: "Mon–Sk" },
    {
      label: "Savaitės tūris",
      value: `${Math.round(weekly.weeklyVolume).toLocaleString("lt-LT")} kg`,
      sub: "bendras",
    },
    { label: "Nauji PR šį mėn.", value: String(prs), sub: "pratimai" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--color-muted-foreground)]">
          Apžvalga ir šios dienos progresas
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.value}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Paskutinės treniruotės</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length ? (
              recent.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{w.name}</p>
                    <p className="text-[var(--color-muted-foreground)]">
                      {format(new Date(w.date), "yyyy-MM-dd", { locale: lt })}
                      {w.duration_min ? ` · ${w.duration_min} min` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {Math.round(w.totalVolume).toLocaleString("lt-LT")} kg
                    </p>
                    {w.hasPr && <Badge className="mt-1">PR</Badge>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Dar nėra treniruočių.{" "}
                <Link href="/workouts/new" className="text-[var(--color-primary)]">
                  Pridėk pirmą
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Šiandienos mityba</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <MacroCard label="Kalorijos" current={macros.calories} goal={g.daily_calories} />
            <MacroCard
              label="Baltymai"
              current={macros.protein}
              goal={g.daily_protein_g}
              unit=" g"
            />
            <MacroCard
              label="Angliavandeniai"
              current={macros.carbs}
              goal={g.daily_carbs_g}
              unit=" g"
            />
            <MacroCard label="Riebalai" current={macros.fat} goal={g.daily_fat_g} unit=" g" />
          </div>
        </div>
      </div>
    </div>
  );
}
