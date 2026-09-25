import React from 'react';
import { Tv, Cloud, FileText, Volume2, VolumeX, Zap, Mic } from 'lucide-react';
import { isSoundEnabled, toggleSound, playRemoteClick } from '../utils/soundEffects';

interface TopNavigationProps {
  activeTab: 'dashboard' | 'workouts' | 'smarthome' | 'automate' | 'schedule' | 'aws';
  onSelectTab: (tab: 'dashboard' | 'workouts' | 'smarthome' | 'automate' | 'schedule' | 'aws') => void;
  showRemote: boolean;
  onToggleRemote: () => void;
  onOpenProposal: () => void;
  onOpenVoiceHistory?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  onSelectTab,
  showRemote,
  onToggleRemote,
  onOpenProposal,
  onOpenVoiceHistory,
}) => {
  const [soundOn, setSoundOn] = React.useState(isSoundEnabled());

  const handleSoundToggle = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  const handleTabClick = (tab: 'dashboard' | 'workouts' | 'smarthome' | 'automate' | 'schedule' | 'aws') => {
    playRemoteClick();
    onSelectTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 px-6 py-3.5 flex items-center justify-between">
      {/* Zone 1: Single-element brand wordmark */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-950/40">
          <Tv className="w-4.5 h-4.5 text-neutral-950 stroke-[2.5]" />
        </div>
        <button
          onClick={() => handleTabClick('dashboard')}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <span className="text-lg font-bold font-display tracking-tight text-white group-hover:text-amber-400 transition-colors">
            AuraFit <span className="text-amber-500">TV</span>
          </span>
        </button>
      </div>

      {/* Zone 2: Clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
        <button
          onClick={() => handleTabClick('dashboard')}
          className={`transition-colors relative py-1 focus:outline-none cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500'
              : 'hover:text-neutral-200'
          }`}
        >
          TV Dashboard
        </button>

        <button
          onClick={() => handleTabClick('workouts')}
          className={`transition-colors relative py-1 focus:outline-none cursor-pointer ${
            activeTab === 'workouts'
              ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500'
              : 'hover:text-neutral-200'
          }`}
        >
          Workouts
        </button>

        <button
          onClick={() => handleTabClick('automate')}
          className={`transition-colors relative py-1 focus:outline-none cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'automate'
              ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500'
              : 'hover:text-neutral-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
          <span>Smart Automate</span>
        </button>

        <button
          onClick={() => handleTabClick('smarthome')}
          className={`transition-colors relative py-1 focus:outline-none cursor-pointer ${
            activeTab === 'smarthome'
              ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500'
              : 'hover:text-neutral-200'
          }`}
        >
          Living Room
        </button>

        <button
          onClick={() => handleTabClick('schedule')}
          className={`transition-colors relative py-1 focus:outline-none cursor-pointer ${
            activeTab === 'schedule'
              ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500'
              : 'hover:text-neutral-200'
          }`}
        >
          Schedule
        </button>

        <button
          onClick={() => handleTabClick('aws')}
          className={`transition-colors relative py-1 focus:outline-none cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'aws'
              ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500'
              : 'hover:text-neutral-200'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-amber-500" />
          <span>AWS Architecture</span>
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSoundToggle}
          title={soundOn ? 'Mute TV UI audio' : 'Enable TV UI audio'}
          className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 rounded-md transition-colors cursor-pointer"
          aria-label="Toggle audio effects"
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-600" />}
        </button>

        {onOpenVoiceHistory && (
          <button
            onClick={() => {
              playRemoteClick();
              onOpenVoiceHistory();
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            title="View last 10 transcribed Alexa commands"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            <span>Voice History</span>
          </button>
        )}

        <button
          onClick={onToggleRemote}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            showRemote
              ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
              : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Fire TV Remote</span>
        </button>

        <button
          onClick={onOpenProposal}
          className="px-3.5 py-1.5 text-xs font-semibold text-neutral-900 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] rounded-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-amber-500/20"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>AWS Grant Proposal</span>
        </button>
      </div>
    </header>
  );
};
