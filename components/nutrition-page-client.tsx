"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MEAL_SLOTS } from "@/lib/meal-slots";
import type { Meal, Supplement, UserGoals } from "@/lib/types";
import { MacroCard } from "@/components/macro-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Props = {
  goals: UserGoals;
  initialMeals: Meal[];
  supplements: Supplement[];
};

export function NutritionPageClient({
  goals,
  initialMeals,
  supplements,
}: Props) {
  const [trainingDay, setTrainingDay] = useState(true);
  const [meals, setMeals] = useState(initialMeals);
  const [saving, setSaving] = useState<string | null>(null);

  const activeGoals = useMemo(() => {
    if (trainingDay) return goals;
    return {
      ...goals,
      daily_calories: goals.daily_calories - 300,
      daily_carbs_g: Math.max(0, goals.daily_carbs_g - 40),
    };
  }, [goals, trainingDay]);

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + Number(m.protein_g ?? 0),
      carbs: acc.carbs + Number(m.carbs_g ?? 0),
      fat: acc.fat + Number(m.fat_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  async function saveMeal(slot: string, draft: Partial<Meal>) {
    setSaving(slot);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().slice(0, 10);
    const existing = meals.find((m) => m.time_label === slot);

    const payload = {
      user_id: user.id,
      name: draft.name ?? slot,
      time_label: slot,
      date: today,
      calories: draft.calories ?? null,
      protein_g: draft.protein_g ?? null,
      carbs_g: draft.carbs_g ?? null,
      fat_g: draft.fat_g ?? null,
    };

    if (existing) {
      const { data } = await supabase
        .from("meals")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
      if (data) {
        setMeals((prev) => prev.map((m) => (m.id === existing.id ? data : m)));
      }
    } else {
      const { data } = await supabase.from("meals").insert(payload).select().single();
      if (data) setMeals((prev) => [...prev, data]);
    }
    setSaving(null);
  }

  const byTiming = supplements.reduce<Record<string, Supplement[]>>((acc, s) => {
    const key = s.timing ?? "Kita";
    acc[key] = acc[key] ?? [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mityba</h1>
          <p className="text-[var(--color-muted-foreground)]">
            Šiandienos makros ir valgymo grafikas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="day-toggle">Poilsio diena</Label>
          <Switch
            id="day-toggle"
            checked={trainingDay}
            onCheckedChange={setTrainingDay}
          />
          <span className="text-sm">Treniruotės diena</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MacroCard
          label="Kalorijos"
          current={totals.calories}
          goal={activeGoals.daily_calories}
        />
        <MacroCard
          label="Baltymai"
          current={totals.protein}
          goal={activeGoals.daily_protein_g}
          unit=" g"
        />
        <MacroCard
          label="Angliavandeniai"
          current={totals.carbs}
          goal={activeGoals.daily_carbs_g}
          unit=" g"
        />
        <MacroCard
          label="Riebalai"
          current={totals.fat}
          goal={activeGoals.daily_fat_g}
          unit=" g"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Valgymo grafikas</h2>
        {MEAL_SLOTS.map(({ time_label, defaultTime }) => (
          <MealRow
            key={time_label}
            slot={time_label}
            defaultTime={defaultTime}
            meal={meals.find((m) => m.time_label === time_label)}
            saving={saving === time_label}
            onSave={saveMeal}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Papildai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(byTiming).length ? (
            Object.entries(byTiming).map(([timing, items]) => (
              <div key={timing}>
                <p className="mb-2 text-sm font-medium text-[var(--color-muted-foreground)]">
                  {timing}
                </p>
                <ul className="space-y-2">
                  {items.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border px-4 py-2 text-sm"
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-[var(--color-muted-foreground)]">
                        {s.dose}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Papildų nėra — pridėk Nustatymuose.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MealRow({
  slot,
  defaultTime,
  meal,
  saving,
  onSave,
}: {
  slot: string;
  defaultTime: string;
  meal?: Meal;
  saving: boolean;
  onSave: (slot: string, draft: Partial<Meal>) => void;
}) {
  const [desc, setDesc] = useState(meal?.name ?? "");
  const [cal, setCal] = useState(String(meal?.calories ?? ""));
  const [p, setP] = useState(String(meal?.protein_g ?? ""));
  const [c, setC] = useState(String(meal?.carbs_g ?? ""));
  const [f, setF] = useState(String(meal?.fat_g ?? ""));

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">{slot}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">{defaultTime}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {meal?.calories != null && <Badge variant="secondary">{meal.calories} kcal</Badge>}
            {meal?.protein_g != null && (
              <Badge variant="outline">P {meal.protein_g}g</Badge>
            )}
            {meal?.carbs_g != null && <Badge variant="outline">C {meal.carbs_g}g</Badge>}
            {meal?.fat_g != null && <Badge variant="outline">F {meal.fat_g}g</Badge>}
          </div>
        </div>
        <Input
          placeholder="Maisto aprašymas"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <div className="grid gap-2 sm:grid-cols-4">
          <Input type="number" placeholder="kcal" value={cal} onChange={(e) => setCal(e.target.value)} />
          <Input type="number" placeholder="B" value={p} onChange={(e) => setP(e.target.value)} />
          <Input type="number" placeholder="A" value={c} onChange={(e) => setC(e.target.value)} />
          <Input type="number" placeholder="R" value={f} onChange={(e) => setF(e.target.value)} />
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() =>
            onSave(slot, {
              name: desc || slot,
              calories: cal ? Number(cal) : null,
              protein_g: p ? Number(p) : null,
              carbs_g: c ? Number(c) : null,
              fat_g: f ? Number(f) : null,
            })
          }
        >
          {saving ? "Saugoma..." : "Išsaugoti"}
        </Button>
      </CardContent>
    </Card>
  );
}
