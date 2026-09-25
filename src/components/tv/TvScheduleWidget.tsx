import React, { useState } from 'react';
import { ScheduledWorkout, Workout } from '../../types';
import { Calendar, CheckCircle, Circle, Play, Plus, Clock } from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';

interface TvScheduleWidgetProps {
  schedule: ScheduledWorkout[];
  workouts: Workout[];
  onToggleComplete: (id: string) => void;
  onLaunchWorkout: (workout: Workout) => void;
  onAddSchedule: (slot: ScheduledWorkout) => void;
  compact?: boolean;
}

export const TvScheduleWidget: React.FC<TvScheduleWidgetProps> = ({
  schedule,
  workouts,
  onToggleComplete,
  onLaunchWorkout,
  onAddSchedule,
  compact = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTime, setNewTime] = useState('05:30 PM');
  const [newLabel, setNewLabel] = useState('Quick Core Blast');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(workouts[0]?.id || '');
  const [newSlotType, setNewSlotType] = useState<'Morning' | 'Midday' | 'Evening' | 'Night'>('Evening');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel) return;
    const newSlot: ScheduledWorkout = {
      id: `sched-${Date.now()}`,
      time: newTime,
      label: newLabel,
      workoutId: selectedWorkoutId,
      completed: false,
      type: newSlotType,
    };
    playRemoteSelect();
    onAddSchedule(newSlot);
    setShowAddForm(false);
  };

  const getWorkoutById = (id: string) => workouts.find((w) => w.id === id);

  if (compact) {
    return (
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-200">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>Today's Fire TV Schedule</span>
          </div>
          <span className="text-[10px] text-neutral-400">AWS DynamoDB Sync</span>
        </div>

        <div className="space-y-2">
          {schedule.slice(0, 3).map((item) => {
            const wk = getWorkoutById(item.workoutId);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded bg-neutral-950/80 border border-neutral-800/80 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <button
                    onClick={() => {
                      playRemoteClick();
                      onToggleComplete(item.id);
                    }}
                    className="text-neutral-500 hover:text-amber-500"
                  >
                    {item.completed ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <div className="truncate">
                    <span className={`font-medium ${item.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                      {item.label}
                    </span>
                    <span className="text-[10px] text-neutral-400 block font-mono">
                      {item.time}
                    </span>
                  </div>
                </div>

                {wk && (
                  <button
                    onClick={() => onLaunchWorkout(wk)}
                    className="p-1 rounded bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-300 transition-colors shrink-0 ml-2"
                    title="Start on TV"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80">
        <div>
          <h3 className="text-base font-bold font-display text-white">
            Daily Fire TV Schedule
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Synchronized with user calendar via AWS Lambda serverless sync
          </p>
        </div>

        <button
          onClick={() => {
            playRemoteClick();
            setShowAddForm(!showAddForm);
          }}
          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Session</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="my-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <h4 className="text-xs font-bold text-neutral-300 mb-3">Schedule New Living Room Workout</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1">Time</label>
              <input
                type="text"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono"
                placeholder="06:30 PM"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Session Title</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                placeholder="Evening Sweat Session"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Link Workout</label>
              <select
                value={selectedWorkoutId}
                onChange={(e) => setSelectedWorkoutId(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
              >
                {workouts.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title} ({w.durationMinutes}m)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Slot Type</label>
              <select
                value={newSlotType}
                onChange={(e) => setNewSlotType(e.target.value as any)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value="Morning">Morning</option>
                <option value="Midday">Midday</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-amber-500 text-neutral-950 font-bold rounded text-xs hover:bg-amber-400"
            >
              Save Schedule Slot
            </button>
          </div>
        </form>
      )}

      {/* Schedule Items List */}
      <div className="space-y-3 mt-4">
        {schedule.map((slot) => {
          const matchedWorkout = getWorkoutById(slot.workoutId);
          return (
            <div
              key={slot.id}
              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                slot.completed
                  ? 'bg-neutral-950/40 border-neutral-800/50 opacity-70'
                  : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    playRemoteClick();
                    onToggleComplete(slot.id);
                  }}
                  className="cursor-pointer text-neutral-500 hover:text-amber-500 transition-colors"
                  title={slot.completed ? 'Mark uncompleted' : 'Mark completed'}
                >
                  {slot.completed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-600 hover:text-neutral-400" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-sm font-semibold ${
                        slot.completed ? 'line-through text-neutral-500' : 'text-white'
                      }`}
                    >
                      {slot.label}
                    </h4>
                    <span className="text-xs text-amber-400/90 font-mono font-medium">
                      [{slot.type}]
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      {slot.time}
                    </span>
                    {matchedWorkout && (
                      <>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span>{matchedWorkout.title}</span>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span className="tabular-nums">~{matchedWorkout.estCalories} kcal</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {matchedWorkout && (
                <button
                  onClick={() => onLaunchWorkout(matchedWorkout)}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer group"
                >
                  <Play className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
                  <span>Launch on TV</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
