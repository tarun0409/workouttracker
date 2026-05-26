import { useState, useEffect, useCallback } from 'react';
import { WorkoutSession } from '../types';
import * as storage from '../storage/workoutStorage';

export function useWorkouts() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await storage.getSessions();
    setSessions(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (session: WorkoutSession) => {
    await storage.saveSession(session);
    await load();
  };

  const remove = async (id: string) => {
    await storage.deleteSession(id);
    await load();
  };

  return { sessions, loading, save, remove, reload: load };
}
