import { createClient } from "@/lib/supabase/server";
import {
  getMonthHeatmap,
  getPersonalRecords,
  getWeeklyVolumeChart,
  muscleGroupBreakdown,
} from "@/lib/workouts";
import { HabitGrid } from "@/components/habit-grid";
import { MuscleDonutChart, WeeklyVolumeChart } from "@/components/stats-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [volumeChart, prs, heatmapDates] = await Promise.all([
    getWeeklyVolumeChart(user.id),
    getPersonalRecords(user.id),
    getMonthHeatmap(user.id),
  ]);

  const { data: allExercises } = await supabase
    .from("exercises")
    .select("name")
    .eq("user_id", user.id);

  const muscleData = muscleGroupBreakdown(allExercises ?? []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Statistika</h1>
        <p className="text-[var(--color-muted-foreground)]">
          Grafikai, asmeniniai rekordai ir progresas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Savaitės tūris (8 sav.)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <WeeklyVolumeChart data={volumeChart} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asmeniniai rekordai</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prs.map((pr) => {
              const goal = pr.goalKg ?? 0;
              const pct =
                goal > 0 ? Math.min(100, Math.round(((pr.maxKg ?? 0) / goal) * 100)) : 0;
              return (
                <div key={pr.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{pr.name}</span>
                    <span>
                      {pr.maxKg} kg
                      {goal ? ` / ${goal} kg` : ""}
                    </span>
                  </div>
                  {goal > 0 && <Progress value={pct} />}
                  {pr.date && (
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {pr.date}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raumenų grupės</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <MuscleDonutChart data={muscleData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mėnesio heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <HabitGrid trainedDates={[...heatmapDates]} />
          <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
            Žalia = treniruota, pilka = poilsis
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
