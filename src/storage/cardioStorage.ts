import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardioSession } from '../types';

const KEY = '@cardio_v1';

export async function getCardioSessions(): Promise<CardioSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCardioSession(session: CardioSession): Promise<void> {
  const sessions = await getCardioSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.unshift(session);
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
}

export async function deleteCardioSession(id: string): Promise<void> {
  const sessions = await getCardioSessions();
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions.filter(s => s.id !== id)));
}
