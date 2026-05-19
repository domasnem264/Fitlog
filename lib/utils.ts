import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calcVolume(
  sets: number | null,
  reps: number | null,
  weightKg: number | null
): number {
  return (sets ?? 0) * (reps ?? 0) * (weightKg ?? 0);
}
