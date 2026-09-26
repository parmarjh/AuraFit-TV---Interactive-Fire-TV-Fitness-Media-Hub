import React, { useState } from 'react';
import { VoiceCommandRecord } from '../../types';
import {
  Mic,
  X,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  Flame,
  Tv,
  Wind,
  Search,
  Filter,
  Volume2,
  Send,
  Sliders,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';

interface VoiceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: VoiceCommandRecord[];
  onReplayCommand: (transcript: string) => void;
  onClearHistory: () => void;
}

export const VoiceHistoryModal: React.FC<VoiceHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onReplayCommand,
  onClearHistory,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customVoiceInput, setCustomVoiceInput] = useState('');

  if (!isOpen) return null;

  // Last 10 records
  const recentTen = history.slice(0, 10);

  const filteredHistory = recentTen.filter((record) => {
    const matchesCat = filterCategory === 'all' || record.category === filterCategory;
    const matchesSearch =
      record.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.resultingAction.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryBadge = (category: VoiceCommandRecord['category']) => {
    switch (category) {
      case 'scene':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-purple-950/80 border border-purple-800 text-purple-300">
            Smart Scene
          </span>
        );
      case 'workout':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-rose-950/80 border border-rose-800 text-rose-300">
            Workout Launch
          </span>
        );
      case 'device':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-cyan-950/80 border border-cyan-800 text-cyan-300">
            Device Control
          </span>
        );
      case 'advisor':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-amber-950/80 border border-amber-800 text-amber-300">
            Search AI / Telemetry
          </span>
        );
      case 'navigation':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-blue-950/80 border border-blue-800 text-blue-300">
            TV Navigation
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-neutral-800 text-neutral-300">
            General
          </span>
        );
    }
  };

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customVoiceInput.trim()) return;
    playRemoteSelect();
    const cmd = customVoiceInput.trim();
    onReplayCommand(cmd);
    setCustomVoiceInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-neutral-950/90 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
              <Mic className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-white">
                  Alexa Voice Command History
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-semibold">
                  Last 10 Transcriptions
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Displays the 10 most recent transcribed Alexa utterances and their executed app state actions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playRemoteClick();
                onClearHistory();
              }}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset history to default log"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Close Voice History modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Voice Command Simulation Input */}
        <div className="px-6 py-3 bg-neutral-950/70 border-b border-neutral-800">
          <form onSubmit={handleTestSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Mic className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customVoiceInput}
                onChange={(e) => setCustomVoiceInput(e.target.value)}
                placeholder='Type or test a voice command (e.g. "Alexa, set workout mode", "Alexa, fan level 3")'
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!customVoiceInput.trim()}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-cyan-900/30 shrink-0"
            >
              <Send className="w-3 h-3 fill-current" />
              <span>Transcribe & Run</span>
            </button>
          </form>

          {/* Prompt chips */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar text-[11px]">
            <span className="text-neutral-500 shrink-0 text-[10px] font-mono uppercase tracking-wider">
              Quick Test:
            </span>
            {[
              'Alexa, set workout mode',
              'Alexa, activate yoga mode',
              'Alexa, play workout mp3',
              'Alexa, set fan to level 3',
              'Alexa, start 25-minute HIIT workout',
              'Alexa, optimal workout climate',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  playRemoteClick();
                  onReplayCommand(chip);
                }}
                className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-cyan-300 font-mono text-[10px] transition-colors whitespace-nowrap cursor-pointer"
              >
                "{chip}"
              </button>
            ))}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-6 py-2.5 bg-neutral-950/40 border-b border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: `All (${recentTen.length})` },
              { id: 'scene', label: 'Scenes' },
              { id: 'workout', label: 'Workouts' },
              { id: 'device', label: 'Devices' },
              { id: 'advisor', label: 'Advisor' },
              { id: 'navigation', label: 'Navigation' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  playRemoteClick();
                  setFilterCategory(tab.id);
                }}
                className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filterCategory === tab.id
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transcript or action..."
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Command List Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-xs">
              No voice commands found matching your criteria.
            </div>
          ) : (
            filteredHistory.map((item, index) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/90 hover:border-neutral-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-mono font-bold text-neutral-400 shrink-0 mt-0.5">
                    #{index + 1}
                  </div>

                  <div>
                    {/* Utterance / Transcript */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm font-mono tracking-tight text-cyan-300">
                        "{item.transcript}"
                      </span>
                      {getCategoryBadge(item.category)}
                    </div>

                    {/* Resulting action */}
                    <div className="mt-1.5 p-2 rounded-lg bg-neutral-900/80 border border-neutral-800/60">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 font-semibold mb-0.5">
                        Resulting Action in App:
                      </div>
                      <p className="text-neutral-200 text-xs leading-relaxed font-sans">
                        {item.resultingAction}
                      </p>
                    </div>

                    {/* Timestamp & Status */}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {item.timestamp}
                      </span>
                      <span aria-hidden="true" className="text-neutral-600">·</span>
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        State Mutated
                      </span>
                    </div>
                  </div>
                </div>

                {/* Replay action button */}
                <button
                  onClick={() => {
                    playRemoteSelect();
                    onReplayCommand(item.transcript);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-cyan-500 hover:text-neutral-950 text-neutral-200 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-center shadow-sm"
                  title="Re-execute this voice command"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Re-execute</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Listening for "Alexa, [command]" or Fire TV Remote Mic</span>
          </div>

          <span className="font-mono text-[11px] text-neutral-400">
            Showing {filteredHistory.length} of {recentTen.length} recent commands
          </span>
        </div>
      </div>
    </div>
  );
};

