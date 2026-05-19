import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MacroCardProps = {
  label: string;
  current: number;
  goal: number;
  unit?: string;
};

export function MacroCard({ label, current, goal, unit = "" }: MacroCardProps) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-bold">
          {Math.round(current)}
          {unit}
          <span className="text-sm font-normal text-[var(--color-muted-foreground)]">
            {" "}
            / {goal}
            {unit}
          </span>
        </p>
        <Progress value={pct} />
      </CardContent>
    </Card>
  );
}
