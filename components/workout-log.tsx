"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DraftExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight_kg: number;
};

export function WorkoutLogForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [exName, setExName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("8");
  const [weight, setWeight] = useState("");
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addExercise() {
    if (!exName.trim()) return;
    setExercises((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: exName.trim(),
        sets: Number(sets) || 0,
        reps: Number(reps) || 0,
        weight_kg: Number(weight) || 0,
      },
    ]);
    setExName("");
    setWeight("");
  }

  async function save() {
    if (!name.trim()) {
      setError("Įveskite treniruotės pavadinimą");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Neprisijungęs vartotojas");
      setLoading(false);
      return;
    }

    const { data: workout, error: wErr } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        name: name.trim(),
        date,
        duration_min: duration ? Number(duration) : null,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (wErr || !workout) {
      setError(wErr?.message ?? "Nepavyko išsaugoti");
      setLoading(false);
      return;
    }

    if (exercises.length) {
      const { error: eErr } = await supabase.from("exercises").insert(
        exercises.map((e) => ({
          workout_id: workout.id,
          user_id: user.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          weight_kg: e.weight_kg,
        }))
      );
      if (eErr) {
        setError(eErr.message);
        setLoading(false);
        return;
      }
    }

    router.push("/workouts");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nauja treniruotė</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Pavadinimas</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Pvz. Kojų diena"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Trukmė (min)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pratimai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Input
              className="sm:col-span-2"
              placeholder="Pratimo pavadinimas"
              value={exName}
              onChange={(e) => setExName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Serijos"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Kartai"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Svoris (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" onClick={addExercise}>
            Pridėti pratimą
          </Button>

          <ul className="divide-y divide-[var(--color-border)] rounded-lg border">
            {exercises.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>
                  <strong>{e.name}</strong> — {e.sets}×{e.reps} @ {e.weight_kg} kg
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setExercises((prev) => prev.filter((x) => x.id !== e.id))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
            {!exercises.length && (
              <li className="px-4 py-6 text-center text-sm text-[var(--color-muted-foreground)]">
                Dar nepridėta pratimų
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}

      <Button className="w-full sm:w-auto" onClick={save} disabled={loading}>
        {loading ? "Saugoma..." : "Išsaugoti treniruotę"}
      </Button>
    </div>
  );
}
