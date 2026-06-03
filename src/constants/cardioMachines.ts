export interface MetricDef {
  key: string;
  label: string;
  unit: string;
  decimal: boolean;
}

export interface MachineDef {
  id: string;
  label: string;
  icon: string; // Ionicons name
  metrics: MetricDef[];
}

export const CARDIO_MACHINES: MachineDef[] = [
  {
    id: 'treadmill',
    label: 'Treadmill',
    icon: 'walk-outline',
    metrics: [
      { key: 'speed', label: 'Speed', unit: 'km/h', decimal: true },
      { key: 'incline', label: 'Incline', unit: '%', decimal: true },
    ],
  },
  {
    id: 'efx',
    label: 'EFX',
    icon: 'fitness-outline',
    metrics: [
      { key: 'level', label: 'Level', unit: '', decimal: false },
      { key: 'spm', label: 'SPM', unit: 'spm', decimal: false },
    ],
  },
  {
    id: 'cycling',
    label: 'Cycling',
    icon: 'bicycle-outline',
    metrics: [
      { key: 'level', label: 'Level', unit: '', decimal: false },
      { key: 'rpm', label: 'RPM', unit: 'rpm', decimal: false },
    ],
  },
  {
    id: 'rowing',
    label: 'Rowing',
    icon: 'boat-outline',
    metrics: [
      { key: 'level', label: 'Level', unit: '', decimal: false },
      { key: 'spm', label: 'SPM', unit: 'spm', decimal: false },
    ],
  },
  {
    id: 'stair_climber',
    label: 'Stair Climber',
    icon: 'trending-up-outline',
    metrics: [
      { key: 'level', label: 'Level', unit: '', decimal: false },
      { key: 'steps_per_min', label: 'Steps/min', unit: '/min', decimal: false },
    ],
  },
];

export function getMachine(id: string): MachineDef | undefined {
  return CARDIO_MACHINES.find(m => m.id === id);
}

/** One-line summary of a single interval's metrics (used in list views). */
export function metricsSummary(machine: MachineDef, metrics: Record<string, number>): string {
  return machine.metrics
    .map(m => {
      const val = metrics[m.key];
      if (!val && val !== 0) return null;
      return m.unit ? `${m.label} ${val} ${m.unit}` : `${m.label} ${val}`;
    })
    .filter(Boolean)
    .join(' · ');
}
