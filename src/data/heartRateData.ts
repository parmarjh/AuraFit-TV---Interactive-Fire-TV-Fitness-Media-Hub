import { HeartRatePoint } from '../types';

export function getZoneFromBpm(bpm: number): 'Warmup' | 'Aerobic' | 'Threshold' | 'Peak' {
  if (bpm >= 160) return 'Peak';
  if (bpm >= 140) return 'Threshold';
  if (bpm >= 120) return 'Aerobic';
  return 'Warmup';
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
