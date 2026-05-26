import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailySteps } from '../types';

const KEY = '@steps_v1';

export async function getAllSteps(): Promise<DailySteps[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveSteps(entry: DailySteps): Promise<void> {
  const all = await getAllSteps();
  const idx = all.findIndex(s => s.date === entry.date);
  if (idx >= 0) all[idx] = entry;
  else all.push(entry);
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function getStepsForDate(date: string): Promise<DailySteps | null> {
  const all = await getAllSteps();
  return all.find(s => s.date === date) ?? null;
}
