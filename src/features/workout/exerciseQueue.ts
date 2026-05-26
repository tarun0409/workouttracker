/**
 * A tiny in-memory queue for passing a newly chosen exercise from
 * AddExerciseScreen back to ActiveWorkoutScreen without touching
 * navigation params (which can silently push duplicate screen instances).
 */

type PendingExercise = { name: string; equipment: string };

let pending: PendingExercise | null = null;

export function enqueueExercise(ex: PendingExercise) {
  pending = ex;
}

export function dequeueExercise(): PendingExercise | null {
  const ex = pending;
  pending = null;
  return ex;
}
