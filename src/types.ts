export type WorkoutCategory = 'all' | 'hiit' | 'strength' | 'cardio' | 'yoga' | 'mobility';

export type IntensityLevel = 'Low' | 'Moderate' | 'High' | 'Extreme';

export interface ExerciseStep {
  name: string;
  durationSeconds: number;
  reps?: number;
  formCue: string;
  targetMuscle: string;
  restAfterSeconds: number;
}

export interface Workout {
  id: string;
  title: string;
  category: WorkoutCategory;
  durationMinutes: number;
  estCalories: number;
  intensity: IntensityLevel;
  coach: {
    name: string;
    role: string;
  };
  tags: string[];
  equipment: string;
  musicGenre: string;
  bgGradient: string;
  accentColor: string;
  description: string;
  steps: ExerciseStep[];
  rating: number;
  completedCount: number;
  videoUrl?: string;
  audioUrl?: string;
  audioTitle?: string;
}

export interface ScheduledWorkout {
  id: string;
  time: string;
  label: string;
  workoutId: string;
  completed: boolean;
  type: 'Morning' | 'Midday' | 'Evening' | 'Night';
}

export type VoiceLanguage = 'en' | 'hi' | 'gu';

export interface IptvChannel {
  id: string;
  name: string;
  streamUrl: string;
  externalUrl?: string;
  logo?: string;
  group?: string; // e.g. "Sports", "Fitness", "Music", "News", "Relax"
  country?: string;
  language?: string;
  tvgId?: string;
  resolution?: string;
  isFavorite?: boolean;
}

export interface IptvPlaylist {
  id: string;
  name: string;
  url: string;
  totalChannels: number;
  lastUpdated: string;
  description?: string;
  channels: IptvChannel[];
}

export interface HeartRatePoint {
  minuteOffset: number; // -15 to 0 (minutes before current)
  label: string; // e.g. "-15m", "-10m", "-5m", "Now"
  bpm: number;
  zone: 'Warmup' | 'Warm-up' | 'Fat Burn' | 'Aerobic' | 'Threshold' | 'Peak';
  timestamp: string;
}

export interface BiometricGoals {
  targetMinBpm: number;
  targetMaxBpm: number;
  dailyCalorieGoal: number;
  activeZoneMinutesGoal: number;
  targetZonePreset: 'Fat Burn' | 'Aerobic' | 'Threshold' | 'Peak' | 'Custom';
  autoFanCoolingTriggerBpm: number;
  lastSaved?: string;
}

export interface SmartHomeState {
  fanSpeed: 0 | 1 | 2 | 3;
  fanAutoCool: boolean;
  ambientLight: 'amber' | 'crimson' | 'zen-violet' | 'cool-white' | 'off';
  ambientBrightness: number;
  targetTemp: number;
  pairedHeartRateDevice: string | null;
  heartRateConnected: boolean;
  currentBpm: number;
  targetZone: 'Warmup' | 'Warm-up' | 'Fat Burn' | 'Aerobic' | 'Threshold' | 'Peak' | string;
  caloriesBurned: number;
  heartRateHistory?: HeartRatePoint[];
}

export interface AwsServiceDetail {
  id: string;
  service: string;
  category: 'Compute' | 'Database' | 'Streaming' | 'IoT & Sync' | 'Auth';
  roleInFireTv: string;
  protocolOrApi: string;
  estimatedMonthlyCost: number;
  requestedCredits: number;
}

export interface TelemetryPacket {
  id: string;
  timestamp: string;
  source: 'Fire TV Client' | 'AppSync GraphQL' | 'AWS IoT Core' | 'Lambda Ingestion';
  topicOrAction: string;
  payload: Record<string, any>;
  latencyMs: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: 'cooling' | 'lighting' | 'thermostat' | 'schedule' | 'advisor';
  triggerCondition: string;
  actionSummary: string;
  isEnabled: boolean;
  lastTriggered?: string;
  fireTvCommand?: string;
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  ruleName: string;
  triggerDetail: string;
  actionExecuted: string;
  source: 'AWS IoT Core' | 'Biometrics Engine' | 'Search Grounded AI' | 'Schedule Cron';
}

export interface SearchGroundingCitation {
  title: string;
  uri: string;
}

export interface SearchGroundingResponse {
  text: string;
  sources: SearchGroundingCitation[];
  queries?: string[];
}

export interface SmartScene {
  id: string;
  name: string;
  description: string;
  iconName: 'dumbbell' | 'lotus' | 'flame' | 'moon' | 'sparkles' | 'sun';
  settings: {
    fanSpeed: 0 | 1 | 2 | 3;
    ambientLight: 'amber' | 'crimson' | 'zen-violet' | 'cool-white' | 'off';
    ambientBrightness: number;
    targetTemp: number;
    fanAutoCool?: boolean;
  };
  accentColor: string;
  badge?: string;
  voicePhrase: string;
  isCustom?: boolean;
}

export interface VoiceCommandRecord {
  id: string;
  timestamp: string;
  transcript: string;
  resultingAction: string;
  category: 'scene' | 'workout' | 'device' | 'navigation' | 'advisor' | 'other';
  success: boolean;
}
