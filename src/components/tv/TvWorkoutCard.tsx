import React from 'react';
import { Workout } from '../../types';
import { Flame, Clock, Dumbbell, Star, Play } from 'lucide-react';
import { playRemoteClick } from '../../utils/soundEffects';

interface TvWorkoutCardProps {
  workout: Workout;
  isFocused: boolean;
  onSelect: (workout: Workout) => void;
  onFocusCard?: () => void;
}

export const TvWorkoutCard: React.FC<TvWorkoutCardProps> = ({
  workout,
  isFocused,
  onSelect,
  onFocusCard,
}) => {
  return (
    <div
      onClick={() => onSelect(workout)}
      onMouseEnter={() => {
        if (onFocusCard) onFocusCard();
      }}
      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 tv-focusable bg-neutral-900 border ${
        isFocused
          ? 'border-amber-500 scale-[1.03] shadow-xl shadow-amber-500/20 ring-2 ring-amber-500/50 z-10'
          : 'border-neutral-800/90 hover:border-neutral-700'
      }`}
    >
      {/* Visual Canvas / Gradient Artwork */}
      <div
        className={`h-40 w-full bg-gradient-to-br ${workout.bgGradient} relative flex items-center justify-center overflow-hidden p-4`}
      >
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-15 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Dynamic Category Silhouette Art */}
        <div className="relative z-1 flex flex-col items-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${workout.accentColor}25`, borderColor: workout.accentColor }}
          >
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400 mt-2 font-medium">
            {workout.musicGenre}
          </span>
        </div>

        {/* Hover / Focused Play Indicator */}
        <div
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow-lg transition-all ${
            isFocused ? 'scale-100 opacity-100' : 'scale-90 opacity-0 group-hover:opacity-100'
          }`}
        >
          <Play className="w-4 h-4 fill-current ml-0.5" />
        </div>

        {/* Intensity indicator as clean text */}
        <div className="absolute top-3 left-3 text-xs font-semibold text-neutral-300 backdrop-blur-md bg-neutral-950/60 px-2 py-0.5 rounded">
          {workout.intensity} Intensity
        </div>
      </div>

      {/* Card Content & Zero-Pill Metadata */}
      <div className="p-4 bg-neutral-900/90">
        <h4 className="text-base font-bold font-display text-white truncate group-hover:text-amber-400 transition-colors">
          {workout.title}
        </h4>

        {/* Unboxed metadata with typographic separators */}
        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1.5 font-medium">
          <span className="flex items-center gap-1 text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="tabular-nums">{workout.durationMinutes} min</span>
          </span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="flex items-center gap-1 text-orange-400">
            <Flame className="w-3.5 h-3.5" />
            <span className="tabular-nums">~{workout.estCalories} kcal</span>
          </span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span>{workout.equipment}</span>
        </div>

        <p className="text-xs text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
          {workout.description}
        </p>

        {/* Coach attribution */}
        <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-xs">
          <span className="text-neutral-300 font-medium truncate max-w-[170px]">
            Coach {workout.coach.name}
          </span>
          <div className="flex items-center gap-1 text-neutral-400 font-mono">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="tabular-nums text-neutral-200">{workout.rating.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
