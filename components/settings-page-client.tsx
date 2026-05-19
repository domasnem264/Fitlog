"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Supplement, UserGoals } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Props = {
  exerciseNames: string[];
  supplements: Supplement[];
  goals: UserGoals;
};

export function SettingsPageClient({
  exerciseNames: initialExercises,
  supplements: initialSupplements,
  goals: initialGoals,
}: Props) {
  const [exercises, setExercises] = useState(initialExercises);
  const [newExercise, setNewExercise] = useState("");
  const [supplements, setSupplements] = useState(initialSupplements);
  const [goals, setGoals] = useState(initialGoals);
  const [supName, setSupName] = useState("");
  const [supDose, setSupDose] = useState("");
  const [supTiming, setSupTiming] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function addExercise() {
    if (!newExercise.trim()) return;
    const name = newExercise.trim();
    if (!exercises.includes(name)) {
      setExercises((prev) => [...prev, name]);
    }
    setNewExercise("");
  }

  function removeExercise(name: string) {
    setExercises((prev) => prev.filter((e) => e !== name));
  }

  async function saveGoals() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("user_goals").upsert(
      {
        user_id: user.id,
        daily_calories: goals.daily_calories,
        daily_protein_g: goals.daily_protein_g,
        daily_carbs_g: goals.daily_carbs_g,
        daily_fat_g: goals.daily_fat_g,
        squat_goal_kg: goals.squat_goal_kg,
        bench_goal_kg: goals.bench_goal_kg,
        deadlift_goal_kg: goals.deadlift_goal_kg,
      },
      { onConflict: "user_id" }
    );
    setMessage(error ? error.message : "Tikslai išsaugoti");
  }

  async function addSupplement() {
    if (!supName.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("supplements")
      .insert({
        user_id: user.id,
        name: supName.trim(),
        dose: supDose || null,
        timing: supTiming || null,
        active: true,
      })
      .select()
      .single();

    if (!error && data) {
      setSupplements((prev) => [...prev, data]);
      setSupName("");
      setSupDose("");
      setSupTiming("");
    }
  }

  async function toggleSupplement(id: string, active: boolean) {
    const supabase = createClient();
    const { data } = await supabase
      .from("supplements")
      .update({ active })
      .eq("id", id)
      .select()
      .single();
    if (data) {
      setSupplements((prev) => prev.map((s) => (s.id === id ? data : s)));
    }
  }

  async function deleteSupplement(id: string) {
    const supabase = createClient();
    await supabase.from("supplements").delete().eq("id", id);
    setSupplements((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Nustatymai</h1>
        <p className="text-[var(--color-muted-foreground)]">
          Pratimai, papildai ir tikslai
        </p>
      </div>

      {message && (
        <p className="text-sm text-[var(--color-primary)]">{message}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mano pratimai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {exercises.map((name) => (
              <li
                key={name}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                {name}
                <Button variant="ghost" size="sm" onClick={() => removeExercise(name)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              placeholder="Naujas pratimas"
              value={newExercise}
              onChange={(e) => setNewExercise(e.target.value)}
            />
            <Button type="button" onClick={addExercise}>
              Pridėti
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Papildai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {supplements.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-[var(--color-muted-foreground)]">
                  {s.dose} · {s.timing}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={s.active}
                  onCheckedChange={(v) => toggleSupplement(s.id, v)}
                />
                <Button variant="ghost" size="sm" onClick={() => deleteSupplement(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="grid gap-2 sm:grid-cols-3">
            <Input placeholder="Pavadinimas" value={supName} onChange={(e) => setSupName(e.target.value)} />
            <Input placeholder="Dozė" value={supDose} onChange={(e) => setSupDose(e.target.value)} />
            <Input placeholder="Laikas" value={supTiming} onChange={(e) => setSupTiming(e.target.value)} />
          </div>
          <Button type="button" variant="outline" onClick={addSupplement}>
            Pridėti papildą
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kalorių tikslai</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["daily_calories", "Kalorijos"],
              ["daily_protein_g", "Baltymai (g)"],
              ["daily_carbs_g", "Angliavandeniai (g)"],
              ["daily_fat_g", "Riebalai (g)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input
                type="number"
                value={goals[key]}
                onChange={(e) =>
                  setGoals((g) => ({ ...g, [key]: Number(e.target.value) }))
                }
              />
            </div>
          ))}
          <Button className="sm:col-span-2" onClick={saveGoals}>
            Išsaugoti tikslus
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asmeniniai rekordai tikslai (kg)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["squat_goal_kg", "Pritūpimai"],
              ["deadlift_goal_kg", "Deadlift"],
              ["bench_goal_kg", "Stūmimas gulint"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input
                type="number"
                value={goals[key] ?? ""}
                onChange={(e) =>
                  setGoals((g) => ({
                    ...g,
                    [key]: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </div>
          ))}
          <Button className="sm:col-span-3" onClick={saveGoals}>
            Išsaugoti PR tikslus
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
