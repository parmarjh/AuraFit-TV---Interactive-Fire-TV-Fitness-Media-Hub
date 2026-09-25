import React, { useState } from 'react';
import { SmartScene, SmartHomeState } from '../../types';
import {
  Flame,
  Flower2,
  Dumbbell,
  Moon,
  Sparkles,
  Sun,
  Wind,
  Lightbulb,
  Thermometer,
  Plus,
  Check,
  CheckCircle2,
  Trash2,
  Radio,
  Sliders,
  Play,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';

interface SmartSceneControllerProps {
  scenes: SmartScene[];
  activeSceneId: string | null;
  currentHomeState: SmartHomeState;
  onApplyScene: (scene: SmartScene) => void;
  onSaveNewScene: (scene: SmartScene) => void;
  onDeleteCustomScene: (sceneId: string) => void;
  compact?: boolean;
}

export const SmartSceneController: React.FC<SmartSceneControllerProps> = ({
  scenes,
  activeSceneId,
  currentHomeState,
  onApplyScene,
  onSaveNewScene,
  onDeleteCustomScene,
  compact = false,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneDesc, setNewSceneDesc] = useState('');
  const [newSceneIcon, setNewSceneIcon] = useState<SmartScene['iconName']>('flame');
  const [newSceneTemp, setNewSceneTemp] = useState<number>(currentHomeState.targetTemp);
  const [newSceneFan, setNewSceneFan] = useState<0 | 1 | 2 | 3>(currentHomeState.fanSpeed);
  const [newSceneLight, setNewSceneLight] = useState<SmartHomeState['ambientLight']>(
    currentHomeState.ambientLight
  );
  const [newSceneBrightness, setNewSceneBrightness] = useState<number>(
    currentHomeState.ambientBrightness || 80
  );
  const [newSceneVoice, setNewSceneVoice] = useState('');

  const getSceneIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'flame':
        return <Flame className={className} />;
      case 'lotus':
        return <Flower2 className={className} />;
      case 'dumbbell':
        return <Dumbbell className={className} />;
      case 'moon':
        return <Moon className={className} />;
      case 'sun':
        return <Sun className={className} />;
      case 'sparkles':
      default:
        return <Sparkles className={className} />;
    }
  };

  const handleOpenSaveCurrent = () => {
    playRemoteClick();
    setNewSceneName(`Custom ${currentHomeState.targetTemp}°F Scene`);
    setNewSceneDesc(
      `Living Room AC ${currentHomeState.targetTemp}°F, Fan ${
        currentHomeState.fanSpeed === 0 ? 'Off' : `L${currentHomeState.fanSpeed}`
      }, and ${currentHomeState.ambientLight} lighting.`
    );
    setNewSceneTemp(currentHomeState.targetTemp);
    setNewSceneFan(currentHomeState.fanSpeed);
    setNewSceneLight(currentHomeState.ambientLight);
    setNewSceneBrightness(currentHomeState.ambientBrightness || 80);
    setNewSceneIcon('sparkles');
    setNewSceneVoice(`Alexa, set scene ${scenes.length + 1}`);
    setShowCreateModal(true);
  };

  const handleSaveSceneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSceneName.trim()) return;

    const accentMap: Record<string, string> = {
      amber: '#f59e0b',
      crimson: '#ef4444',
      'zen-violet': '#a855f7',
      'cool-white': '#38bdf8',
      off: '#737373',
    };

    const newScene: SmartScene = {
      id: `scene-custom-${Date.now()}`,
      name: newSceneName.trim(),
      description: newSceneDesc.trim() || 'Custom saved living room climate preset.',
      iconName: newSceneIcon,
      settings: {
        fanSpeed: newSceneFan,
        fanAutoCool: newSceneFan >= 2,
        ambientLight: newSceneLight,
        ambientBrightness: newSceneBrightness,
        targetTemp: newSceneTemp,
      },
      accentColor: accentMap[newSceneLight] || '#f59e0b',
      badge: 'Custom Scene',
      voicePhrase: newSceneVoice.trim() || `Alexa, activate ${newSceneName.toLowerCase()}`,
      isCustom: true,
    };

    playRemoteSelect();
    onSaveNewScene(newScene);
    setShowCreateModal(false);
  };

  // Quick Compact Widget (for TV Dashboard shelf)
  if (compact) {
    return (
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Smart Scene Controller
            </h4>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">AWS IoT Synced</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {scenes.slice(0, 4).map((scene) => {
            const isActive = activeSceneId === scene.id;
            return (
              <button
                key={scene.id}
                onClick={() => {
                  playRemoteSelect();
                  onApplyScene(scene);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'border-amber-500 bg-amber-500/15 shadow-md shadow-amber-500/20 ring-1 ring-amber-500'
                    : 'border-neutral-800 bg-neutral-950/80 hover:border-neutral-700 hover:bg-neutral-950'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className="p-1.5 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${scene.accentColor}25`, color: scene.accentColor }}
                  >
                    {getSceneIcon(scene.iconName, 'w-4 h-4')}
                  </div>
                  {isActive ? (
                    <span className="text-[9px] font-mono font-bold bg-amber-500 text-neutral-950 px-1.5 py-0.2 rounded">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-neutral-400">
                      {scene.settings.targetTemp}°F
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold text-white truncate block">
                    {scene.name.split(' ')[0]} {scene.name.split(' ')[1]}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono mt-0.5">
                    <span>Fan {scene.settings.fanSpeed === 0 ? 'Off' : `L${scene.settings.fanSpeed}`}</span>
                    <span aria-hidden="true" className="text-neutral-600">·</span>
                    <span className="capitalize">{scene.settings.ambientLight.split('-')[0]}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Full Expanded Scene Controller Hub
  return (
    <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-6 shadow-xl relative">
      {/* Header with Title and Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-800/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-500" />
            <h3 className="text-base md:text-lg font-bold font-display text-white">
              Smart Scene Controller
            </h3>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
              One-Touch TV Presets
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Simultaneously coordinates air conditioning, workout fans, and ambient lighting states across your living room.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenSaveCurrent}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700 hover:border-amber-500"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Save Current as New Scene</span>
          </button>
        </div>
      </div>

      {/* Direct Workout vs Yoga Comparison Bar */}
      <div className="my-5 p-4 rounded-xl bg-neutral-950 border border-neutral-800/90 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
            Fast Comparison:
          </span>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Workout: 66°F · Crimson · Fan L3</span>
            </div>
            <span className="text-neutral-500 text-xs">vs</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800 text-purple-300">
              <Flower2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Yoga: 74°F · Zen Violet · Fan Off</span>
            </div>
          </div>
        </div>

        {/* Quick Instant Toggle Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              const workoutScene = scenes.find((s) => s.id === 'scene-workout-inferno');
              if (workoutScene) {
                playRemoteSelect();
                onApplyScene(workoutScene);
              }
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSceneId === 'scene-workout-inferno'
                ? 'bg-rose-500 text-neutral-950 ring-2 ring-rose-400'
                : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800/80'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Trigger Workout Mode</span>
          </button>

          <button
            onClick={() => {
              const yogaScene = scenes.find((s) => s.id === 'scene-yoga-mindful');
              if (yogaScene) {
                playRemoteSelect();
                onApplyScene(yogaScene);
              }
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSceneId === 'scene-yoga-mindful'
                ? 'bg-purple-500 text-neutral-950 ring-2 ring-purple-400'
                : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 border border-purple-800/80'
            }`}
          >
            <Flower2 className="w-3.5 h-3.5" />
            <span>Trigger Yoga Mode</span>
          </button>
        </div>
      </div>

      {/* Grid of Saved Scenes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenes.map((scene) => {
          const isActive = activeSceneId === scene.id;
          return (
            <div
              key={scene.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-amber-500 bg-neutral-950 ring-2 ring-amber-500/40 shadow-xl'
                  : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
              }`}
            >
              <div>
                {/* Scene Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-2 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${scene.accentColor}25`, color: scene.accentColor }}
                    >
                      {getSceneIcon(scene.iconName, 'w-5 h-5')}
                    </div>
                    {scene.badge && (
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                        {scene.badge}
                      </span>
                    )}
                  </div>

                  {isActive ? (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : scene.isCustom ? (
                    <button
                      onClick={() => onDeleteCustomScene(scene.id)}
                      className="p-1 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete custom scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>

                <h4 className="text-sm font-bold text-white">{scene.name}</h4>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {scene.description}
                </p>

                {/* Combined State Specs */}
                <div className="grid grid-cols-3 gap-1.5 my-3 pt-3 border-t border-neutral-800/80 text-[11px] font-mono">
                  <div className="bg-neutral-900/80 p-1.5 rounded flex flex-col items-center">
                    <Thermometer className="w-3.5 h-3.5 text-rose-400 mb-0.5" />
                    <span className="text-white font-bold">{scene.settings.targetTemp}°F</span>
                    <span className="text-[9px] text-neutral-500">Thermostat</span>
                  </div>

                  <div className="bg-neutral-900/80 p-1.5 rounded flex flex-col items-center">
                    <Wind className="w-3.5 h-3.5 text-cyan-400 mb-0.5" />
                    <span className="text-white font-bold">
                      {scene.settings.fanSpeed === 0 ? 'Off' : `Level ${scene.settings.fanSpeed}`}
                    </span>
                    <span className="text-[9px] text-neutral-500">Workout Fan</span>
                  </div>

                  <div className="bg-neutral-900/80 p-1.5 rounded flex flex-col items-center">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                    <span className="text-white font-bold capitalize truncate max-w-full">
                      {scene.settings.ambientLight.split('-')[0]}
                    </span>
                    <span className="text-[9px] text-neutral-500">Lighting</span>
                  </div>
                </div>
              </div>

              <div>
                {/* Voice Assistant Hint */}
                <div className="text-[10px] text-cyan-400/90 font-mono italic mb-2.5 truncate">
                  "{scene.voicePhrase}"
                </div>

                {/* Trigger Button */}
                <button
                  onClick={() => {
                    playRemoteSelect();
                    onApplyScene(scene);
                  }}
                  className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-sm shadow-amber-500/20'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      <span>Re-Apply Scene</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Trigger Scene Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Save Custom Scene Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-xs md:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-white text-base">Save Living Room Smart Scene</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSceneSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Scene Title</label>
                <input
                  type="text"
                  value={newSceneName}
                  onChange={(e) => setNewSceneName(e.target.value)}
                  placeholder="e.g. Evening Pilates Chilling"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Description</label>
                <input
                  type="text"
                  value={newSceneDesc}
                  onChange={(e) => setNewSceneDesc(e.target.value)}
                  placeholder="Describe optimal lighting and temperature"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Target Temp */}
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">
                    Thermostat Temp (°F)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={62}
                      max={80}
                      value={newSceneTemp}
                      onChange={(e) => setNewSceneTemp(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                    />
                    <span className="text-neutral-400 font-mono">°F</span>
                  </div>
                </div>

                {/* Fan Speed */}
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Fan Speed</label>
                  <select
                    value={newSceneFan}
                    onChange={(e) => setNewSceneFan(Number(e.target.value) as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value={0}>Level 0 (Off)</option>
                    <option value={1}>Level 1 (Breeze)</option>
                    <option value={2}>Level 2 (Medium)</option>
                    <option value={3}>Level 3 (Turbo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Ambient Light Preset */}
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Ambient Light Color</label>
                  <select
                    value={newSceneLight}
                    onChange={(e) => setNewSceneLight(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value="amber">Focus Amber</option>
                    <option value="crimson">Inferno Crimson</option>
                    <option value="zen-violet">Zen Violet</option>
                    <option value="cool-white">Cool Daylight White</option>
                    <option value="off">Off</option>
                  </select>
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Scene Icon</label>
                  <select
                    value={newSceneIcon}
                    onChange={(e) => setNewSceneIcon(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value="flame">Flame (Intense Workout)</option>
                    <option value="lotus">Lotus (Yoga / Mindfulness)</option>
                    <option value="dumbbell">Dumbbell (Strength & Cardio)</option>
                    <option value="moon">Moon (Recovery / Sleep)</option>
                    <option value="sun">Sun (Morning Energy)</option>
                    <option value="sparkles">Sparkles (Custom Preset)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">
                  Alexa Voice Command Shortcut
                </label>
                <input
                  type="text"
                  value={newSceneVoice}
                  onChange={(e) => setNewSceneVoice(e.target.value)}
                  placeholder="e.g. Alexa, start my yoga flow"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-cyan-300 font-mono text-xs"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold"
                >
                  Save Scene
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
