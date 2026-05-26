import AsyncStorage from '@react-native-async-storage/async-storage';

const ALL_KEYS = ['@workouts_v1', '@steps_v1', '@settings_v1', '@step_baseline'];

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(ALL_KEYS);
}
