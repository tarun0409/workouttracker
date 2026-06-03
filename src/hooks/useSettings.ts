import { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import * as storage from '../storage/settingsStorage';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    dailyStepGoal: 10000,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storage.getSettings().then(s => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const update = async (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    await storage.saveSettings(updated);
  };

  return { settings, loaded, update };
}
