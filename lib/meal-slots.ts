/** Shared constants — safe to import from Client Components */
export const MEAL_SLOTS = [
  { time_label: "Pusryčiai", defaultTime: "07:00" },
  { time_label: "Prieštreniruotinis", defaultTime: "10:30" },
  { time_label: "Potreniruotinis", defaultTime: "14:30" },
  { time_label: "Vakarienė", defaultTime: "18:00" },
  { time_label: "Prieš miegą", defaultTime: "21:00" },
] as const;
