export type WorkoutStackParamList = {
  WorkoutList: undefined;
  DayDetail: { dateKey: string; dateLabel: string; sessionIds: string[] };
  EditWorkout: { dateKey: string; dateLabel: string; sessionIds: string[] };
  ActiveWorkout: undefined;
  AddExercise: undefined;
  ExerciseHistory: { name: string; equipment: string };
  Settings: undefined;
};

export type RootTabParamList = {
  Log: undefined;
  Activity: undefined;
  Progress: undefined;
};
