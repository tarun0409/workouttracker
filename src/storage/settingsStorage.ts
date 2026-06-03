import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../types';

const KEY = '@settings_v1';

const DEFAULTS: AppSettings = {
  dailyStepGoal: 10000,
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
