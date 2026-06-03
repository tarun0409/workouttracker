import { useState, useEffect } from 'react';
import { getStepsForDate, saveSteps } from '../storage/stepsStorage';
import { toDateStr } from '../utils/date';

export function useSteps(date: Date) {
  const dateStr = toDateStr(date);
  const [steps, setSteps] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getStepsForDate(dateStr).then(stored => {
      if (active) setSteps(stored?.count ?? null);
    });
    return () => { active = false; };
  }, [dateStr]);

  const setManual = async (count: number) => {
    setSteps(count);
    await saveSteps({ date: dateStr, count, source: 'manual' });
  };

  return { steps, setManual };
}
