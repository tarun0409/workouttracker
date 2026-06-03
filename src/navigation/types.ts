export type WorkoutStackParamList = {
  WorkoutList: undefined;
  DayDetail: { dateKey: string; dateLabel: string; sessionIds: string[] };
  EditWorkout: {
    dateKey: string;
    dateLabel: string;
    sessionIds: string[];
    filterExerciseName?: string;
    filterExerciseEquipment?: string;
  };
  ActiveWorkout: undefined;
  AddExercise: undefined;
  ExerciseHistory: { name: string; equipment: string };
  Settings: undefined;
  // Cardio
  SelectMachine: undefined;
  LogCardio: { machineId: string };
  EditCardio: { cardioSessionId: string; dateLabel: string };
};

export type RootTabParamList = {
  Log: undefined;
  Activity: undefined;
  Progress: undefined;
};
