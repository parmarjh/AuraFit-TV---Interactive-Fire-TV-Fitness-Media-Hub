import React, { useState, useEffect } from 'react';
import {
  Mic,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Home,
  Menu,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../utils/soundEffects';

interface FireTvRemoteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onSelect: () => void;
  onBack: () => void;
  onHome: () => void;
  onMenu: () => void;
  onPlayPauseToggle: () => void;
  isPlaying?: boolean;
  onVoiceCommand: (query: string) => void;
  onOpenVoiceHistory?: () => void;
}

export const FireTvRemote: React.FC<FireTvRemoteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelect,
  onBack,
  onHome,
  onMenu,
  onPlayPauseToggle,
  isPlaying = false,
  onVoiceCommand,
  onOpenVoiceHistory,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  // Keyboard navigation listener (Arrow keys, Enter, Backspace, Space, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        playRemoteClick();
        onNavigate('up');
        setLastAction('UP');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        playRemoteClick();
        onNavigate('down');
        setLastAction('DOWN');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        playRemoteClick();
        onNavigate('left');
        setLastAction('LEFT');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        playRemoteClick();
        onNavigate('right');
        setLastAction('RIGHT');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        playRemoteSelect();
        onSelect();
        setLastAction('SELECT');
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        playRemoteClick();
        onBack();
        setLastAction('BACK');
      } else if (e.key === ' ') {
        e.preventDefault();
        playRemoteClick();
        onPlayPauseToggle();
        setLastAction('PLAY/PAUSE');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate, onSelect, onBack, onPlayPauseToggle]);

  // Voice command simulation or Web Speech API
  const handleMicClick = () => {
    playRemoteClick();
    setIsListening(true);
    setVoiceQuery('Listening for Alexa command...');

    // If browser supports webkitSpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setVoiceQuery(`"${transcript}"`);
          setIsListening(false);
          onVoiceCommand(transcript);
        };

        recognition.onerror = () => {
          simulateRandomVoiceCommand();
        };

        recognition.start();
        return;
      } catch {
        simulateRandomVoiceCommand();
      }
    } else {
      simulateRandomVoiceCommand();
    }
  };

  const simulateRandomVoiceCommand = () => {
    const samples = [
      'Start 25-minute HIIT workout',
      'Turn living room workout fan to level 3',
      'Show my daily schedule',
      'Dim ambient lights to cardio crimson',
      'What is my current heart rate?',
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];

    setTimeout(() => {
      setVoiceQuery(`"${picked}"`);
      setIsListening(false);
      onVoiceCommand(picked);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isMinimized ? 'w-48' : 'w-72'
      }`}
    >
      <div className="bg-neutral-900/95 border border-neutral-700/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden text-neutral-200">
        {/* Remote Header */}
        <div className="px-4 py-2.5 bg-neutral-950/70 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide text-neutral-300">
              Fire TV Remote
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Close Remote"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Minimized View */}
        {isMinimized ? (
          <div className="p-3 flex items-center justify-between text-xs">
            <span className="text-neutral-400">D-Pad Active</span>
            <button
              onClick={onSelect}
              className="px-2.5 py-1 bg-amber-500 text-neutral-950 font-bold rounded"
            >
              OK
            </button>
          </div>
        ) : (
          <div className="p-4 flex flex-col items-center select-none">
            {/* Alexa Voice Microphone Button */}
            <div className="w-full flex flex-col items-center mb-3">
              <button
                onClick={handleMicClick}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50 scale-105 animate-pulse'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-cyan-500/40 hover:border-cyan-400'
                }`}
                title="Press & Speak to Alexa"
              >
                <Mic className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Alexa Voice Assistant
                </span>
                {onOpenVoiceHistory && (
                  <button
                    onClick={() => {
                      playRemoteClick();
                      onOpenVoiceHistory();
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
                  >
                    History (10)
                  </button>
                )}
              </div>
              {voiceQuery && (
                <div className="mt-1.5 text-center text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 rounded px-2 py-0.5 max-w-full truncate">
                  {voiceQuery}
                </div>
              )}
            </div>

            {/* Circular D-Pad */}
            <div className="relative w-44 h-44 rounded-full bg-neutral-950 border border-neutral-800 p-2 shadow-inner flex items-center justify-center my-1">
              {/* Up */}
              <button
                onClick={() => {
                  playRemoteClick();
                  onNavigate('up');
                  setLastAction('UP');
                }}
                className="absolute top-1 left-1/2 -translate-x-1/2 w-14 h-9 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-t-full transition-all active:scale-95"
                title="Up (Arrow Up)"
              >
                <ChevronUp className="w-6 h-6" />
              </button>

              {/* Down */}
              <button
                onClick={() => {
                  playRemoteClick();
                  onNavigate('down');
                  setLastAction('DOWN');
                }}
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-14 h-9 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-b-full transition-all active:scale-95"
                title="Down (Arrow Down)"
              >
                <ChevronDown className="w-6 h-6" />
              </button>

              {/* Left */}
              <button
                onClick={() => {
                  playRemoteClick();
                  onNavigate('left');
                  setLastAction('LEFT');
                }}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-14 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-l-full transition-all active:scale-95"
                title="Left (Arrow Left)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Right */}
              <button
                onClick={() => {
                  playRemoteClick();
                  onNavigate('right');
                  setLastAction('RIGHT');
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-14 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-r-full transition-all active:scale-95"
                title="Right (Arrow Right)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Center OK / Select Button */}
              <button
                onClick={() => {
                  playRemoteSelect();
                  onSelect();
                  setLastAction('SELECT');
                }}
                className="w-18 h-18 rounded-full bg-neutral-800 hover:bg-neutral-700 active:bg-amber-500 active:text-neutral-950 border border-neutral-700 flex flex-col items-center justify-center text-xs font-bold text-neutral-200 shadow-md transition-all active:scale-90"
                title="Select (Enter)"
              >
                <span>OK</span>
              </button>
            </div>

            {/* Fire TV Navigation Row: Back, Home, Menu */}
            <div className="w-full grid grid-cols-3 gap-2 mt-4">
              <button
                onClick={() => {
                  playRemoteClick();
                  onBack();
                  setLastAction('BACK');
                }}
                className="py-2.5 flex flex-col items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg border border-neutral-800/80 transition-colors"
                title="Back (Esc / Backspace)"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-[10px] mt-0.5">Back</span>
              </button>

              <button
                onClick={() => {
                  playRemoteClick();
                  onHome();
                  setLastAction('HOME');
                }}
                className="py-2.5 flex flex-col items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg border border-neutral-800/80 transition-colors"
                title="Home"
              >
                <Home className="w-4 h-4" />
                <span className="text-[10px] mt-0.5">Home</span>
              </button>

              <button
                onClick={() => {
                  playRemoteClick();
                  onMenu();
                  setLastAction('MENU');
                }}
                className="py-2.5 flex flex-col items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg border border-neutral-800/80 transition-colors"
                title="Menu (Widgets Drawer)"
              >
                <Menu className="w-4 h-4" />
                <span className="text-[10px] mt-0.5">Widgets</span>
              </button>
            </div>

            {/* Media Row: Play/Pause, Mute */}
            <div className="w-full grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => {
                  playRemoteClick();
                  onPlayPauseToggle();
                  setLastAction('PLAY/PAUSE');
                }}
                className={`py-2 flex items-center justify-center gap-1.5 rounded-lg border transition-colors ${
                  isPlaying
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                }`}
                title="Play/Pause (Space)"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="text-xs font-medium">{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={() => {
                  playRemoteClick();
                  setLastAction('VOLUME');
                }}
                className="py-2 flex items-center justify-center gap-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 transition-colors"
                title="Mute / Volume"
              >
                <Volume2 className="w-4 h-4" />
                <span className="text-xs font-medium">Vol</span>
              </button>
            </div>

            {/* Keyboard shortcut hint */}
            <div className="w-full mt-3 pt-2.5 border-t border-neutral-800/80 text-[10px] text-neutral-400 flex items-center justify-between">
              <span>Keyboard: Arrows, Enter, Esc, Space</span>
              {lastAction && (
                <span className="text-amber-400 font-mono font-medium">[{lastAction}]</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
