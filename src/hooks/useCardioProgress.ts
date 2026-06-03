import { useMemo, useCallback } from 'react';
import { CardioSession } from '../types';
import { getMachine } from '../constants/cardioMachines';
import { getWeekStart, formatWeekLabel } from '../utils/date';

export interface MachineStats {
  machineId: string;
  machineName: string;
  sessionCount: number;
  totalMinutes: number;
}

export interface MachineSessionPoint {
  label: string;      // short date label, e.g. "May 27"
  totalMinutes: number;
  avgPrimary: number; // avg of the machine's first metric across intervals
}

export interface MachineDetail {
  machineName: string;
  totalSessions: number;
  totalMinutes: number;
  sessionPoints: MachineSessionPoint[];
  primaryLabel: string;    // e.g. "Avg Speed (km/h)"
  primaryDecimal: boolean; // whether the metric uses decimals
  weeklyMinutes: Array<{ label: string; minutes: number }>;
}

export function formatMinutes(total: number): string {
  const mins = Math.round(total);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function useCardioProgress(cardioSessions: CardioSession[]) {
  // All machines the user has done cardio on, sorted by total minutes desc.
  const allMachines = useMemo((): MachineStats[] => {
    const byMachine: Record<string, MachineStats> = {};
    cardioSessions.forEach(cs => {
      if (!byMachine[cs.machine]) {
        byMachine[cs.machine] = {
          machineId: cs.machine,
          machineName: cs.machineName,
          sessionCount: 0,
          totalMinutes: 0,
        };
      }
      byMachine[cs.machine].sessionCount += 1;
      byMachine[cs.machine].totalMinutes += cs.intervals.reduce(
        (sum, i) => sum + i.durationMinutes, 0
      );
    });
    return Object.values(byMachine).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [cardioSessions]);

  // Detailed progress data for a single machine.
  const getMachineDetail = useCallback((machineId: string): MachineDetail | null => {
    const machine = getMachine(machineId);
    const sessions = cardioSessions
      .filter(cs => cs.machine === machineId)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (sessions.length === 0) return null;

    const machineName = sessions[0].machineName;
    const totalMinutes = sessions.reduce(
      (sum, cs) => sum + cs.intervals.reduce((s, i) => s + i.durationMinutes, 0), 0
    );

    // Primary metric = first defined metric for this machine type.
    const primaryMetric = machine?.metrics[0];
    const primaryLabel = primaryMetric
      ? `Avg ${primaryMetric.label}${primaryMetric.unit ? ` (${primaryMetric.unit})` : ''}`
      : '';
    const primaryDecimal = primaryMetric?.decimal ?? false;

    // Per-session data points (last 8 sessions).
    const sessionPoints: MachineSessionPoint[] = sessions.slice(-8).map(cs => {
      const totalMins = cs.intervals.reduce((sum, i) => sum + i.durationMinutes, 0);
      const rawAvg = primaryMetric && cs.intervals.length > 0
        ? cs.intervals.reduce((sum, i) => sum + (i.metrics[primaryMetric.key] ?? 0), 0) /
          cs.intervals.length
        : 0;
      const avgPrimary = primaryDecimal
        ? Math.round(rawAvg * 10) / 10
        : Math.round(rawAvg);
      return {
        label: new Date(cs.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalMinutes: totalMins,
        avgPrimary,
      };
    });

    // Weekly minutes (last 8 weeks, filling zeros for empty weeks).
    const byWeek: Record<string, number> = {};
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      byWeek[getWeekStart(d)] = 0;
    }
    sessions.forEach(cs => {
      const week = getWeekStart(new Date(cs.date));
      if (week in byWeek) {
        byWeek[week] =
          (byWeek[week] ?? 0) +
          cs.intervals.reduce((sum, i) => sum + i.durationMinutes, 0);
      }
    });
    const weeklyMinutes = Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, minutes]) => ({ label: formatWeekLabel(week), minutes }));

    return {
      machineName,
      totalSessions: sessions.length,
      totalMinutes,
      sessionPoints,
      primaryLabel,
      primaryDecimal,
      weeklyMinutes,
    };
  }, [cardioSessions]);

  return { allMachines, getMachineDetail };
}
