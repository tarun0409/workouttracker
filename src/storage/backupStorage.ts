import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BackupData {
  version: number;
  exportedAt: string;
  workouts: unknown[];
  steps: unknown[];
  settings: unknown;
}

export async function exportData(): Promise<BackupData> {
  const results = await AsyncStorage.multiGet([
    '@workouts_v1',
    '@steps_v1',
    '@settings_v1',
  ]);
  const map = Object.fromEntries(results.map(([k, v]) => [k, v]));
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    workouts: map['@workouts_v1'] ? JSON.parse(map['@workouts_v1']) : [],
    steps: map['@steps_v1'] ? JSON.parse(map['@steps_v1']) : [],
    settings: map['@settings_v1'] ? JSON.parse(map['@settings_v1']) : {},
  };
}

export async function importData(data: BackupData): Promise<void> {
  if (typeof data !== 'object' || data.version == null) {
    throw new Error('Invalid backup file.');
  }
  const pairs: [string, string][] = [];
  if (Array.isArray(data.workouts)) {
    pairs.push(['@workouts_v1', JSON.stringify(data.workouts)]);
  }
  if (Array.isArray(data.steps)) {
    pairs.push(['@steps_v1', JSON.stringify(data.steps)]);
  }
  if (data.settings && typeof data.settings === 'object') {
    pairs.push(['@settings_v1', JSON.stringify(data.settings)]);
  }
  if (pairs.length === 0) throw new Error('Backup file contains no data.');
  await AsyncStorage.multiSet(pairs);
}
