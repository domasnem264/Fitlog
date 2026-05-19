import type { Supplement } from "@/lib/types";

type SupplementListProps = {
  supplements: Supplement[];
  groupByTiming?: boolean;
};

export function SupplementList({
  supplements,
  groupByTiming = true,
}: SupplementListProps) {
  if (!supplements.length) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Papildų nėra.
      </p>
    );
  }

  if (!groupByTiming) {
    return (
      <ul className="space-y-2">
        {supplements.map((s) => (
          <li key={s.id} className="rounded-lg border px-4 py-2 text-sm">
            <span className="font-medium">{s.name}</span>
            <span className="text-[var(--color-muted-foreground)]">
              {" "}
              — {s.dose} · {s.timing}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const groups = supplements.reduce<Record<string, Supplement[]>>((acc, s) => {
    const key = s.timing ?? "Kita";
    acc[key] = acc[key] ?? [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([timing, items]) => (
        <div key={timing}>
          <p className="mb-2 text-sm font-medium text-[var(--color-muted-foreground)]">
            {timing}
          </p>
          <ul className="space-y-2">
            {items.map((s) => (
              <li
                key={s.id}
                className="flex justify-between rounded-lg border px-4 py-2 text-sm"
              >
                <span className="font-medium">{s.name}</span>
                <span className="text-[var(--color-muted-foreground)]">{s.dose}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
