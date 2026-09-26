import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { IptvChannel, VoiceLanguage } from '../../types';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Tv,
  Radio,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Languages,
  CheckCircle2,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';
import { speakVoiceResponse, tryVoiceSample, VOICE_TRY_SAMPLES } from '../../utils/voiceAssistant';

interface IptvLivePlayerProps {
  channel: IptvChannel | null;
  onClose?: () => void;
  isPip?: boolean;
  onTogglePip?: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  onUpdateChannel?: () => void;
  refreshKey?: number;
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
  workoutModeOverlay?: boolean;
  voiceLang?: VoiceLanguage;
  onVoiceLangChange?: (lang: VoiceLanguage) => void;
}

export const IptvLivePlayer: React.FC<IptvLivePlayerProps> = ({
  channel,
  onClose,
  isPip = false,
  onTogglePip,
  onNextChannel,
  onPrevChannel,
  onUpdateChannel,
  refreshKey = 0,
  autoPlay = true,
  showControls = true,
  className = '',
  workoutModeOverlay = false,
  voiceLang = 'en',
  onVoiceLangChange,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHud, setShowHud] = useState(true);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<'Hindi' | 'Gujarati' | 'English'>(() => {
    if (voiceLang === 'gu') return 'Gujarati';
    if (voiceLang === 'hi') return 'Hindi';
    return 'Hindi';
  });
  const [trackNotification, setTrackNotification] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync when voiceLang changes externally
  useEffect(() => {
    if (voiceLang === 'gu') setSelectedAudioTrack('Gujarati');
    else if (voiceLang === 'hi') setSelectedAudioTrack('Hindi');
    else if (voiceLang === 'en') setSelectedAudioTrack('English');
  }, [voiceLang]);

  const handleAudioTrackSelect = (aLang: 'Hindi' | 'Gujarati' | 'English') => {
    playRemoteSelect();
    setSelectedAudioTrack(aLang);

    const langCode: VoiceLanguage = aLang === 'Gujarati' ? 'gu' : aLang === 'Hindi' ? 'hi' : 'en';
    if (onVoiceLangChange) {
      onVoiceLangChange(langCode);
    }

    const spokenText =
      aLang === 'Gujarati'
        ? 'ઝી સિનેમા એચડી: ગુજરાતી અવાજ સક્રિય છે'
        : aLang === 'Hindi'
        ? 'ज़ी सिनेमा एचडी: हिन्दी आवाज सक्रिय है'
        : 'Zee Cinema HD: English audio track active';

    speakVoiceResponse(spokenText, langCode);
    setTrackNotification(`${aLang} Audio Track Active · Voice Changed`);
    setTimeout(() => setTrackNotification(null), 3500);
  };

  const handleTryVoice = (langCode: VoiceLanguage) => {
    playRemoteSelect();
    const trackName = langCode === 'gu' ? 'Gujarati' : langCode === 'hi' ? 'Hindi' : 'English';
    setSelectedAudioTrack(trackName);
    if (onVoiceLangChange) {
      onVoiceLangChange(langCode);
    }
    const sample = tryVoiceSample(langCode);
    setTrackNotification(`🔊 Trying ${trackName} Voice: "${sample.phrase.slice(0, 36)}..."`);
    setTimeout(() => setTrackNotification(null), 4000);
  };

  // Initialize and load HLS or standard stream
  useEffect(() => {
    if (!channel || !videoRef.current) return;

    setErrorMsg(null);
    setIsLoading(true);

    const video = videoRef.current;
    const streamUrl = channel.streamUrl;

    // Destroy existing Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHlsStream =
      streamUrl.includes('.m3u8') ||
      streamUrl.includes('hls') ||
      streamUrl.includes('playlist');

    if (isHlsStream && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().then(() => setIsPlaying(true)).catch((err) => {
            console.warn('AutoPlay prevented, attempting muted play:', err);
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.warn('HLS fatal error:', data.type);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMsg('Stream connection interrupted or geo-restricted. Retrying...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setErrorMsg('Media decoding error. Recovering stream...');
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setErrorMsg('Live IPTV broadcast temporarily offline.');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isHlsStream) {
      // Native Safari HLS or direct MP4/stream URL
      video.src = streamUrl;
      video.load();
      video.onloadedmetadata = () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().then(() => setIsPlaying(true)).catch(() => {
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          });
        }
      };
      video.onerror = () => {
        setIsLoading(false);
        setErrorMsg('Unable to play live stream. The remote feed may be geo-restricted or offline.');
      };
    } else {
      setErrorMsg('HLS playback is not supported in this browser.');
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, autoPlay, refreshKey]);

  const toggleMute = () => {
    playRemoteClick();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const toggleFullscreen = () => {
    playRemoteClick();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleRetry = () => {
    playRemoteSelect();
    setErrorMsg(null);
    setIsLoading(true);
    if (hlsRef.current && channel) {
      hlsRef.current.loadSource(channel.streamUrl);
      hlsRef.current.startLoad();
    } else if (videoRef.current && channel) {
      videoRef.current.src = channel.streamUrl;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  if (!channel) {
    return (
      <div className={`aspect-video bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <Tv className="w-12 h-12 text-neutral-600 mb-3" />
        <h4 className="text-white font-bold font-display text-base">No Channel Selected</h4>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm">
          Select a channel from the IPTV guide or load an M3U playlist from iptv-org.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowHud(true)}
      onMouseLeave={() => setShowHud(false)}
      className={`relative bg-neutral-950 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 group select-none ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        className="w-full h-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <div className="text-center">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block">
              Tuning IPTV Stream
            </span>
            <span className="text-sm font-semibold text-white mt-1 block truncate max-w-xs">
              {channel.name}
            </span>
          </div>
        </div>
      )}

      {/* Error Fallback HUD */}
      {errorMsg && (
        <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white font-display">Live Broadcast Stream Notice</h4>
          <p className="text-xs text-neutral-400 mt-1.5 max-w-md leading-relaxed">{errorMsg}</p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Stream</span>
            </button>
            {onNextChannel && (
              <button
                onClick={onNextChannel}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Channel</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Toast Overlay for Audio Track / Voice Change Notification */}
      {trackNotification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-amber-500/80 text-amber-300 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>{trackNotification}</span>
        </div>
      )}

      {/* Top Channel Info HUD */}
      {showControls && (
        <div
          className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-neutral-950/90 via-neutral-950/60 to-transparent flex items-center justify-between z-10 transition-opacity duration-300 ${
            showHud || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-3">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-8 h-8 rounded-lg object-contain bg-neutral-900 border border-neutral-800 p-0.5"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-500">
                <Tv className="w-4 h-4" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-[10px] font-mono font-bold text-rose-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  LIVE IPTV
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-800 text-neutral-300">
                  {channel.group || 'IPTV Stream'}
                </span>
                {channel.resolution && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900/90 border border-neutral-800 text-cyan-400">
                    {channel.resolution}
                  </span>
                )}
              </div>
              <h3 className="text-sm md:text-base font-bold font-display text-white mt-0.5 truncate max-w-md drop-shadow-md">
                {channel.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ZEE5 Direct Stream Link if available */}
            {channel.externalUrl && (
              <a
                href={channel.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/80 text-purple-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                title="Watch official high-definition broadcast on ZEE5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Watch on ZEE5</span>
              </a>
            )}

            {/* Update / Refresh Channel Stream */}
            <button
              onClick={() => {
                if (onUpdateChannel) {
                  onUpdateChannel();
                } else {
                  handleRetry();
                }
              }}
              className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Update Channel & Refresh Stream"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Update Channel</span>
            </button>

            {/* Quick Next/Prev for TV channel flipping */}
            {onPrevChannel && (
              <button
                onClick={onPrevChannel}
                className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 text-white cursor-pointer"
                title="Previous Channel (CH-)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {onNextChannel && (
              <button
                onClick={onNextChannel}
                className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 text-white cursor-pointer"
                title="Next Channel (CH+)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Floating Bar */}
      {showControls && (
        <div
          className={`absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-neutral-950/95 via-neutral-950/70 to-transparent flex items-center justify-between z-10 transition-opacity duration-300 ${
            showHud || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                isMuted
                  ? 'bg-rose-950/70 border-rose-800 text-rose-300'
                  : 'bg-neutral-900/90 border-neutral-700 text-neutral-200 hover:text-white'
              }`}
              title={isMuted ? 'Unmute Live Audio' : 'Mute Live Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio Live'}</span>
            </button>

            {/* Audio Track & Voice Switcher (Hindi, Gujarati, English) */}
            <div className="flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-700/80 rounded-xl px-2 py-1 text-[10px]">
              <Languages className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="text-neutral-400 font-mono text-[9px] hidden sm:inline">Voice & Audio:</span>
              {(['Hindi', 'Gujarati', 'English'] as const).map((aLang) => {
                const isSelected = selectedAudioTrack === aLang;
                return (
                  <button
                    key={aLang}
                    onClick={() => handleAudioTrackSelect(aLang)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 shadow-sm'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    }`}
                    title={`Switch broadcast voice & audio to ${aLang}`}
                  >
                    {aLang === 'Hindi' ? 'हिन्दी' : aLang === 'Gujarati' ? 'ગુજરાતી' : 'English'}
                  </button>
                );
              })}

              <div className="h-3 w-px bg-neutral-700 mx-0.5 hidden sm:block" />

              {/* Try Voice Buttons */}
              <div className="hidden sm:flex items-center gap-1">
                {(['gu', 'hi', 'en'] as VoiceLanguage[]).map((vCode) => (
                  <button
                    key={vCode}
                    onClick={() => handleTryVoice(vCode)}
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-950 hover:bg-neutral-800 text-cyan-300 border border-neutral-800 cursor-pointer transition-colors"
                    title={`Try ${vCode === 'gu' ? 'Gujarati' : vCode === 'hi' ? 'Hindi' : 'English'} voice playback`}
                  >
                    🔊 Try {vCode === 'gu' ? 'ગુજ' : vCode === 'hi' ? 'हिन्द' : 'EN'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onTogglePip && (
              <button
                onClick={onTogglePip}
                className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white cursor-pointer"
                title="Toggle Picture-in-Picture"
              >
                <Radio className="w-4 h-4 text-amber-400" />
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
