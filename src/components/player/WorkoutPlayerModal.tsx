import React, { useState, useEffect, useRef } from 'react';
import { Workout, SmartHomeState, SmartScene } from '../../types';
import {
  Play,
  Pause,
  SkipForward,
  X,
  Heart,
  Flame,
  Volume2,
  VolumeX,
  Tv,
  Wind,
  Layers,
  Sparkles,
  CheckCircle,
  Eye,
  Sliders,
  Flower2,
  Radio,
} from 'lucide-react';
import {
  playCountdownBeep,
  playRemoteClick,
  playRemoteSelect,
  isSoundEnabled,
  toggleSound,
} from '../../utils/soundEffects';

interface WorkoutPlayerModalProps {
  workout: Workout;
  smartHomeState: SmartHomeState;
  onUpdateSmartHome: (updater: (prev: SmartHomeState) => SmartHomeState) => void;
  onClose: () => void;
  onCompleteWorkout: (workout: Workout, caloriesBurned: number) => void;
  scenes?: SmartScene[];
  onApplyScene?: (scene: SmartScene) => void;
}

export const WorkoutPlayerModal: React.FC<WorkoutPlayerModalProps> = ({
  workout,
  smartHomeState,
  onUpdateSmartHome,
  onClose,
  onCompleteWorkout,
  scenes = [],
  onApplyScene,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    workout.steps[0]?.durationSeconds || 45
  );
  const [isPlaying, setIsPlaying] = useState(true);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [simulatedBpm, setSimulatedBpm] = useState(smartHomeState.currentBpm || 128);
  const [pipMode, setPipMode] = useState<'coach' | 'muscles' | 'next'>('muscles');
  const [showWidgetsDrawer, setShowWidgetsDrawer] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const currentStep = workout.steps[currentStepIndex];
  const nextStep = workout.steps[currentStepIndex + 1];

  // Dynamic heart rate zone
  const getZone = (bpm: number) => {
    if (bpm < 115) return 'Warmup';
    if (bpm < 142) return 'Aerobic';
    if (bpm < 165) return 'Threshold';
    return 'Peak';
  };

  // Timer interval
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        // Countdown beeps at 3, 2, 1
        if (prev <= 4 && prev > 1) {
          playCountdownBeep(false);
        } else if (prev === 1) {
          playCountdownBeep(true);
        }

        if (prev <= 1) {
          // Transition work to rest or next step
          if (!isResting && currentStep.restAfterSeconds > 0) {
            setIsResting(true);
            return currentStep.restAfterSeconds;
          } else {
            // Next step
            if (currentStepIndex < workout.steps.length - 1) {
              setCurrentStepIndex((idx) => idx + 1);
              setIsResting(false);
              return workout.steps[currentStepIndex + 1].durationSeconds;
            } else {
              // Workout finished
              setIsPlaying(false);
              onCompleteWorkout(workout, caloriesBurned + 10);
              return 0;
            }
          }
        }
        return prev - 1;
      });

      // Increment calories burned based on intensity & heart rate
      setCaloriesBurned((prev) => +(prev + (simulatedBpm > 150 ? 0.28 : 0.18)).toFixed(1));

      // Simulate natural heart rate drift during workout
      setSimulatedBpm((prev) => {
        const delta = (Math.random() - 0.45) * 2;
        const target = isResting ? 118 : workout.intensity === 'High' ? 158 : 134;
        const next = Math.round(prev + (target - prev) * 0.05 + delta);

        // Auto cool check: if > 145 BPM and fan autocool is enabled
        if (next > 145 && smartHomeState.fanAutoCool && smartHomeState.fanSpeed < 3) {
          onUpdateSmartHome((s) => ({ ...s, fanSpeed: 3 }));
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isPlaying,
    isResting,
    currentStepIndex,
    workout,
    currentStep,
    simulatedBpm,
    smartHomeState.fanAutoCool,
    smartHomeState.fanSpeed,
    onCompleteWorkout,
    onUpdateSmartHome,
    caloriesBurned,
  ]);

  const handleNextStep = () => {
    playRemoteSelect();
    if (currentStepIndex < workout.steps.length - 1) {
      setCurrentStepIndex((idx) => idx + 1);
      setIsResting(false);
      setSecondsRemaining(workout.steps[currentStepIndex + 1].durationSeconds);
    } else {
      onCompleteWorkout(workout, Math.round(caloriesBurned));
    }
  };

  const togglePlayPause = () => {
    playRemoteClick();
    setIsPlaying(!isPlaying);
  };

  const handleSoundToggle = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  const currentZone = getZone(simulatedBpm);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col overflow-hidden select-none">
      {/* 10-ft TV Cinema Stage */}
      <div className="relative flex-1 bg-gradient-to-b from-neutral-900 to-neutral-950 flex flex-col justify-between p-6 md:p-10 overflow-hidden">
        {/* Ambient workout glow synchronized with Living Room Light preset */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] blur-[120px] rounded-full opacity-30 pointer-events-none transition-all duration-700"
          style={{
            backgroundColor:
              smartHomeState.ambientLight === 'crimson'
                ? '#ef4444'
                : smartHomeState.ambientLight === 'zen-violet'
                ? '#a855f7'
                : '#f59e0b',
          }}
        />

        {/* Top HUD Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-mono text-amber-500 font-semibold">
                  Fire TV Live Stream
                </span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-400">4K Ultra HD 60fps</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold font-display text-white tracking-tight">
                {workout.title}
              </h2>
            </div>
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWidgetsDrawer(!showWidgetsDrawer)}
              className="px-3.5 py-2 rounded-xl bg-neutral-900/90 border border-neutral-700/80 hover:border-amber-500 text-neutral-200 hover:text-white transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>TV Widgets Menu</span>
            </button>

            <button
              onClick={handleSoundToggle}
              className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle audio beeps"
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Exit Workout"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Stage: Exercise Movement Focus & Kinetic Visualizer */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full py-6">
          {/* Phase Header: Work vs Rest */}
          <div className="mb-4">
            <span
              className={`text-sm md:text-base font-mono uppercase tracking-widest font-bold px-4 py-1.5 rounded-full inline-block ${
                isResting
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {isResting ? 'Recovery & Hydrate' : `Exercise ${currentStepIndex + 1} of ${workout.steps.length}`}
            </span>
          </div>

          {/* Exercise Title */}
          <h1 className="text-3xl md:text-5xl font-black font-display text-white tracking-tight leading-tight max-w-3xl">
            {isResting ? 'Catch Your Breath' : currentStep.name}
          </h1>

          {/* Form Cue / Instruction */}
          <p className="text-base md:text-lg text-neutral-300 mt-3 max-w-2xl font-medium leading-relaxed">
            {isResting ? `Up next: ${nextStep?.name || 'Cool Down Stretch'}` : currentStep.formCue}
          </p>

          {/* Big TV Timer Display */}
          <div className="my-8 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              {/* Outer circular gauge */}
              <div className="w-44 h-44 md:w-56 md:h-56 rounded-full border-4 border-neutral-800 flex flex-col items-center justify-center bg-neutral-950/80 shadow-2xl relative">
                <span className="text-5xl md:text-7xl font-black font-mono tracking-tighter text-white tabular-nums">
                  {secondsRemaining}
                </span>
                <span className="text-xs uppercase tracking-widest text-neutral-400 font-mono mt-1">
                  Seconds
                </span>
              </div>
            </div>

            {/* Target muscle text */}
            <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber-400/90 font-mono">
              Target: {currentStep.targetMuscle}
            </div>
          </div>
        </div>

        {/* Real-time Viewing Widgets: Bottom Biometrics Dock */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-5xl mx-auto w-full">
          {/* Widget 1: Heart Rate Monitor (BPM) */}
          <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
                <Heart className="w-6 h-6 animate-heart-pulse" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-mono block">
                  Heart Rate
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-white tabular-nums">
                    {simulatedBpm}
                  </span>
                  <span className="text-xs text-neutral-400">BPM</span>
                </div>
              </div>
            </div>
            <span
              className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                currentZone === 'Peak'
                  ? 'bg-rose-500 text-neutral-950'
                  : currentZone === 'Threshold'
                  ? 'bg-orange-500 text-neutral-950'
                  : currentZone === 'Aerobic'
                  ? 'bg-amber-400 text-neutral-950'
                  : 'bg-emerald-500 text-neutral-950'
              }`}
            >
              {currentZone}
            </span>
          </div>

          {/* Widget 2: Calorie Burn Real-Time Ticker */}
          <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-mono block">
                  Burn Active
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-white tabular-nums">
                    {Math.round(caloriesBurned)}
                  </span>
                  <span className="text-xs text-neutral-400">kcal</span>
                </div>
              </div>
            </div>
            <span className="text-[11px] text-amber-400 font-mono">
              Target ~{workout.estCalories}
            </span>
          </div>

          {/* Widget 3: Reps & Pace Cadence */}
          <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-mono block">
                Cadence & Effort
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black font-mono text-white tabular-nums">
                  {currentStep.reps ? `${currentStep.reps} Reps` : 'Max Effort'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-400 font-mono font-bold">In Rhythm</span>
              <span className="text-[10px] text-neutral-400 block font-mono">
                {workout.musicGenre.split(' ')[0]}
              </span>
            </div>
          </div>

          {/* Widget 4: Playback Controls */}
          <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 flex items-center justify-center gap-2 shadow-xl">
            <button
              onClick={togglePlayPause}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Resume'}</span>
            </button>

            <button
              onClick={handleNextStep}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Next Exercise"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Picture-in-Picture (PIP) TV Viewing Widget: Top Right corner */}
        <div className="hidden lg:block absolute top-24 right-8 w-64 bg-neutral-900/95 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl z-20">
          <div className="px-3 py-2 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between text-[11px]">
            <span className="font-bold text-neutral-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              TV PIP Widget
            </span>
            <div className="flex items-center gap-1">
              {(['muscles', 'coach', 'next'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPipMode(mode)}
                  className={`px-1.5 py-0.5 rounded capitalize ${
                    pipMode === mode
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 text-xs">
            {pipMode === 'muscles' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-amber-400 uppercase font-mono font-semibold">
                  Muscle Activation
                </span>
                <p className="text-neutral-200 font-medium">{currentStep.targetMuscle}</p>
                <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (simulatedBpm / 180) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-400 block pt-1">
                  Biomechanical Form Guide active
                </span>
              </div>
            )}

            {pipMode === 'coach' && (
              <div className="space-y-1">
                <span className="text-[10px] text-amber-400 uppercase font-mono font-semibold">
                  Coach Guidance
                </span>
                <p className="text-neutral-200 font-bold">{workout.coach.name}</p>
                <p className="text-[11px] text-neutral-400 italic">
                  "{currentStep.formCue}"
                </p>
              </div>
            )}

            {pipMode === 'next' && (
              <div className="space-y-1">
                <span className="text-[10px] text-amber-400 uppercase font-mono font-semibold">
                  Coming Up Next
                </span>
                <p className="text-neutral-200 font-bold">
                  {nextStep ? nextStep.name : 'Finish & Final Score'}
                </p>
                <span className="text-[11px] text-neutral-400 block font-mono">
                  {nextStep ? `${nextStep.durationSeconds}s duration` : 'Cooldown session'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TV Quick Widgets Menu Drawer (Slide out overlay during workout) */}
        {showWidgetsDrawer && (
          <div className="absolute inset-y-0 right-0 w-80 bg-neutral-900/98 border-l border-neutral-700 shadow-2xl p-5 z-30 flex flex-col justify-between backdrop-blur-xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  Living Room Controls (TV HUD)
                </h3>
                <button
                  onClick={() => setShowWidgetsDrawer(false)}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Smart Scene Switcher in Drawer */}
              {scenes.length > 0 && onApplyScene && (
                <div className="mt-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-amber-500" />
                      Smart Scene Presets
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {scenes.slice(0, 4).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          playRemoteSelect();
                          onApplyScene(s);
                        }}
                        className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition-all cursor-pointer"
                      >
                        <span className="text-[11px] font-bold text-white block truncate">
                          {s.name.replace(' Mode', '')}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {s.settings.targetTemp}°F · L{s.settings.fanSpeed}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fan control during workout */}
              <div className="mt-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    Workout Fan
                  </span>
                  <span className="text-xs font-mono text-cyan-400">
                    {smartHomeState.fanSpeed === 0 ? 'Off' : `Level ${smartHomeState.fanSpeed}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3].map((spd) => (
                    <button
                      key={spd}
                      onClick={() =>
                        onUpdateSmartHome((prev) => ({ ...prev, fanSpeed: spd as any }))
                      }
                      className={`flex-1 py-1 text-xs rounded font-medium ${
                        smartHomeState.fanSpeed === spd
                          ? 'bg-cyan-500 text-neutral-950 font-bold'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {spd === 0 ? 'Off' : `L${spd}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* TV Ambiance Light during workout */}
              <div className="mt-4 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="text-xs font-semibold text-neutral-200 block mb-2">
                  Workout Light Sync
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    onClick={() =>
                      onUpdateSmartHome((prev) => ({ ...prev, ambientLight: 'crimson' }))
                    }
                    className={`p-2 rounded text-left ${
                      smartHomeState.ambientLight === 'crimson'
                        ? 'bg-rose-950/80 border border-rose-600 text-rose-300 font-bold'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Inferno Red
                  </button>
                  <button
                    onClick={() =>
                      onUpdateSmartHome((prev) => ({ ...prev, ambientLight: 'amber' }))
                    }
                    className={`p-2 rounded text-left ${
                      smartHomeState.ambientLight === 'amber'
                        ? 'bg-amber-950/80 border border-amber-600 text-amber-300 font-bold'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Focus Amber
                  </button>
                  <button
                    onClick={() =>
                      onUpdateSmartHome((prev) => ({ ...prev, ambientLight: 'zen-violet' }))
                    }
                    className={`p-2 rounded text-left ${
                      smartHomeState.ambientLight === 'zen-violet'
                        ? 'bg-purple-950/80 border border-purple-600 text-purple-300 font-bold'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Zen Violet
                  </button>
                  <button
                    onClick={() =>
                      onUpdateSmartHome((prev) => ({ ...prev, ambientLight: 'cool-white' }))
                    }
                    className={`p-2 rounded text-left ${
                      smartHomeState.ambientLight === 'cool-white'
                        ? 'bg-neutral-800 border border-neutral-400 text-white font-bold'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Cool White
                  </button>
                </div>
              </div>

              {/* AWS Telemetry Ping status */}
              <div className="mt-4 p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 text-[11px] space-y-1">
                <span className="text-amber-500 font-mono font-semibold">AWS AppSync Telemetry</span>
                <p className="text-neutral-400">Stream Latency: 16ms</p>
                <p className="text-neutral-400">Buffer Health: 99.8%</p>
              </div>
            </div>

            <button
              onClick={() => setShowWidgetsDrawer(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400"
            >
              Resume Fullscreen TV
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
