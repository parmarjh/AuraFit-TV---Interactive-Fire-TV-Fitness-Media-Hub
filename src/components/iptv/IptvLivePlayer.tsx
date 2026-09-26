import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { IptvChannel, VoiceLanguage, ZeeShow } from '../../types';
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
  Play,
  Film,
  Calendar,
  Clock,
  Info,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';
import { speakVoiceResponse, tryVoiceSample } from '../../utils/voiceAssistant';

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
  const [showShowsDrawer, setShowShowsDrawer] = useState(false);
  const [streamCandidateIndex, setStreamCandidateIndex] = useState(0);
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

  // Reset candidate index when channel or external refreshKey changes
  useEffect(() => {
    setStreamCandidateIndex(0);
    setErrorMsg(null);
  }, [channel?.id, refreshKey]);

  // Candidates list
  const streamCandidates = React.useMemo(() => {
    if (!channel) return [];
    const list = [channel.streamUrl];
    if (channel.backupStreamUrls && channel.backupStreamUrls.length > 0) {
      for (const b of channel.backupStreamUrls) {
        if (!list.includes(b)) list.push(b);
      }
    }
    return list;
  }, [channel]);

  const activeStreamUrl = streamCandidates[streamCandidateIndex] || channel?.streamUrl || '';

  const handleAudioTrackSelect = (aLang: 'Hindi' | 'Gujarati' | 'English') => {
    playRemoteSelect();
    setSelectedAudioTrack(aLang);

    const langCode: VoiceLanguage = aLang === 'Gujarati' ? 'gu' : aLang === 'Hindi' ? 'hi' : 'en';
    if (onVoiceLangChange) {
      onVoiceLangChange(langCode);
    }

    const channelName = channel?.name || 'Live Channel';
    const spokenText =
      aLang === 'Gujarati'
        ? `${channelName}: ગુજરાતી અવાજ સક્રિય છે`
        : aLang === 'Hindi'
        ? `${channelName}: हिन्दी आवाज सक्रिय है`
        : `${channelName}: English audio track active`;

    speakVoiceResponse(spokenText, langCode);
    setTrackNotification(`${aLang} Audio Track Active · Voice Tuned`);
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

  // Switch to next backup stream candidate if available
  const tryNextStreamCandidate = () => {
    if (streamCandidateIndex + 1 < streamCandidates.length) {
      const nextIdx = streamCandidateIndex + 1;
      setStreamCandidateIndex(nextIdx);
      setErrorMsg(null);
      setIsLoading(true);
      setTrackNotification(`Connecting to backup stream mirror ${nextIdx + 1}/${streamCandidates.length}...`);
      setTimeout(() => setTrackNotification(null), 3000);
    } else {
      setIsLoading(false);
      setErrorMsg(
        channel?.isZeeNetwork
          ? 'Live stream connection unavailable in this browser. You can click "Watch on ZEE5" to enjoy official full HD broadcast directly on ZEE5.'
          : 'Live IPTV broadcast temporarily offline or geo-restricted.'
      );
    }
  };

  // Initialize and load HLS or standard stream
  useEffect(() => {
    if (!channel || !videoRef.current || !activeStreamUrl) return;

    setErrorMsg(null);
    setIsLoading(true);

    const video = videoRef.current;
    const streamUrl = activeStreamUrl;

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
          console.warn('HLS fatal error:', data.type, 'trying fallback candidate...');
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              tryNextStreamCandidate();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              tryNextStreamCandidate();
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
        tryNextStreamCandidate();
      };
    } else {
      tryNextStreamCandidate();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel?.id, activeStreamUrl, autoPlay, refreshKey]);

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
    setStreamCandidateIndex(0);
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
          Select a channel from the ZEE5 or IPTV guide to begin streaming live.
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
              Tuning {channel.isZeeNetwork ? 'ZEE5 Broadcast' : 'Live Stream'}
            </span>
            <span className="text-sm font-semibold text-white mt-1 block truncate max-w-xs">
              {channel.name}
            </span>
            {streamCandidateIndex > 0 && (
              <span className="text-[11px] text-cyan-300 font-mono mt-1 block">
                Mirror Feed #{streamCandidateIndex + 1}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error Fallback HUD */}
      {errorMsg && (
        <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white font-display">
            {channel.isZeeNetwork ? 'ZEE5 Live Broadcast Notice' : 'Stream Notice'}
          </h4>
          <p className="text-xs text-neutral-300 mt-1.5 max-w-md leading-relaxed">{errorMsg}</p>

          <div className="flex items-center gap-3 mt-4 flex-wrap justify-center">
            {channel.externalUrl && (
              <a
                href={channel.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-purple-600/30"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Watch on ZEE5 Official</span>
              </a>
            )}

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
          className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-neutral-950/95 via-neutral-950/70 to-transparent flex items-start justify-between z-10 transition-opacity duration-300 ${
            showHud || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-start gap-3">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-10 h-10 rounded-xl object-contain bg-neutral-900 border border-neutral-800 p-0.5 shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-500">
                <Tv className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {channel.isZeeNetwork ? (
                  <span className="px-2 py-0.5 rounded bg-purple-950/90 border border-purple-700 text-[10px] font-mono font-bold text-purple-300 flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                    ZEE5 LIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-[10px] font-mono font-bold text-rose-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    LIVE IPTV
                  </span>
                )}

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-800 text-neutral-300">
                  {channel.group || 'IPTV Stream'}
                </span>

                {channel.resolution && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900/90 border border-neutral-800 text-cyan-400 font-semibold">
                    {channel.resolution}
                  </span>
                )}

                {streamCandidateIndex > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-800 text-emerald-300 font-bold">
                    Backup Feed #{streamCandidateIndex + 1} Active
                  </span>
                )}
              </div>

              <h3 className="text-sm md:text-base font-bold font-display text-white mt-1 truncate max-w-md drop-shadow-md">
                {channel.name}
              </h3>

              {/* Current show EPG banner */}
              {channel.currentShow && (
                <div className="flex items-center gap-1.5 text-xs text-amber-300/90 mt-0.5 font-medium">
                  <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold text-white/90">Now:</span>
                  <span className="truncate max-w-xs">{channel.currentShow}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* ZEE5 Direct Stream Link */}
            {channel.externalUrl && (
              <a
                href={channel.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 border border-purple-400/30 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02]"
                title="Watch official high-definition broadcast on ZEE5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Watch on ZEE5</span>
              </a>
            )}

            {/* Channel Shows Drawer Toggle */}
            {channel.shows && channel.shows.length > 0 && (
              <button
                onClick={() => {
                  playRemoteClick();
                  setShowShowsDrawer((prev) => !prev);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  showShowsDrawer
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold shadow-md'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-700 text-neutral-200'
                }`}
                title="View popular shows on this channel"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Shows ({channel.shows.length})</span>
              </button>
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
              <span className="hidden md:inline">Refresh</span>
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

      {/* Shows Drawer Overlay */}
      {showShowsDrawer && channel.shows && channel.shows.length > 0 && (
        <div className="absolute inset-x-0 bottom-16 top-16 bg-neutral-950/95 backdrop-blur-md z-30 p-4 border-y border-neutral-800 overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" />
              <h4 className="text-white font-bold font-display text-sm">
                Shows on {channel.name}
              </h4>
            </div>
            <button
              onClick={() => setShowShowsDrawer(false)}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-800 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {channel.shows.map((show) => (
              <div
                key={show.id}
                className="bg-neutral-900/90 border border-neutral-800 hover:border-purple-500 rounded-xl p-3 flex gap-3 transition-colors group/show"
              >
                <img
                  src={show.thumbnail}
                  alt={show.title}
                  className="w-20 h-14 object-cover rounded-lg bg-neutral-950 border border-neutral-800 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono text-purple-400 font-semibold truncate">
                      {show.timeSlot || show.genre}
                    </span>
                    {show.zee5Url && (
                      <a
                        href={show.zee5Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-purple-300 hover:text-purple-200 underline font-bold"
                      >
                        ZEE5
                      </a>
                    )}
                  </div>
                  <h5 className="text-xs font-bold text-white group-hover/show:text-purple-300 transition-colors truncate">
                    {show.title}
                  </h5>
                  <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                    {show.description}
                  </p>
                </div>
              </div>
            ))}
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
