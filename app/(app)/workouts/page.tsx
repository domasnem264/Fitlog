import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkoutsWithExercises } from "@/lib/workouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const workouts = await getWorkoutsWithExercises(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Treniruotės</h1>
          <p className="text-[var(--color-muted-foreground)]">Istorija ir nauji įrašai</p>
        </div>
        <Button asChild>
          <Link href="/workouts/new">
            <Plus className="h-4 w-4" />
            Nauja treniruotė
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {workouts.length ? (
          workouts.map((w) => (
            <Card key={w.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{w.name}</CardTitle>
                {w.hasPr && <Badge>PR</Badge>}
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4 text-sm text-[var(--color-muted-foreground)]">
                <span>{format(new Date(w.date), "yyyy-MM-dd")}</span>
                {w.duration_min && <span>{w.duration_min} min</span>}
                <span>{w.exerciseCount} pratimai</span>
                <span className="font-medium text-[var(--color-foreground)]">
                  {Math.round(w.totalVolume).toLocaleString("lt-LT")} kg
                </span>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-[var(--color-muted-foreground)]">
              Dar nėra įrašytų treniruočių.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
