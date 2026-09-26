import { HeartRatePoint } from '../types';

export type HeartRateZoneType = 'Warm-up' | 'Fat Burn' | 'Aerobic' | 'Peak';

export interface HeartRateZoneInfo {
  id: HeartRateZoneType;
  name: string;
  shortName: string;
  minBpm: number;
  maxBpm: number;
  pctRange: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  glowColor: string;
  accentHex: string;
  description: string;
  benefit: string;
  intensityLabel: string;
  idealFor: string;
}

export const HEART_RATE_ZONES: HeartRateZoneInfo[] = [
  {
    id: 'Warm-up',
    name: 'Zone 1: Warm-up',
    shortName: 'Warm-up',
    minBpm: 60,
    maxBpm: 114,
    pctRange: '50-60%',
    badgeBg: 'bg-emerald-950/80',
    badgeBorder: 'border-emerald-600',
    badgeText: 'text-emerald-300',
    glowColor: 'bg-emerald-500',
    accentHex: '#10b981',
    description: 'Active recovery, joint prep & blood flow elevation',
    benefit: 'Prepares cardiovascular system and mobilizes synovial fluid with low strain',
    intensityLabel: 'Light Effort',
    idealFor: 'Mobility, Yoga, Warm-up & Cooldown',
  },
  {
    id: 'Fat Burn',
    name: 'Zone 2: Fat Burn',
    shortName: 'Fat Burn',
    minBpm: 115,
    maxBpm: 134,
    pctRange: '60-70%',
    badgeBg: 'bg-teal-950/80',
    badgeBorder: 'border-teal-600',
    badgeText: 'text-teal-300',
    glowColor: 'bg-teal-500',
    accentHex: '#14b8a6',
    description: 'Aerobic base, metabolic efficiency & fat oxidation',
    benefit: 'Maximizes lipid oxidation rate and strengthens mitochondrial respiratory density',
    intensityLabel: 'Moderate',
    idealFor: 'Steady State Cardio & Endurance',
  },
  {
    id: 'Aerobic',
    name: 'Zone 3: Aerobic',
    shortName: 'Aerobic',
    minBpm: 135,
    maxBpm: 159,
    pctRange: '70-80%',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-600',
    badgeText: 'text-amber-300',
    glowColor: 'bg-amber-500',
    accentHex: '#f59e0b',
    description: 'Cardiovascular endurance, tempo & lactate clearance',
    benefit: 'Expands cardiac stroke volume and boosts aerobic performance capacity',
    intensityLabel: 'Challenging',
    idealFor: 'Paced Intervals & Functional Circuits',
  },
  {
    id: 'Peak',
    name: 'Zone 4: Peak',
    shortName: 'Peak',
    minBpm: 160,
    maxBpm: 200,
    pctRange: '80-100%',
    badgeBg: 'bg-rose-950/80',
    badgeBorder: 'border-rose-600',
    badgeText: 'text-rose-300',
    glowColor: 'bg-rose-500',
    accentHex: '#f43f5e',
    description: 'Maximal anaerobic power, VO2 max & HIIT threshold',
    benefit: 'Drives maximum oxygen consumption, fast-twitch recruitment & EPOC afterburn',
    intensityLabel: 'Maximum Intensity',
    idealFor: 'HIIT Sprints & Tabata Finishers',
  },
];

export function getDetailedZone(bpm: number): HeartRateZoneInfo {
  if (bpm >= 160) return HEART_RATE_ZONES[3]; // Peak
  if (bpm >= 135) return HEART_RATE_ZONES[2]; // Aerobic
  if (bpm >= 115) return HEART_RATE_ZONES[1]; // Fat Burn
  return HEART_RATE_ZONES[0]; // Warm-up
}

export function getZoneFromBpm(bpm: number): 'Warmup' | 'Warm-up' | 'Fat Burn' | 'Aerobic' | 'Threshold' | 'Peak' {
  if (bpm >= 160) return 'Peak';
  if (bpm >= 135) return 'Aerobic';
  if (bpm >= 115) return 'Fat Burn';
  return 'Warm-up';
}

/**
 * Generates or provides a realistic 15-minute heart rate telemetry curve
 * leading up to the current BPM in smartHomeState.
 */
export function generate15MinHeartRateHistory(currentBpm: number = 128): HeartRatePoint[] {
  const points: HeartRatePoint[] = [];
  const baseCurve = [
    92,  // -15m (Pre-workout warmup)
    96,  // -14m
    102, // -13m
    110, // -12m
    116, // -11m
    124, // -10m (Entering Aerobic)
    130, // -9m
    136, // -8m
    144, // -7m (Threshold spike)
    148, // -6m
    142, // -5m
    135, // -4m
    132, // -3m
    130, // -2m
    129, // -1m
  ];

  // Adjust relative to currentBpm
  const lastTarget = currentBpm;
  const ratio = lastTarget / 128;

  for (let i = 0; i < 15; i++) {
    const minOffset = -15 + i;
    const rawVal = Math.round(baseCurve[i] * ratio);
    const clamped = Math.max(70, Math.min(195, rawVal));
    points.push({
      minuteOffset: minOffset,
      label: `${minOffset}m`,
      bpm: clamped,
      zone: getZoneFromBpm(clamped),
      timestamp: `${Math.abs(minOffset)} mins ago`,
    });
  }

  // 16th point is Now (0m)
  points.push({
    minuteOffset: 0,
    label: 'Now',
    bpm: currentBpm,
    zone: getZoneFromBpm(currentBpm),
    timestamp: 'Just now',
  });

  return points;
}

export const INITIAL_HEART_RATE_HISTORY: HeartRatePoint[] = generate15MinHeartRateHistory(128);
