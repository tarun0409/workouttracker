import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSession } from '../types';

const KEY = '@workouts_v1';

export async function getSessions(): Promise<WorkoutSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  const sessions = await getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.unshift(session);
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await getSessions();
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions.filter(s => s.id !== id)));
}

export async function renameExercise(
  oldName: string,
  equipment: string,
  newName: string,
): Promise<void> {
  const sessions = await getSessions();
  const updated = sessions.map(session => ({
    ...session,
    exercises: session.exercises.map(ex =>
      ex.name.toLowerCase() === oldName.toLowerCase() && ex.equipment === equipment
        ? { ...ex, name: newName }
        : ex
    ),
  }));
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}
