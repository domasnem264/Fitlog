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

// ---------------------------------------------------------------------------
// AI helper: calls Anthropic API directly from the client
// ---------------------------------------------------------------------------
async function callClaude(prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

// ---------------------------------------------------------------------------
// Auto-fill macros from food description
// ---------------------------------------------------------------------------
async function estimateMacros(description: string): Promise<{
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
} | null> {
  if (!description.trim()) return null;
  const prompt = `You are a nutrition expert. Estimate the macros for this meal: "${description}".
Respond ONLY with a valid JSON object, no markdown, no explanation:
{"calories": <number>, "protein_g": <number>, "carbs_g": <number>, "fat_g": <number>}
Round all values to the nearest integer.`;
  try {
    const text = await callClaude(prompt);
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Meal suggestion based on remaining macros
// ---------------------------------------------------------------------------
async function suggestMeal(remaining: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}): Promise<string> {
  const prompt = `You are a sports nutritionist. A user still needs to eat the following macros today:
- Calories: ${remaining.calories} kcal
- Protein: ${remaining.protein} g
- Carbs: ${remaining.carbs} g
- Fat: ${remaining.fat} g

Suggest 2-3 practical, realistic meal ideas that would fill these macros well.
Keep the response short (max 120 words), practical and motivating.
Respond in Lithuanian language.`;
  return callClaude(prompt);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function NutritionPageClient({ goals, initialMeals, supplements }: Props) {
  const [trainingDay, setTrainingDay] = useState(true);
  const [meals, setMeals] = useState(initialMeals);
  const [saving, setSaving] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

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

  const remaining = {
    calories: Math.max(0, activeGoals.daily_calories - totals.calories),
    protein: Math.max(0, activeGoals.daily_protein_g - totals.protein),
    carbs: Math.max(0, activeGoals.daily_carbs_g - totals.carbs),
    fat: Math.max(0, activeGoals.daily_fat_g - totals.fat),
  };

  async function saveMeal(slot: string, draft: Partial<Meal>) {
    setSaving(slot);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
      if (data) setMeals((prev) => prev.map((m) => (m.id === existing.id ? data : m)));
    } else {
      const { data } = await supabase.from("meals").insert(payload).select().single();
      if (data) setMeals((prev) => [...prev, data]);
    }
    setSaving(null);
  }

  async function handleSuggestMeal() {
    setLoadingSuggestion(true);
    setSuggestion(null);
    const result = await suggestMeal(remaining);
    setSuggestion(result);
    setLoadingSuggestion(false);
  }

  const byTiming = supplements.reduce<Record<string, Supplement[]>>((acc, s) => {
    const key = s.timing ?? "Kita";
    acc[key] = acc[key] ?? [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mityba</h1>
          <p className="text-[var(--color-muted-foreground)]">Šiandienos makros ir valgymo grafikas</p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="day-toggle">Poilsio diena</Label>
          <Switch id="day-toggle" checked={trainingDay} onCheckedChange={setTrainingDay} />
          <span className="text-sm">Treniruotės diena</span>
        </div>
      </div>

      {/* Macro cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MacroCard label="Kalorijos" current={totals.calories} goal={activeGoals.daily_calories} />
        <MacroCard label="Baltymai" current={totals.protein} goal={activeGoals.daily_protein_g} unit=" g" />
        <MacroCard label="Angliavandeniai" current={totals.carbs} goal={activeGoals.daily_carbs_g} unit=" g" />
        <MacroCard label="Riebalai" current={totals.fat} goal={activeGoals.daily_fat_g} unit=" g" />
      </div>

      {/* AI Meal Suggestion */}
      <Card className="border-dashed border-[var(--color-primary)] bg-[var(--color-primary)]/5">
        <CardContent className="pt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">🤖 AI Valgymo rekomendacija</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Liko: {remaining.calories} kcal · {remaining.protein}g B · {remaining.carbs}g A · {remaining.fat}g R
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleSuggestMeal}
              disabled={loadingSuggestion || remaining.calories <= 0}
            >
              {loadingSuggestion ? "Galvoja..." : "Ką valgyti toliau?"}
            </Button>
          </div>
          {suggestion && (
            <p className="text-sm leading-relaxed rounded-lg bg-background p-3 border whitespace-pre-wrap">
              {suggestion}
            </p>
          )}
          {remaining.calories <= 0 && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              ✅ Dienos kalorijos pasiektos!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Meal rows */}
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
            onMealUpdate={(updated) =>
              setMeals((prev) =>
                prev.some((m) => m.time_label === time_label)
                  ? prev.map((m) => (m.time_label === time_label ? { ...m, ...updated } : m))
                  : prev
              )
            }
          />
        ))}
      </div>

      {/* Supplements */}
      <Card>
        <CardHeader>
          <CardTitle>Papildai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(byTiming).length ? (
            Object.entries(byTiming).map(([timing, items]) => (
              <div key={timing}>
                <p className="mb-2 text-sm font-medium text-[var(--color-muted-foreground)]">{timing}</p>
                <ul className="space-y-2">
                  {items.map((s) => (
                    <li key={s.id} className="flex items-center justify-between rounded-lg border px-4 py-2 text-sm">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-[var(--color-muted-foreground)]">{s.dose}</span>
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

// ---------------------------------------------------------------------------
// MealRow — with AI auto-fill button
// ---------------------------------------------------------------------------
function MealRow({
  slot,
  defaultTime,
  meal,
  saving,
  onSave,
  onMealUpdate,
}: {
  slot: string;
  defaultTime: string;
  meal?: Meal;
  saving: boolean;
  onSave: (slot: string, draft: Partial<Meal>) => void;
  onMealUpdate?: (updated: Partial<Meal>) => void;
}) {
  const [desc, setDesc] = useState(meal?.name ?? "");
  const [cal, setCal] = useState(String(meal?.calories ?? ""));
  const [p, setP] = useState(String(meal?.protein_g ?? ""));
  const [c, setC] = useState(String(meal?.carbs_g ?? ""));
  const [f, setF] = useState(String(meal?.fat_g ?? ""));
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState(false);

  async function handleAutoFill() {
    if (!desc.trim()) return;
    setLoadingAI(true);
    setAiError(false);
    const result = await estimateMacros(desc);
    if (result) {
      setCal(String(result.calories));
      setP(String(result.protein_g));
      setC(String(result.carbs_g));
      setF(String(result.fat_g));
      onMealUpdate?.({
        calories: result.calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fat_g: result.fat_g,
      });
    } else {
      setAiError(true);
    }
    setLoadingAI(false);
  }

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
            {meal?.protein_g != null && <Badge variant="outline">P {meal.protein_g}g</Badge>}
            {meal?.carbs_g != null && <Badge variant="outline">C {meal.carbs_g}g</Badge>}
            {meal?.fat_g != null && <Badge variant="outline">F {meal.fat_g}g</Badge>}
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Maisto aprašymas"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoFill}
            disabled={loadingAI || !desc.trim()}
            title="Automatiškai užpildyti makrus su AI"
          >
            {loadingAI ? "⏳" : "✨ AI"}
          </Button>
        </div>

        {aiError && (
          <p className="text-xs text-red-500">Nepavyko įvertinti makrų. Bandyk dar kartą.</p>
        )}

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
