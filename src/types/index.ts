export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
}

export interface Exercise {
  id: string;
  name: string;
  equipment: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  date: string;
  exercises: Exercise[];
}

export interface DailySteps {
  date: string;
  count: number;
  source: 'auto' | 'manual';
}

export type StepsMode = 'auto' | 'manual';

export interface AppSettings {
  stepsMode: StepsMode;
  dailyStepGoal: number;
}

// ── Cardio ────────────────────────────────────────────────────────────────────

export interface CardioInterval {
  id: string;
  durationMinutes: number;
  metrics: Record<string, number>; // e.g. { speed: 8.5, incline: 2 }
}

export interface CardioSession {
  id: string;
  date: string;         // ISO string
  machine: string;      // machine id ('treadmill', 'efx', …)
  machineName: string;  // display name
  intervals: CardioInterval[];
}
