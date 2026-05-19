import { cn } from "@/lib/utils";

type HabitGridProps = {
  trainedDates: Set<string>;
  year?: number;
  month?: number;
};

export function HabitGrid({
  trainedDates,
  year = new Date().getFullYear(),
  month = new Date().getMonth(),
}: HabitGridProps) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = (first.getDay() + 6) % 7;

  const cells: (string | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }),
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--color-muted-foreground)]">
        {["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square rounded-sm",
              !date && "bg-transparent",
              date &&
                (trainedDates.has(date)
                  ? "bg-[var(--color-primary)]"
                  : "bg-[var(--color-muted)]")
            )}
            title={date ?? undefined}
          />
        ))}
      </div>
    </div>
  );
}
