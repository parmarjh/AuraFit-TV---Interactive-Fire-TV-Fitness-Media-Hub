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
  Sliders,
  Radio,
  Music,
  Disc,
  Video,
  VideoOff,
  Upload,
  Headphones,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  playCountdownBeep,
  playRemoteClick,
  playRemoteSelect,
  isSoundEnabled,
  toggleSound,
} from '../../utils/soundEffects';
import { WORKOUT_AUDIO_TRACKS, WorkoutAudioTrack } from '../../data/audioTracks';
import { INITIAL_IPTV_CHANNELS } from '../../data/iptvChannels';
import Hls from 'hls.js';

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
  const [pipMode, setPipMode] = useState<'coach' | 'muscles' | 'next' | 'video'>('muscles');
  const [showWidgetsDrawer, setShowWidgetsDrawer] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  // Video & MP3 Audio Soundtrack State
  const defaultVideoUrl =
    workout.videoUrl ||
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>(defaultVideoUrl);
  const [videoMode, setVideoMode] = useState<'backdrop' | 'split' | 'minimal'>('backdrop');
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoOpacity, setVideoOpacity] = useState(0.5);

  // Selected MP3 soundtrack
  const defaultTrack =
    WORKOUT_AUDIO_TRACKS.find((t) =>
      workout.musicGenre.toLowerCase().includes(t.genre.split('/')[0].trim().toLowerCase())
    ) ||
    WORKOUT_AUDIO_TRACKS[0];

  const [activeAudioTrack, setActiveAudioTrack] = useState<WorkoutAudioTrack>({
    ...defaultTrack,
    audioUrl: workout.audioUrl || defaultTrack.audioUrl,
    title: workout.audioTitle || defaultTrack.title,
  });

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [customAudioUrlInput, setCustomAudioUrlInput] = useState('');
  const [customVideoUrlInput, setCustomVideoUrlInput] = useState('');
  const [showAudioTrackSelector, setShowAudioTrackSelector] = useState(false);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  const currentStep = workout.steps[currentStepIndex];
  const nextStep = workout.steps[currentStepIndex + 1];

  // Dynamic heart rate zone
  const getZone = (bpm: number) => {
    if (bpm < 115) return 'Warmup';
    if (bpm < 135) return 'Fat Burn';
    if (bpm < 160) return 'Aerobic';
    return 'Peak';
  };

  const hlsRef = useRef<Hls | null>(null);

  // Load Video source (supports MP4 video clips AND HLS .m3u8 live IPTV streams)
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls =
      activeVideoUrl.includes('.m3u8') ||
      activeVideoUrl.includes('hls') ||
      activeVideoUrl.includes('playlist');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(activeVideoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlaying) video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        }
      });
    } else {
      video.src = activeVideoUrl;
      video.load();
      if (isPlaying) video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeVideoUrl]);

  // Synchronize HTML5 Video and MP3 Audio Playback with workout state
  useEffect(() => {
    if (isPlaying) {
      videoRef.current?.play().catch(() => {});
      if (audioRef.current && !isAudioMuted) {
        audioRef.current.volume = audioVolume;
        audioRef.current.play().catch(() => {});
      }
    } else {
      videoRef.current?.pause();
      audioRef.current?.pause();
    }
  }, [isPlaying, isAudioMuted, activeAudioTrack]);

  // Adjust audio volume dynamically
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isAudioMuted ? 0 : audioVolume;
    }
  }, [audioVolume, isAudioMuted]);

  // Timer interval for exercises & biometrics
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

  const handleSelectAudioTrack = (track: WorkoutAudioTrack) => {
    playRemoteSelect();
    setActiveAudioTrack(track);
    setShowAudioTrackSelector(false);
  };

  // Local MP3 File Upload Handler
  const handleLocalAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playRemoteSelect();
    const objectUrl = URL.createObjectURL(file);
    const customTrack: WorkoutAudioTrack = {
      id: `custom-track-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Custom User MP3',
      genre: 'Personal Soundtrack',
      bpm: 130,
      audioUrl: objectUrl,
      durationFormatted: 'User MP3',
      description: `Uploaded local MP3 audio file: ${file.name}`,
    };

    setActiveAudioTrack(customTrack);
    setIsAudioMuted(false);
    setShowAudioTrackSelector(false);
  };

  // Apply custom MP3 URL
  const handleApplyCustomAudioUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAudioUrlInput.trim()) return;

    playRemoteSelect();
    const customTrack: WorkoutAudioTrack = {
      id: `url-track-${Date.now()}`,
      title: 'Custom MP3 Stream',
      artist: 'Web Audio Feed',
      genre: 'Direct Stream',
      bpm: 132,
      audioUrl: customAudioUrlInput.trim(),
      durationFormatted: 'Stream',
      description: customAudioUrlInput.trim(),
    };

    setActiveAudioTrack(customTrack);
    setIsAudioMuted(false);
    setCustomAudioUrlInput('');
    setShowAudioTrackSelector(false);
  };

  const currentZone = getZone(simulatedBpm);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col overflow-hidden select-none">
      {/* Hidden Native Audio Element for Workout MP3 Soundtrack */}
      <audio
        ref={audioRef}
        src={activeAudioTrack.audioUrl}
        loop
        playsInline
      />

      {/* Hidden Native File Input for Custom MP3 files */}
      <input
        ref={audioFileInputRef}
        type="file"
        accept="audio/mp3,audio/*"
        className="hidden"
        onChange={handleLocalAudioFileUpload}
      />

      {/* 10-ft TV Cinema Stage */}
      <div className="relative flex-1 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex flex-col justify-between p-4 sm:p-6 md:p-8 overflow-hidden">
        {/* Fullscreen Video Backdrop when in 'backdrop' mode */}
        {videoMode === 'backdrop' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <video
              ref={videoRef}
              src={activeVideoUrl}
              loop
              playsInline
              autoPlay
              muted={isVideoMuted}
              className="w-full h-full object-cover transition-opacity duration-700"
              style={{ opacity: videoOpacity }}
            />
            {/* Dark vignette gradient for HUD readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/80" />
          </div>
        )}

        {/* Ambient workout glow synchronized with Living Room Light preset */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] blur-[120px] rounded-full opacity-35 pointer-events-none transition-all duration-700 z-0"
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
        <div className="relative z-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] uppercase tracking-wider font-mono text-amber-500 font-bold">
                  Fire TV Studio Stream
                </span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-[11px] text-neutral-400 font-mono">4K Ultra HD</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-[11px] px-2 py-0.2 rounded font-mono font-bold bg-cyan-950 border border-cyan-800 text-cyan-300">
                  MP3 AUDIO SYNCED
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-bold font-display text-white tracking-tight truncate max-w-md">
                {workout.title}
              </h2>
            </div>
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center gap-2">
            {/* Video Mode Switcher */}
            <div className="hidden sm:flex items-center bg-neutral-900/90 border border-neutral-800 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setVideoMode('backdrop')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  videoMode === 'backdrop'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Cinematic Video Backdrop"
              >
                Backdrop
              </button>
              <button
                onClick={() => setVideoMode('split')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  videoMode === 'split'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Split TV Studio View"
              >
                Split Studio
              </button>
              <button
                onClick={() => setVideoMode('minimal')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  videoMode === 'minimal'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="HUD Minimal (No Video)"
              >
                Minimal
              </button>
            </div>

            {/* Video Mute Toggle */}
            {videoMode !== 'minimal' && (
              <button
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  !isVideoMuted
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={isVideoMuted ? 'Unmute Workout Video Audio' : 'Mute Workout Video Audio'}
              >
                {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-cyan-400" />}
              </button>
            )}

            {/* TV Widgets Drawer toggle */}
            <button
              onClick={() => setShowWidgetsDrawer(!showWidgetsDrawer)}
              className="px-3 py-2 rounded-xl bg-neutral-900/90 border border-neutral-700 hover:border-amber-500 text-neutral-200 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">TV Menu & Audio</span>
            </button>

            {/* Audio beeps sound toggle */}
            <button
              onClick={handleSoundToggle}
              className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle coach countdown beeps"
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            </button>

            {/* Exit Workout button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Exit Workout"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Stage: Exercise Movement Focus & Optional Split Video Studio */}
        <div className="relative z-10 my-auto w-full max-w-6xl mx-auto py-3">
          {videoMode === 'split' ? (
            /* Split Studio Layout: Workout Video on Left, Timer & Form cues on Right */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Dedicated 16:9 Workout Video Box */}
              <div className="lg:col-span-7 bg-neutral-900/90 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={activeVideoUrl}
                  loop
                  playsInline
                  autoPlay
                  muted={isVideoMuted}
                  className="w-full h-full object-cover"
                />

                {/* Video HUD Overlay Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-neutral-700 text-[10px] font-mono font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    LIVE WORKOUT VIDEO
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-neutral-700 text-[10px] font-mono text-cyan-300">
                    MP3 Track Active
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => setIsVideoMuted(!isVideoMuted)}
                    className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-neutral-700 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer hover:bg-neutral-800"
                  >
                    {isVideoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isVideoMuted ? 'Muted' : 'Audio On'}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Timer, Exercise cues, and phase details */}
              <div className="lg:col-span-5 flex flex-col items-center text-center p-4">
                <div className="mb-2">
                  <span
                    className={`text-xs font-mono uppercase tracking-widest font-bold px-3 py-1 rounded-full inline-block ${
                      isResting
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {isResting ? 'Recovery & Hydrate' : `Exercise ${currentStepIndex + 1} of ${workout.steps.length}`}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-black font-display text-white tracking-tight leading-tight">
                  {isResting ? 'Catch Your Breath' : currentStep.name}
                </h1>

                <p className="text-xs md:text-sm text-neutral-300 mt-2 font-medium leading-relaxed max-w-sm">
                  {isResting ? `Up next: ${nextStep?.name || 'Cool Down'}` : currentStep.formCue}
                </p>

                {/* Compact Timer */}
                <div className="my-5 w-36 h-36 rounded-full border-4 border-neutral-800 flex flex-col items-center justify-center bg-neutral-950/90 shadow-2xl relative">
                  <span className="text-5xl font-black font-mono tracking-tighter text-white tabular-nums">
                    {secondsRemaining}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                    Seconds
                  </span>
                </div>

                <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                  Target: {currentStep.targetMuscle}
                </div>
              </div>
            </div>
          ) : (
            /* Backdrop or Minimal View: Centered Kinetic Visualizer */
            <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto w-full">
              {/* Phase Header */}
              <div className="mb-3">
                <span
                  className={`text-xs md:text-sm font-mono uppercase tracking-widest font-bold px-4 py-1.5 rounded-full inline-block ${
                    isResting
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {isResting ? 'Recovery & Hydrate' : `Exercise ${currentStepIndex + 1} of ${workout.steps.length}`}
                </span>
              </div>

              {/* Exercise Title */}
              <h1 className="text-3xl md:text-5xl font-black font-display text-white tracking-tight leading-tight">
                {isResting ? 'Catch Your Breath' : currentStep.name}
              </h1>

              {/* Form Cue */}
              <p className="text-sm md:text-base text-neutral-200 mt-2.5 max-w-2xl font-medium leading-relaxed drop-shadow-md">
                {isResting ? `Up next: ${nextStep?.name || 'Cool Down Stretch'}` : currentStep.formCue}
              </p>

              {/* Big TV Timer Display */}
              <div className="my-6 flex flex-col items-center">
                <div className="w-40 h-40 md:w-52 md:h-52 rounded-full border-4 border-neutral-800/90 flex flex-col items-center justify-center bg-neutral-950/85 backdrop-blur-md shadow-2xl relative">
                  <span className="text-5xl md:text-7xl font-black font-mono tracking-tighter text-white tabular-nums">
                    {secondsRemaining}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono mt-1">
                    Seconds
                  </span>
                </div>

                <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                  Target: {currentStep.targetMuscle}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating MP3 Workout Soundtrack Bar */}
        <div className="relative z-20 max-w-5xl mx-auto w-full mb-3">
          <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl p-3 px-4 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Track Info with animated visualizer bars */}
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <Disc className={`w-5 h-5 ${isPlaying && !isAudioMuted ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-tight truncate max-w-xs">
                    {activeAudioTrack.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-semibold">
                    {activeAudioTrack.bpm} BPM MP3
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                  <span>{activeAudioTrack.artist}</span>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <span className="text-neutral-500">{activeAudioTrack.genre}</span>
                </div>
              </div>
            </div>

            {/* Audio Equalizer Visualizer Bars */}
            <div className="flex items-center gap-1 h-5 px-3 py-1 bg-neutral-950/70 rounded-lg border border-neutral-800/80">
              {[40, 75, 100, 60, 85].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-cyan-400 rounded-full transition-all duration-200"
                  style={{
                    height: isPlaying && !isAudioMuted ? `${Math.max(25, (h * (0.6 + Math.random() * 0.4)))}%` : '20%',
                    opacity: isAudioMuted ? 0.3 : 1,
                  }}
                />
              ))}
              <span className="text-[10px] font-mono text-neutral-400 ml-1.5">MP3 AUDIO</span>
            </div>

            {/* MP3 Audio Controls: Volume, Mute, Track Selection */}
            <div className="flex items-center gap-3 self-end sm:self-center">
              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAudioMuted(!isAudioMuted)}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                  title={isAudioMuted ? 'Unmute MP3 Soundtrack' : 'Mute MP3 Soundtrack'}
                >
                  {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isAudioMuted ? 0 : audioVolume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAudioVolume(val);
                    if (isAudioMuted && val > 0) setIsAudioMuted(false);
                  }}
                  className="w-20 accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                  title={`MP3 Volume: ${Math.round(audioVolume * 100)}%`}
                />
              </div>

              {/* Change Track dropdown button */}
              <button
                onClick={() => setShowAudioTrackSelector(!showAudioTrackSelector)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Change MP3 Soundtrack"
              >
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tracks</span>
              </button>

              {/* Load local MP3 button */}
              <button
                onClick={() => audioFileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Upload local .mp3 audio file"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload MP3</span>
              </button>
            </div>
          </div>

          {/* Expanded Track Selector Popover */}
          {showAudioTrackSelector && (
            <div className="mt-2 p-3 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                  Select Workout MP3 Soundtrack
                </span>
                <button
                  onClick={() => setShowAudioTrackSelector(false)}
                  className="text-neutral-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {WORKOUT_AUDIO_TRACKS.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handleSelectAudioTrack(track)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      activeAudioTrack.id === track.id
                        ? 'bg-cyan-950/80 border-cyan-600 text-white'
                        : 'bg-neutral-950/80 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white">{track.title}</div>
                      <div className="text-[11px] text-neutral-400">{track.artist} · {track.genre}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-cyan-300 shrink-0">
                      {track.bpm} BPM
                    </span>
                  </button>
                ))}
              </div>

              {/* Direct Custom MP3 URL input */}
              <form onSubmit={handleApplyCustomAudioUrl} className="mt-3 pt-2.5 border-t border-neutral-800 flex items-center gap-2">
                <input
                  type="url"
                  value={customAudioUrlInput}
                  onChange={(e) => setCustomAudioUrlInput(e.target.value)}
                  placeholder="Paste direct .mp3 file URL (e.g. https://domain.com/soundtrack.mp3)"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!customAudioUrlInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-neutral-950 font-bold text-xs cursor-pointer shrink-0"
                >
                  Load URL
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Real-time Viewing Widgets: Bottom Biometrics Dock */}
        <div className="relative z-20 grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-5xl mx-auto w-full">
          {/* Widget 1: Heart Rate Monitor (BPM) */}
          <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-3.5 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
                <Heart className="w-5 h-5 animate-heart-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono block">
                  Heart Rate
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-2xl font-black font-mono text-white tabular-nums">
                    {simulatedBpm}
                  </span>
                  <span className="text-xs text-neutral-400">BPM</span>
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                currentZone === 'Peak'
                  ? 'bg-rose-500 text-neutral-950'
                  : currentZone === 'Aerobic'
                  ? 'bg-amber-400 text-neutral-950'
                  : currentZone === 'Fat Burn'
                  ? 'bg-teal-400 text-neutral-950'
                  : 'bg-emerald-500 text-neutral-950'
              }`}
            >
              {currentZone}
            </span>
          </div>

          {/* Widget 2: Calorie Burn Real-Time Ticker */}
          <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-3.5 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono block">
                  Burn Active
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-2xl font-black font-mono text-white tabular-nums">
                    {Math.round(caloriesBurned)}
                  </span>
                  <span className="text-xs text-neutral-400">kcal</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] text-amber-400 font-mono">
              ~{workout.estCalories}
            </span>
          </div>

          {/* Widget 3: Reps & Pace Cadence */}
          <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-3.5 flex items-center justify-between shadow-xl">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono block">
                Cadence & Effort
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl md:text-2xl font-black font-mono text-white tabular-nums">
                  {currentStep.reps ? `${currentStep.reps} Reps` : 'Max Effort'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-400 font-mono font-bold">In Rhythm</span>
              <span className="text-[10px] text-neutral-400 block font-mono">
                {activeAudioTrack.bpm} BPM
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
        <div className="hidden lg:block absolute top-20 right-8 w-64 bg-neutral-900/95 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl z-20">
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
          <div className="absolute inset-y-0 right-0 w-84 bg-neutral-900/98 border-l border-neutral-700 shadow-2xl p-5 z-40 flex flex-col justify-between backdrop-blur-xl overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  Media & Living Room Controls
                </h3>
                <button
                  onClick={() => setShowWidgetsDrawer(false)}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Workout Video Configuration */}
              <div className="mt-4 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-cyan-400" />
                    Workout Video Mode
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-xs mb-3">
                  <button
                    onClick={() => setVideoMode('backdrop')}
                    className={`p-1.5 rounded text-center ${
                      videoMode === 'backdrop'
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    Backdrop
                  </button>
                  <button
                    onClick={() => setVideoMode('split')}
                    className={`p-1.5 rounded text-center ${
                      videoMode === 'split'
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    Split Studio
                  </button>
                  <button
                    onClick={() => setVideoMode('minimal')}
                    className={`p-1.5 rounded text-center ${
                      videoMode === 'minimal'
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    Off
                  </button>
                </div>

                {videoMode === 'backdrop' && (
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Video Dimmer</span>
                      <span>{Math.round(videoOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={videoOpacity}
                      onChange={(e) => setVideoOpacity(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Live IPTV Channel Stream Selector (M3U / iptv-org) */}
              <div className="mt-4 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    Live IPTV Stream (M3U)
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">iptv-org</span>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      playRemoteSelect();
                      setActiveVideoUrl(workout.videoUrl || defaultVideoUrl);
                    }}
                    className={`w-full p-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between ${
                      activeVideoUrl === (workout.videoUrl || defaultVideoUrl)
                        ? 'bg-amber-950 border border-amber-600 text-white font-bold'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>Default Studio Workout Video</span>
                    <span className="text-[10px] font-mono text-amber-400">MP4</span>
                  </button>

                  {INITIAL_IPTV_CHANNELS.slice(0, 4).map((chan) => (
                    <button
                      key={chan.id}
                      onClick={() => {
                        playRemoteSelect();
                        setActiveVideoUrl(chan.streamUrl);
                      }}
                      className={`w-full p-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between ${
                        activeVideoUrl === chan.streamUrl
                          ? 'bg-rose-950/80 border border-rose-600 text-white font-bold'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="font-semibold text-white truncate">{chan.name}</div>
                        <div className="text-[10px] text-neutral-500">{chan.group}</div>
                      </div>
                      <span className="text-[10px] font-mono text-rose-400 font-bold shrink-0">
                        LIVE
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* MP3 Audio Soundtrack Manager */}
              <div className="mt-4 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-cyan-400" />
                    MP3 Audio Soundtrack
                  </span>
                  <button
                    onClick={() => audioFileInputRef.current?.click()}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload .mp3</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {WORKOUT_AUDIO_TRACKS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectAudioTrack(t)}
                      className={`w-full p-2 rounded-lg text-left flex items-center justify-between text-xs transition-colors ${
                        activeAudioTrack.id === t.id
                          ? 'bg-cyan-950 border border-cyan-700 text-white'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="font-semibold text-white truncate">{t.title}</div>
                        <div className="text-[10px] text-neutral-500">{t.genre}</div>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 shrink-0">
                        {t.bpm} BPM
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Smart Scene Switcher in Drawer */}
              {scenes.length > 0 && onApplyScene && (
                <div className="mt-4 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
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
              <div className="mt-4 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
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
            </div>

            <button
              onClick={() => {
                onClose();
                onCompleteWorkout(workout, Math.round(caloriesBurned));
              }}
              className="w-full mt-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete & Finish Session</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
