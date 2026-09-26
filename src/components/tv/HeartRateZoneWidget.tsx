import React from 'react';
import { SmartHomeState } from '../../types';
import {
  Heart,
  Flame,
  Activity,
  Zap,
  Shield,
  TrendingUp,
  Info,
  Sparkles,
  Radio,
  Check,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';
import {
  HEART_RATE_ZONES,
  getDetailedZone,
  HeartRateZoneInfo,
  generate15MinHeartRateHistory,
} from '../../data/heartRateData';

interface HeartRateZoneWidgetProps {
  smartHomeState: SmartHomeState;
  onUpdateSmartHome?: (updater: (prev: SmartHomeState) => SmartHomeState) => void;
  compact?: boolean;
}

export const HeartRateZoneWidget: React.FC<HeartRateZoneWidgetProps> = ({
  smartHomeState,
  onUpdateSmartHome,
  compact = false,
}) => {
  const currentBpm = smartHomeState.currentBpm || 128;
  const activeZone = getDetailedZone(currentBpm);

  // Compute estimated percentage of standard Max HR (approx 190 bpm)
  const estMaxHr = 190;
  const pctMaxHr = Math.min(100, Math.max(30, Math.round((currentBpm / estMaxHr) * 100)));

  // Gauge position: range 60 to 195 BPM
  const minRange = 60;
  const maxRange = 195;
  const clampedBpm = Math.min(maxRange, Math.max(minRange, currentBpm));
  const gaugePercent = Math.round(((clampedBpm - minRange) / (maxRange - minRange)) * 100);

  const handleSelectZone = (zone: HeartRateZoneInfo) => {
    if (!onUpdateSmartHome) return;
    playRemoteSelect();
    const targetBpm = Math.round((zone.minBpm + zone.maxBpm) / 2);
    onUpdateSmartHome((prev) => ({
      ...prev,
      currentBpm: targetBpm,
      targetZone: zone.id,
      heartRateHistory: generate15MinHeartRateHistory(targetBpm),
    }));
  };

  const getZoneIcon = (id: string) => {
    switch (id) {
      case 'Warm-up':
        return <Shield className="w-3.5 h-3.5" />;
      case 'Fat Burn':
        return <Flame className="w-3.5 h-3.5" />;
      case 'Aerobic':
        return <Activity className="w-3.5 h-3.5" />;
      case 'Peak':
        return <Zap className="w-3.5 h-3.5" />;
      default:
        return <Heart className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Background ambient gradient glow matching current active zone */}
      <div
        className={`absolute -right-16 -top-16 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700 ${activeZone.glowColor}`}
      />

      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-neutral-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              activeZone.id === 'Peak'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : activeZone.id === 'Aerobic'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : activeZone.id === 'Fat Burn'
                ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}
          >
            <Heart className="w-5 h-5 fill-current animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold font-display text-white">
                Heart Rate Intensity Zone
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                Cardio Telemetry
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
              <span>Biometric biofeedback from {smartHomeState.pairedHeartRateDevice || 'BLE Wearable'}</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Active
              </span>
            </p>
          </div>
        </div>

        {/* Current Zone Spotlight Badge */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Current Zone</div>
            <div className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-sm mt-0.5 ${activeZone.badgeBg} ${activeZone.badgeBorder} ${activeZone.badgeText}`}>
              {getZoneIcon(activeZone.id)}
              <span>{activeZone.name}</span>
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-right shrink-0">
            <div className="text-[9px] font-mono text-neutral-500 uppercase">Max HR</div>
            <div className="text-sm font-black font-mono text-white tabular-nums">
              {pctMaxHr}%
            </div>
          </div>
        </div>
      </div>

      {/* Visual Intensity Spectrum Bar / Multi-Segment Gauge */}
      <div className="my-5 relative z-10">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1.5">
          <span className="flex items-center gap-1">
            <span>Intensity Spectrum</span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-300 font-semibold">{currentBpm} BPM</span>
          </span>
          <span className="text-neutral-400 font-semibold">{activeZone.intensityLabel} ({activeZone.pctRange})</span>
        </div>

        {/* 4-Zone Segmented Bar */}
        <div className="grid grid-cols-4 gap-1.5 h-4.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800/90 relative">
          {/* Zone 1: Warm-up */}
          <div
            className={`rounded-lg transition-all flex items-center justify-center text-[9px] font-bold font-mono uppercase tracking-wider ${
              activeZone.id === 'Warm-up'
                ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/40 ring-2 ring-emerald-400'
                : 'bg-emerald-950/60 text-emerald-400/80 border border-emerald-900/60 hover:bg-emerald-900/60'
            }`}
          >
            Warm-up
          </div>

          {/* Zone 2: Fat Burn */}
          <div
            className={`rounded-lg transition-all flex items-center justify-center text-[9px] font-bold font-mono uppercase tracking-wider ${
              activeZone.id === 'Fat Burn'
                ? 'bg-teal-500 text-neutral-950 shadow-md shadow-teal-500/40 ring-2 ring-teal-400'
                : 'bg-teal-950/60 text-teal-400/80 border border-teal-900/60 hover:bg-teal-900/60'
            }`}
          >
            Fat Burn
          </div>

          {/* Zone 3: Aerobic */}
          <div
            className={`rounded-lg transition-all flex items-center justify-center text-[9px] font-bold font-mono uppercase tracking-wider ${
              activeZone.id === 'Aerobic'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/40 ring-2 ring-amber-400'
                : 'bg-amber-950/60 text-amber-400/80 border border-amber-900/60 hover:bg-amber-900/60'
            }`}
          >
            Aerobic
          </div>

          {/* Zone 4: Peak */}
          <div
            className={`rounded-lg transition-all flex items-center justify-center text-[9px] font-bold font-mono uppercase tracking-wider ${
              activeZone.id === 'Peak'
                ? 'bg-rose-500 text-neutral-950 shadow-md shadow-rose-500/40 ring-2 ring-rose-400'
                : 'bg-rose-950/60 text-rose-400/80 border border-rose-900/60 hover:bg-rose-900/60'
            }`}
          >
            Peak
          </div>

          {/* Real-time Indicator needle/pin placed along the spectrum */}
          <div
            className="absolute -top-1.5 -bottom-1.5 w-1.5 bg-white rounded-full shadow-lg shadow-white/50 border border-neutral-900 transition-all duration-300 pointer-events-none"
            style={{ left: `calc(${gaugePercent}% - 3px)` }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white shadow-sm" />
          </div>
        </div>

        {/* Range labels below gauge */}
        <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1 px-1">
          <span>60 BPM (Rest)</span>
          <span>115 BPM</span>
          <span>135 BPM</span>
          <span>160 BPM</span>
          <span>195+ BPM (Max)</span>
        </div>
      </div>

      {/* 4 Interactive Color-Coded Zone Badges / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
        {HEART_RATE_ZONES.map((zone) => {
          const isActive = activeZone.id === zone.id;
          return (
            <button
              key={zone.id}
              onClick={() => handleSelectZone(zone)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isActive
                  ? `${zone.badgeBg} ${zone.badgeBorder} ring-2 ring-offset-2 ring-offset-neutral-950 ring-${
                      zone.id === 'Peak'
                        ? 'rose-500'
                        : zone.id === 'Aerobic'
                        ? 'amber-500'
                        : zone.id === 'Fat Burn'
                        ? 'teal-500'
                        : 'emerald-500'
                    } shadow-lg scale-[1.02]`
                  : 'bg-neutral-950/70 border-neutral-800/80 hover:bg-neutral-950 hover:border-neutral-700'
              }`}
              title={`Switch to ${zone.name} (${zone.minBpm}-${zone.maxBpm} BPM)`}
            >
              {isActive && (
                <span className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-mono font-bold text-white bg-neutral-900/90 px-1.5 py-0.5 rounded border border-neutral-700">
                  <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                  ACTIVE
                </span>
              )}

              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`p-1 rounded-md ${
                      zone.id === 'Peak'
                        ? 'bg-rose-500/20 text-rose-400'
                        : zone.id === 'Aerobic'
                        ? 'bg-amber-500/20 text-amber-400'
                        : zone.id === 'Fat Burn'
                        ? 'bg-teal-500/20 text-teal-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {getZoneIcon(zone.id)}
                  </span>
                  <span className={`text-xs font-bold font-display ${isActive ? 'text-white' : 'text-neutral-200'}`}>
                    {zone.shortName}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 mt-2 font-mono">
                  <span className={`text-sm font-black ${zone.badgeText}`}>
                    {zone.minBpm}–{zone.maxBpm}
                  </span>
                  <span className="text-[10px] text-neutral-400">BPM</span>
                  <span className="text-[10px] text-neutral-500 ml-auto">({zone.pctRange})</span>
                </div>

                <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-tight">
                  {zone.description}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-neutral-500">Target</span>
                <span className={isActive ? zone.badgeText : 'text-neutral-300 font-medium'}>
                  {Math.round((zone.minBpm + zone.maxBpm) / 2)} BPM Avg
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Zone Physiological Guidance Footer */}
      <div className="mt-4 pt-3.5 border-t border-neutral-800/80 bg-neutral-950/40 -mx-5 -mb-5 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-neutral-300 text-xs">
            <strong className="text-white font-semibold">{activeZone.name} Benefit: </strong>
            <span className="text-neutral-300">{activeZone.benefit}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg">
            Recommended: <span className="text-neutral-200 font-semibold">{activeZone.idealFor}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
