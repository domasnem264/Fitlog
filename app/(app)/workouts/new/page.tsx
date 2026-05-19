import { WorkoutLogForm } from "@/components/workout-log";

export default function NewWorkoutPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nauja treniruotė</h1>
      <WorkoutLogForm />
    </div>
  );
}
