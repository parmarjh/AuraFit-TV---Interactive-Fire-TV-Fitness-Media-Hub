import React, { useState, useEffect } from 'react';
import { BiometricGoals as BiometricGoalsType, SmartHomeState } from '../../types';
import {
  Target,
  Flame,
  Heart,
  Sparkles,
  CheckCircle2,
  Clock,
  Wind,
  Sliders,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Zap,
  TrendingUp,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';

const STORAGE_KEY = 'aurafit_biometric_goals';

export const INITIAL_BIOMETRIC_GOALS: BiometricGoalsType = {
  targetMinBpm: 130,
  targetMaxBpm: 155,
  dailyCalorieGoal: 500,
  activeZoneMinutesGoal: 45,
  targetZonePreset: 'Aerobic',
  autoFanCoolingTriggerBpm: 145,
  lastSaved: 'Default Profile',
};

const GOAL_PRESETS: {
  name: string;
  preset: BiometricGoalsType['targetZonePreset'];
  minBpm: number;
  maxBpm: number;
  calories: number;
  minutes: number;
  fanBpm: number;
  desc: string;
  badgeColor: string;
}[] = [
  {
    name: 'Fat Burn Focus',
    preset: 'Fat Burn',
    minBpm: 115,
    maxBpm: 135,
    calories: 400,
    minutes: 40,
    fanBpm: 130,
    desc: 'Moderate intensity optimized for lipid oxidation and steady stamina',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  {
    name: 'Aerobic Cardio',
    preset: 'Aerobic',
    minBpm: 130,
    maxBpm: 155,
    calories: 500,
    minutes: 45,
    fanBpm: 145,
    desc: 'Cardiovascular endurance conditioning and sustained calorie burn',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  {
    name: 'HIIT & Peak Power',
    preset: 'Peak',
    minBpm: 150,
    maxBpm: 175,
    calories: 650,
    minutes: 30,
    fanBpm: 150,
    desc: 'Maximal oxygen uptake (VO2 max) and anaerobic threshold intervals',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  },
  {
    name: 'Endurance Pro',
    preset: 'Threshold',
    minBpm: 140,
    maxBpm: 165,
    calories: 800,
    minutes: 60,
    fanBpm: 150,
    desc: 'High-volume endurance sessions with elevated glycogen burn',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  },
];

interface BiometricGoalsProps {
  smartHomeState: SmartHomeState;
  onUpdateSmartHome?: (updater: (prev: SmartHomeState) => SmartHomeState) => void;
  onGoalsSaved?: (goals: BiometricGoalsType) => void;
  className?: string;
}

export const BiometricGoals: React.FC<BiometricGoalsProps> = ({
  smartHomeState,
  onUpdateSmartHome,
  onGoalsSaved,
  className = '',
}) => {
  // Load saved goals from localStorage or use initial defaults
  const [goals, setGoals] = useState<BiometricGoalsType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse biometric goals from localStorage:', e);
    }
    return INITIAL_BIOMETRIC_GOALS;
  });

  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);

  // Compute live progress stats
  const calorieProgressPercent = Math.min(
    100,
    Math.round((smartHomeState.caloriesBurned / Math.max(1, goals.dailyCalorieGoal)) * 100)
  );
  const caloriesRemaining = Math.max(0, goals.dailyCalorieGoal - smartHomeState.caloriesBurned);

  // Evaluate current heart rate status relative to target thresholds
  const isHeartRateBelow = smartHomeState.currentBpm < goals.targetMinBpm;
  const isHeartRateInZone =
    smartHomeState.currentBpm >= goals.targetMinBpm &&
    smartHomeState.currentBpm <= goals.targetMaxBpm;
  const isHeartRateAbove = smartHomeState.currentBpm > goals.targetMaxBpm;

  // Apply a preset
  const handleApplyPreset = (presetItem: typeof GOAL_PRESETS[0]) => {
    playRemoteClick();
    setGoals((prev) => ({
      ...prev,
      targetMinBpm: presetItem.minBpm,
      targetMaxBpm: presetItem.maxBpm,
      dailyCalorieGoal: presetItem.calories,
      activeZoneMinutesGoal: presetItem.minutes,
      targetZonePreset: presetItem.preset,
      autoFanCoolingTriggerBpm: presetItem.fanBpm,
    }));
  };

  // Adjust helper
  const adjustValue = (
    key: keyof BiometricGoalsType,
    delta: number,
    min: number,
    max: number
  ) => {
    playRemoteClick();
    setGoals((prev) => {
      const current = typeof prev[key] === 'number' ? (prev[key] as number) : min;
      const next = Math.max(min, Math.min(max, current + delta));
      return {
        ...prev,
        [key]: next,
        targetZonePreset: 'Custom',
      };
    });
  };

  // Save goals handler
  const handleSaveGoals = () => {
    playRemoteSelect();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedGoals: BiometricGoalsType = {
      ...goals,
      lastSaved: `Saved today at ${timestamp}`,
    };

    setGoals(updatedGoals);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGoals));
    } catch (e) {
      console.warn('Failed to save biometric goals to localStorage:', e);
    }

    // Synchronize smart home target zone if handler provided
    if (onUpdateSmartHome) {
      onUpdateSmartHome((prev) => ({
        ...prev,
        targetZone: goals.targetZonePreset !== 'Custom' ? goals.targetZonePreset : 'Aerobic',
      }));
    }

    if (onGoalsSaved) {
      onGoalsSaved(updatedGoals);
    }

    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  // Reset to initial defaults
  const handleResetDefaults = () => {
    playRemoteClick();
    setGoals(INITIAL_BIOMETRIC_GOALS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BIOMETRIC_GOALS));
    } catch (e) {}
  };

  return (
    <div
      className={`bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl relative overflow-hidden select-none ${className}`}
    >
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800/80 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display text-white tracking-tight">
                  Biometric Goals & Thresholds
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-400 font-bold uppercase">
                  {goals.targetZonePreset}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Set personalized heart rate zones, daily caloric burn, and smart cooling thresholds
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions: Toggle Adjuster & Save Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              playRemoteClick();
              setShowEditDrawer(!showEditDrawer);
            }}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showEditDrawer
                ? 'bg-neutral-800 text-white border-neutral-700'
                : 'bg-neutral-950 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{showEditDrawer ? 'Hide Controls' : 'Adjust Targets'}</span>
          </button>

          <button
            onClick={handleSaveGoals}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 ${
              isSavedRecently
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/25'
            }`}
          >
            {isSavedRecently ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Goals Saved!</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Save Goals</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary KPI Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 relative z-10">
        {/* Card 1: Target Heart Rate Thresholds */}
        <div className="bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              Target HR Threshold
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isHeartRateInZone
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : isHeartRateBelow
                  ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                  : 'bg-rose-950/80 text-rose-400 border-rose-800'
              }`}
            >
              {isHeartRateInZone
                ? '✓ IN TARGET ZONE'
                : isHeartRateBelow
                ? '↓ BELOW TARGET'
                : '↑ ABOVE TARGET'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black font-display text-white">
              {goals.targetMinBpm} - {goals.targetMaxBpm}
              <span className="text-xs font-normal text-neutral-400 ml-1.5">BPM</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-neutral-400">Current HR</div>
              <div className="text-base font-bold font-mono text-rose-400">
                {smartHomeState.currentBpm} BPM
              </div>
            </div>
          </div>

          {/* Real-time Heart Rate Zone Gauge */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-mono text-neutral-400">
              <span>Min: {goals.targetMinBpm} BPM</span>
              <span>Max: {goals.targetMaxBpm} BPM</span>
            </div>
            <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden relative">
              {/* Target range highlight */}
              <div
                className="absolute top-0 bottom-0 bg-rose-500/30 border-x border-rose-500/60"
                style={{
                  left: `${Math.max(0, ((goals.targetMinBpm - 80) / 120) * 100)}%`,
                  right: `${Math.max(0, 100 - ((goals.targetMaxBpm - 80) / 120) * 100)}%`,
                }}
              />
              {/* Current HR cursor */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-lg transition-all duration-300 -translate-x-1/2"
                style={{
                  left: `${Math.max(0, Math.min(100, ((smartHomeState.currentBpm - 80) / 120) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Daily Caloric Burn Goal */}
        <div className="bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              Daily Caloric Goal
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              {calorieProgressPercent}% ACHIEVED
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black font-display text-white">
              {smartHomeState.caloriesBurned}
              <span className="text-sm font-normal text-neutral-400 ml-1">
                / {goals.dailyCalorieGoal} kcal
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-neutral-400">Remaining</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {caloriesRemaining === 0 ? 'Goal Met! 🎉' : `${caloriesRemaining} kcal`}
              </div>
            </div>
          </div>

          {/* Caloric Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${calorieProgressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-400">
              <span>0 kcal</span>
              <span>Goal: {goals.dailyCalorieGoal} kcal</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Minutes & Smart Cooling Trigger */}
        <div className="bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              Target Duration & Cooling
            </span>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
              ZONE SYNC
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="text-[11px] font-mono text-neutral-400">Daily Zone Time</div>
              <div className="text-xl font-bold font-display text-white mt-0.5">
                {goals.activeZoneMinutesGoal}
                <span className="text-xs font-normal text-neutral-400 ml-1">mins</span>
              </div>
              <span className="text-[10px] text-neutral-500">Target heart rate</span>
            </div>

            <div>
              <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                <Wind className="w-3 h-3 text-cyan-400" />
                Fan Trigger
              </div>
              <div className="text-xl font-bold font-display text-cyan-400 mt-0.5">
                {goals.autoFanCoolingTriggerBpm}
                <span className="text-xs font-normal text-neutral-400 ml-1">BPM</span>
              </div>
              <span className="text-[10px] text-neutral-500">Auto-cools room</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Selector Bar */}
      <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold">
            1-Click Biometric Presets:
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GOAL_PRESETS.map((p) => {
            const isSelected =
              goals.targetZonePreset === p.preset &&
              goals.targetMinBpm === p.minBpm &&
              goals.targetMaxBpm === p.maxBpm;
            return (
              <button
                key={p.name}
                onClick={() => handleApplyPreset(p)}
                className={`px-3 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
                title={p.desc}
              >
                <div className="text-xs font-semibold truncate text-white">{p.name}</div>
                <div className="text-[10px] font-mono text-neutral-400 truncate">
                  {p.minBpm}-{p.maxBpm} BPM · {p.calories}k
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Controls Drawer (Sliders & Fine Steppers) */}
      {showEditDrawer && (
        <div className="mt-5 p-5 bg-neutral-950 rounded-2xl border border-neutral-800/80 space-y-6 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Fine-Tune Biometric Targets & Heart Rate Thresholds
            </span>
            <button
              onClick={handleResetDefaults}
              className="text-[11px] font-mono text-neutral-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Control 1: Target Min Heart Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium">Target Minimum Heart Rate</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => adjustValue('targetMinBpm', -5, 90, goals.targetMaxBpm - 5)}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-white text-sm w-16 text-center">
                    {goals.targetMinBpm} BPM
                  </span>
                  <button
                    onClick={() => adjustValue('targetMinBpm', 5, 90, goals.targetMaxBpm - 5)}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="90"
                max={goals.targetMaxBpm - 5}
                step="1"
                value={goals.targetMinBpm}
                onChange={(e) =>
                  setGoals((prev) => ({
                    ...prev,
                    targetMinBpm: parseInt(e.target.value),
                    targetZonePreset: 'Custom',
                  }))
                }
                className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>90 BPM</span>
                <span>Aerobic floor threshold</span>
                <span>{goals.targetMaxBpm - 5} BPM</span>
              </div>
            </div>

            {/* Control 2: Target Max Heart Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium">Target Maximum Heart Rate</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => adjustValue('targetMaxBpm', -5, goals.targetMinBpm + 5, 200)}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-white text-sm w-16 text-center">
                    {goals.targetMaxBpm} BPM
                  </span>
                  <button
                    onClick={() => adjustValue('targetMaxBpm', 5, goals.targetMinBpm + 5, 200)}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={goals.targetMinBpm + 5}
                max="200"
                step="1"
                value={goals.targetMaxBpm}
                onChange={(e) =>
                  setGoals((prev) => ({
                    ...prev,
                    targetMaxBpm: parseInt(e.target.value),
                    targetZonePreset: 'Custom',
                  }))
                }
                className="w-full accent-rose-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>{goals.targetMinBpm + 5} BPM</span>
                <span>Peak intensity ceiling</span>
                <span>200 BPM</span>
              </div>
            </div>

            {/* Control 3: Daily Calorie Goal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium">Daily Active Caloric Goal</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => adjustValue('dailyCalorieGoal', -50, 150, 2000)}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-amber-400 text-sm w-20 text-center">
                    {goals.dailyCalorieGoal} kcal
                  </span>
                  <button
                    onClick={() => adjustValue('dailyCalorieGoal', 50, 150, 2000)}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="150"
                max="2000"
                step="25"
                value={goals.dailyCalorieGoal}
                onChange={(e) =>
                  setGoals((prev) => ({
                    ...prev,
                    dailyCalorieGoal: parseInt(e.target.value),
                    targetZonePreset: 'Custom',
                  }))
                }
                className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>150 kcal</span>
                <span>Metabolic burn threshold</span>
                <span>2000 kcal</span>
              </div>
            </div>

            {/* Control 4: Smart Cooling Auto Fan Trigger */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium">Auto-Cooling Fan Trigger</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => adjustValue('autoFanCoolingTriggerBpm', -5, 110, 185)}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-cyan-400 text-sm w-16 text-center">
                    {goals.autoFanCoolingTriggerBpm} BPM
                  </span>
                  <button
                    onClick={() => adjustValue('autoFanCoolingTriggerBpm', 5, 110, 185)}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="110"
                max="185"
                step="1"
                value={goals.autoFanCoolingTriggerBpm}
                onChange={(e) =>
                  setGoals((prev) => ({
                    ...prev,
                    autoFanCoolingTriggerBpm: parseInt(e.target.value),
                    targetZonePreset: 'Custom',
                  }))
                }
                className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>110 BPM</span>
                <span>Triggers Fire TV high-speed fan</span>
                <span>185 BPM</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
            <span className="text-[11px] font-mono text-neutral-500">
              {goals.lastSaved || 'Changes not yet saved to local profile'}
            </span>
            <button
              onClick={handleSaveGoals}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Apply Thresholds</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
