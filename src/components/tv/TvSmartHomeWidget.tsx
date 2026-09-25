import React from 'react';
import { SmartHomeState } from '../../types';
import { Wind, Lightbulb, Thermometer, Heart, CheckCircle2, RefreshCw } from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';

interface TvSmartHomeWidgetProps {
  state: SmartHomeState;
  onChange: (updater: (prev: SmartHomeState) => SmartHomeState) => void;
  onDeviceEmit?: (deviceName: string, action: string) => void;
  compact?: boolean;
}

export const TvSmartHomeWidget: React.FC<TvSmartHomeWidgetProps> = ({
  state,
  onChange,
  onDeviceEmit,
  compact = false,
}) => {
  const handleFanSpeedChange = (speed: 0 | 1 | 2 | 3) => {
    playRemoteClick();
    onChange((prev) => ({ ...prev, fanSpeed: speed }));
    if (onDeviceEmit) {
      onDeviceEmit('livingroom_fan', `Speed set to ${speed === 0 ? 'OFF' : speed}`);
    }
  };

  const handleAutoCoolToggle = () => {
    playRemoteClick();
    onChange((prev) => ({ ...prev, fanAutoCool: !prev.fanAutoCool }));
    if (onDeviceEmit) {
      onDeviceEmit('livingroom_fan_autocool', `Auto-cool toggled ${!state.fanAutoCool ? 'ON' : 'OFF'}`);
    }
  };

  const handleLightPreset = (light: 'amber' | 'crimson' | 'zen-violet' | 'cool-white' | 'off') => {
    playRemoteSelect();
    onChange((prev) => ({ ...prev, ambientLight: light }));
    if (onDeviceEmit) {
      onDeviceEmit('tv_backlight_hue', `Preset changed to ${light}`);
    }
  };

  const handleTempAdjust = (delta: number) => {
    playRemoteClick();
    onChange((prev) => ({ ...prev, targetTemp: Math.min(78, Math.max(64, prev.targetTemp + delta)) }));
    if (onDeviceEmit) {
      onDeviceEmit('thermostat_target', `Temperature adjusted to ${state.targetTemp + delta}°F`);
    }
  };

  const handleToggleHeartRate = () => {
    playRemoteClick();
    onChange((prev) => ({
      ...prev,
      heartRateConnected: !prev.heartRateConnected,
      pairedHeartRateDevice: !prev.heartRateConnected ? 'Apple Watch Ultra (BLE)' : null,
      currentBpm: !prev.heartRateConnected ? 138 : 72,
    }));
    if (onDeviceEmit) {
      onDeviceEmit('ble_heart_rate_monitor', !state.heartRateConnected ? 'Paired' : 'Disconnected');
    }
  };

  if (compact) {
    return (
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-neutral-200">Living Room Controls</span>
          <span className="text-[10px] text-amber-500 font-mono">AWS IoT Core Sync</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Fan Quick control */}
          <div className="bg-neutral-950 p-2 rounded border border-neutral-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Wind className={`w-3.5 h-3.5 ${state.fanSpeed > 0 ? 'text-cyan-400 animate-spin' : 'text-neutral-500'}`} />
              <span>Fan</span>
            </div>
            <button
              onClick={() => handleFanSpeedChange(((state.fanSpeed + 1) % 4) as 0 | 1 | 2 | 3)}
              className="px-1.5 py-0.5 font-bold rounded bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
            >
              {state.fanSpeed === 0 ? 'OFF' : `L${state.fanSpeed}`}
            </button>
          </div>

          {/* Temp Quick control */}
          <div className="bg-neutral-950 p-2 rounded border border-neutral-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              <span>AC</span>
            </div>
            <span className="font-mono font-bold text-neutral-100">{state.targetTemp}°F</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80">
        <div>
          <h3 className="text-base font-bold font-display text-white">
            Connected Living Room Devices
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Fire TV IoT bridge synced via AWS IoT Core MQTT Broker
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Active Broker</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Device 1: Smart Workout Fan */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${state.fanSpeed > 0 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-neutral-800 text-neutral-500'}`}>
                <Wind className={`w-5 h-5 ${state.fanSpeed > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: `${4 - state.fanSpeed}s` }} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Workout High-Velocity Fan</h4>
                <span className="text-[11px] text-neutral-400">Living Room Facing TV</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {state.fanSpeed === 0 ? 'Off' : `Level ${state.fanSpeed}`}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
            {/* Speed segmented buttons */}
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleFanSpeedChange(speed as 0 | 1 | 2 | 3)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                    state.fanSpeed === speed
                      ? 'bg-cyan-500 text-neutral-950 font-bold'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {speed === 0 ? 'Off' : `L${speed}`}
                </button>
              ))}
            </div>

            {/* Auto cool toggle */}
            <button
              onClick={handleAutoCoolToggle}
              className={`text-[11px] px-2 py-1 rounded transition-colors cursor-pointer ${
                state.fanAutoCool
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Auto-Cool (&gt;140 BPM)
            </button>
          </div>
        </div>

        {/* Device 2: TV Ambient Light Sync */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor:
                    state.ambientLight === 'amber'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : state.ambientLight === 'crimson'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : state.ambientLight === 'zen-violet'
                      ? 'rgba(168, 85, 247, 0.2)'
                      : '#262626',
                  color:
                    state.ambientLight === 'amber'
                      ? '#f59e0b'
                      : state.ambientLight === 'crimson'
                      ? '#ef4444'
                      : state.ambientLight === 'zen-violet'
                      ? '#a855f7'
                      : '#a3a3a3',
                }}
              >
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Philips Hue TV Backlight</h4>
                <span className="text-[11px] text-neutral-400">Atmospheric Living Room Sync</span>
              </div>
            </div>
            <span className="text-xs font-mono font-medium capitalize text-neutral-300">
              {state.ambientLight.replace('-', ' ')}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'amber', label: 'Amber', color: 'bg-amber-500' },
              { id: 'crimson', label: 'Inferno', color: 'bg-rose-500' },
              { id: 'zen-violet', label: 'Zen Violet', color: 'bg-purple-500' },
              { id: 'cool-white', label: 'Daylight', color: 'bg-neutral-200' },
              { id: 'off', label: 'Off', color: 'bg-neutral-800' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleLightPreset(preset.id as any)}
                className={`px-2.5 py-1 text-xs rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                  state.ambientLight === preset.id
                    ? 'ring-2 ring-amber-500 bg-neutral-800 text-white font-medium'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${preset.color}`} />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Device 3: Smart Thermostat Living Room */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Ecobee Smart Thermostat</h4>
                <span className="text-[11px] text-neutral-400">Workout Pre-Cooling Zone</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold font-mono text-white tabular-nums">
                {state.targetTemp}°F
              </div>
              <span className="text-[10px] text-neutral-500">Current: 71°F</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
            <span className="text-xs text-neutral-400">Optimal Cardio Setting: 68°F</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleTempAdjust(-1)}
                className="w-7 h-7 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                -
              </button>
              <button
                onClick={() => handleTempAdjust(1)}
                className="w-7 h-7 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Device 4: Bluetooth Heart Rate Monitor */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-500">
                <Heart className={`w-5 h-5 ${state.heartRateConnected ? 'animate-heart-pulse' : ''}`} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">BLE Heart Rate Wearable</h4>
                <span className="text-[11px] text-neutral-400">
                  {state.heartRateConnected ? state.pairedHeartRateDevice : 'No device paired'}
                </span>
              </div>
            </div>
            {state.heartRateConnected ? (
              <div className="text-right">
                <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">
                  {state.currentBpm} <span className="text-xs font-normal text-neutral-400">BPM</span>
                </div>
                <span className="text-[10px] text-rose-300 font-medium">{state.targetZone}</span>
              </div>
            ) : (
              <span className="text-xs text-neutral-500">Disconnected</span>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              {state.heartRateConnected ? 'AppSync Telemetry Active' : 'Pair Watch or Chest Strap'}
            </span>
            <button
              onClick={handleToggleHeartRate}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                state.heartRateConnected
                  ? 'bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900/60'
                  : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              <span>{state.heartRateConnected ? 'Disconnect' : 'Pair BLE Device'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
