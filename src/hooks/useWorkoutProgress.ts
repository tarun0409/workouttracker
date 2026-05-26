import { useMemo } from 'react';
import { WorkoutSession } from '../types';
import { getWeekStart, formatWeekLabel } from '../utils/date';

export function useWorkoutProgress(sessions: WorkoutSession[]) {
  const weeklyVolume = useMemo(() => {
    const byWeek: Record<string, number> = {};
    sessions.forEach(s => {
      const week = getWeekStart(new Date(s.date));
      let vol = 0;
      s.exercises.forEach(e => e.sets.forEach(set => { vol += set.weight * set.reps; }));
      byWeek[week] = (byWeek[week] ?? 0) + vol;
    });
    return Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, volume]) => ({ week, label: formatWeekLabel(week), volume }));
  }, [sessions]);

  const workoutFrequency = useMemo(() => {
    const byWeek: Record<string, number> = {};
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      byWeek[getWeekStart(d)] = 0;
    }
    sessions.forEach(s => {
      const week = getWeekStart(new Date(s.date));
      if (week in byWeek) byWeek[week] = (byWeek[week] ?? 0) + 1;
    });
    return Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, count]) => ({ week, label: formatWeekLabel(week), count }));
  }, [sessions]);

  const allExerciseNames = useMemo(() => {
    const names = new Set<string>();
    sessions.forEach(s => s.exercises.forEach(e => names.add(e.name)));
    return Array.from(names).sort();
  }, [sessions]);

  const recentPRs = useMemo(() => {
    const bests: Record<string, { weight: number; date: string; equipment: string }> = {};
    sessions.forEach(s => {
      s.exercises.forEach(e => {
        e.sets.forEach(set => {
          if (!bests[e.name] || set.weight > bests[e.name].weight) {
            bests[e.name] = { weight: set.weight, date: s.date, equipment: e.equipment };
          }
        });
      });
    });
    return Object.entries(bests)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [sessions]);

  function getExerciseProgress(name: string) {
    return sessions
      .filter(s => s.exercises.some(e => e.name === name))
      .map(s => {
        const ex = s.exercises.find(e => e.name === name)!;
        const maxWeight = Math.max(...ex.sets.map(set => set.weight));
        const volume = ex.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
        return { date: s.date.split('T')[0], maxWeight, volume };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  return { weeklyVolume, workoutFrequency, allExerciseNames, recentPRs, getExerciseProgress };
}
