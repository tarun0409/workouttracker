import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StepsMode } from '../types';
import { getStepsForDate, saveSteps } from '../storage/stepsStorage';
import { toDateStr } from '../utils/date';

const BASELINE_KEY = '@step_baseline';

export function useSteps(date: Date, mode: StepsMode) {
  const dateStr = toDateStr(date);
  const isToday = dateStr === toDateStr(new Date());
  const [steps, setSteps] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    let subscription: { remove: () => void } | undefined;

    async function fetch() {
      if (mode === 'manual') {
        const stored = await getStepsForDate(dateStr);
        if (active) setSteps(stored?.count ?? null);
        return;
      }

      // iOS 18 changed CMPedometer: requestAuthorization() MUST be called
      // before any other API (including isStepCountingAvailable). expo-sensors
      // 15.0.x skips this on isAvailableAsync(), causing it to throw an
      // NSException that bypasses JS error handling and crashes the app.
      // Calling requestPermissionsAsync() first satisfies the iOS 18 requirement.
      if (Platform.OS === 'ios') {
        try {
          const { granted } = await Pedometer.requestPermissionsAsync();
          if (!granted) {
            const stored = await getStepsForDate(dateStr);
            if (active) setSteps(stored?.count ?? null);
            return;
          }
        } catch {
          const stored = await getStepsForDate(dateStr);
          if (active) setSteps(stored?.count ?? null);
          return;
        }
      }

      const available = await Pedometer.isAvailableAsync().catch(() => false);
      if (!available) {
        const stored = await getStepsForDate(dateStr);
        if (active) setSteps(stored?.count ?? null);
        return;
      }

      if (Platform.OS === 'ios') {
        const start = new Date(`${dateStr}T00:00:00`);
        const end = isToday ? new Date() : new Date(`${dateStr}T23:59:59`);
        try {
          const result = await Pedometer.getStepCountAsync(start, end);
          if (!active) return;
          setSteps(result.steps);
          await saveSteps({ date: dateStr, count: result.steps, source: 'auto' });
        } catch {
          const stored = await getStepsForDate(dateStr);
          if (active) setSteps(stored?.count ?? null);
        }
      } else {
        // Android: historical days come from cache
        if (!isToday) {
          const stored = await getStepsForDate(dateStr);
          if (active) setSteps(stored?.count ?? null);
          return;
        }
        // Android today: watch live count and subtract a daily baseline
        const baselineRaw = await AsyncStorage.getItem(BASELINE_KEY);
        const baseline = baselineRaw ? JSON.parse(baselineRaw) : null;

        subscription = Pedometer.watchStepCount(async result => {
          if (!active) return;
          let daily: number;
          if (!baseline || baseline.date !== dateStr || result.steps < baseline.count) {
            await AsyncStorage.setItem(BASELINE_KEY, JSON.stringify({ date: dateStr, count: result.steps }));
            daily = 0;
          } else {
            daily = result.steps - baseline.count;
          }
          setSteps(daily);
          await saveSteps({ date: dateStr, count: daily, source: 'auto' });
        });
      }
    }

    fetch();
    return () => {
      active = false;
      subscription?.remove();
    };
  }, [dateStr, mode, isToday]);

  const setManual = async (count: number) => {
    setSteps(count);
    await saveSteps({ date: dateStr, count, source: 'manual' });
  };

  return { steps, setManual };
}
