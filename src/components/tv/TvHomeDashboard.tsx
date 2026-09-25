import React, { useState } from 'react';
import { Workout, ScheduledWorkout, SmartHomeState, WorkoutCategory, SmartScene } from '../../types';
import { TvWorkoutCard } from './TvWorkoutCard';
import { TvSmartHomeWidget } from './TvSmartHomeWidget';
import { TvScheduleWidget } from './TvScheduleWidget';
import { SmartSceneController } from '../smarthome/SmartSceneController';
import { TvHeartRateTrendChart } from './TvHeartRateTrendChart';
import {
  Play,
  Calendar,
  Flame,
  Clock,
  Sparkles,
  Tv,
  ChevronRight,
  Sliders,
  Award,
  Zap,
  Mic,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';

interface TvHomeDashboardProps {
  workouts: Workout[];
  schedule: ScheduledWorkout[];
  smartHomeState: SmartHomeState;
  onUpdateSmartHome: (updater: (prev: SmartHomeState) => SmartHomeState) => void;
  onLaunchWorkout: (workout: Workout) => void;
  onToggleSchedule: (id: string) => void;
  onAddSchedule: (slot: ScheduledWorkout) => void;
  focusedIndex: number;
  onSetFocusedIndex: (index: number) => void;
  onNavigateToAutomate: () => void;
  onTriggerCardioAutomate: () => void;
  isAutomationActive: boolean;
  scenes: SmartScene[];
  activeSceneId: string | null;
  onApplyScene: (scene: SmartScene) => void;
  onSaveNewScene: (scene: SmartScene) => void;
  onDeleteCustomScene: (sceneId: string) => void;
  onOpenVoiceHistory?: () => void;
}

export const TvHomeDashboard: React.FC<TvHomeDashboardProps> = ({
  workouts,
  schedule,
  smartHomeState,
  onUpdateSmartHome,
  onLaunchWorkout,
  onToggleSchedule,
  onAddSchedule,
  focusedIndex,
  onSetFocusedIndex,
  onNavigateToAutomate,
  onTriggerCardioAutomate,
  isAutomationActive,
  scenes,
  activeSceneId,
  onApplyScene,
  onSaveNewScene,
  onDeleteCustomScene,
  onOpenVoiceHistory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<WorkoutCategory>('all');
  const heroWorkout = workouts[0]; // Featured TV Workout

  const filteredWorkouts = selectedCategory === 'all'
    ? workouts
    : workouts.filter((w) => w.category === selectedCategory);

  const categories: { id: WorkoutCategory; label: string }[] = [
    { id: 'all', label: 'All Workouts' },
    { id: 'hiit', label: 'HIIT & Burn' },
    { id: 'strength', label: 'Strength' },
    { id: 'mobility', label: 'Mobility' },
    { id: 'yoga', label: 'Restorative' },
    { id: 'cardio', label: 'Cardio' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* TV Hero Spotlight Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl">
        {/* Background Ambient Glow & Gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${heroWorkout.bgGradient} opacity-60 mix-blend-screen pointer-events-none`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

        {/* Content container */}
        <div className="relative z-10 p-6 md:p-10 max-w-4xl flex flex-col justify-end min-h-[340px]">
          <div className="flex items-center gap-2 mb-2 text-xs font-mono">
            <span className="bg-amber-500 text-neutral-950 font-bold px-2.5 py-0.5 rounded">
              FEATURED ON FIRE TV
            </span>
            <span aria-hidden="true" className="text-neutral-500">·</span>
            <span className="text-amber-400 font-semibold">{heroWorkout.intensity} Intensity</span>
            <span aria-hidden="true" className="text-neutral-500">·</span>
            <span className="text-neutral-300">Living Room Optimized</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black font-display text-white tracking-tight leading-tight">
            {heroWorkout.title}
          </h1>

          <p className="text-sm md:text-base text-neutral-300 mt-2 max-w-2xl leading-relaxed">
            {heroWorkout.description}
          </p>

          {/* Metadata info */}
          <div className="flex items-center gap-3 text-xs md:text-sm text-neutral-300 font-medium mt-4">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Clock className="w-4 h-4" />
              <span className="tabular-nums font-mono">{heroWorkout.durationMinutes} Minutes</span>
            </span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="flex items-center gap-1.5 text-orange-400">
              <Flame className="w-4 h-4" />
              <span className="tabular-nums font-mono">~{heroWorkout.estCalories} kcal</span>
            </span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span>{heroWorkout.equipment}</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="text-neutral-400">Coach {heroWorkout.coach.name}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => {
                playRemoteSelect();
                onLaunchWorkout(heroWorkout);
              }}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm md:text-base flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer tv-focusable active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start on TV (Enter)</span>
            </button>

            <button
              onClick={() => {
                playRemoteClick();
                onAddSchedule({
                  id: `sched-${Date.now()}`,
                  time: 'Tonight 08:00 PM',
                  label: `Scheduled: ${heroWorkout.title}`,
                  workoutId: heroWorkout.id,
                  completed: false,
                  type: 'Evening',
                });
              }}
              className="px-5 py-3 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-white font-semibold text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer border border-neutral-700 tv-focusable"
            >
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>Add to Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Working Automations Quick Hub Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-amber-950/40 border border-neutral-800 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Zap className="w-5 h-5 fill-amber-500/30" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-wider font-bold text-amber-400">
                Automated Living Room Engine
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-950 border border-emerald-700 text-emerald-400">
                {isAutomationActive ? 'ARMED & ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-0.5">
              Auto-cools fan at &gt;140 BPM, shifts TV backlights to workout zones, and uses Google Search Grounding for room climate.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              playRemoteSelect();
              onTriggerCardioAutomate();
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
            title="Fire instant cardio routine automation"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Fire Cardio Routine Now</span>
          </button>

          <button
            onClick={() => {
              playRemoteClick();
              onNavigateToAutomate();
            }}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-neutral-400" />
            <span>Manage Rules & Search AI</span>
          </button>

          {onOpenVoiceHistory && (
            <button
              onClick={() => {
                playRemoteClick();
                onOpenVoiceHistory();
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-800 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View last 10 transcribed Alexa commands & resulting actions"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice History (10)</span>
            </button>
          )}
        </div>
      </div>

      {/* SmartSceneController Quick Presets Shelf */}
      <SmartSceneController
        scenes={scenes}
        activeSceneId={activeSceneId}
        currentHomeState={smartHomeState}
        onApplyScene={onApplyScene}
        onSaveNewScene={onSaveNewScene}
        onDeleteCustomScene={onDeleteCustomScene}
      />

      {/* Real-Time Biometric Telemetry: 15-Minute Heart Rate Trend (d3-based) */}
      <TvHeartRateTrendChart
        smartHomeState={smartHomeState}
        onUpdateSmartHome={onUpdateSmartHome}
      />

      {/* Two Real-Time Companion Widgets on Fire TV: Smart Home & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TvSmartHomeWidget
          state={smartHomeState}
          onChange={onUpdateSmartHome}
        />

        <TvScheduleWidget
          schedule={schedule}
          workouts={workouts}
          onToggleComplete={onToggleSchedule}
          onLaunchWorkout={onLaunchWorkout}
          onAddSchedule={onAddSchedule}
        />
      </div>

      {/* Recommended For You Shelf */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-xl font-bold font-display text-white">
                Personalized TV Recommendations
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Ranked dynamically by AWS Lambda recommendation microservice
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  playRemoteClick();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Workouts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkouts.map((workout, index) => (
            <TvWorkoutCard
              key={workout.id}
              workout={workout}
              isFocused={focusedIndex === index}
              onSelect={onLaunchWorkout}
              onFocusCard={() => onSetFocusedIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
