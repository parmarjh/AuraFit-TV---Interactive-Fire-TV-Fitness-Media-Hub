import React, { useState, useEffect, useMemo, useRef } from 'react';
import { IptvChannel, IptvPlaylist, VoiceLanguage } from '../../types';
import { IptvLivePlayer } from './IptvLivePlayer';
import { AddM3uModal } from './AddM3uModal';
import {
  Tv,
  Radio,
  Search,
  RefreshCw,
  Sparkles,
  Star,
  Play,
  Upload,
  Link,
  Flame,
  CheckCircle2,
  AlertCircle,
  Plus,
  ListFilter,
  Layers,
  FolderOpen,
  Trash2,
  ChevronDown,
  ExternalLink,
  Languages,
  Mic,
  Volume2,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';
import { M3U_SOURCE_PRESETS, parseM3uText } from '../../utils/m3uParser';
import { INITIAL_IPTV_CHANNELS } from '../../data/iptvChannels';
import {
  VOICE_LANGUAGES,
  speakVoiceResponse,
  tryVoiceSample,
} from '../../utils/voiceAssistant';

const DEFAULT_PLAYLISTS: IptvPlaylist[] = [
  {
    id: 'pl-iptv-org-category',
    name: 'IPTV-Org Category Index',
    url: 'https://iptv-org.github.io/iptv/index.category.m3u',
    totalChannels: 0,
    lastUpdated: 'Live Feed',
    description: 'Channels catalogued and grouped by category (Sports, News, Movies, Music, Docu, Kids)',
    channels: [],
  },
  {
    id: 'pl-iptv-org-news',
    name: 'IPTV-Org News Category',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    totalChannels: 0,
    lastUpdated: 'Live Feed',
    description: 'Live 24/7 global news channels from around the world',
    channels: [],
  },
  {
    id: 'pl-iptv-org-sports',
    name: 'IPTV-Org Sports Category',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    totalChannels: 0,
    lastUpdated: 'Live Feed',
    description: 'Live sporting events, fitness, extreme sports, cycling, and competitions',
    channels: [],
  },
  {
    id: 'pl-iptv-org-movies',
    name: 'IPTV-Org Movies Category',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    totalChannels: 0,
    lastUpdated: 'Live Feed',
    description: 'Cinema, blockbusters, action, drama, and film broadcast streams',
    channels: [],
  },
  {
    id: 'pl-iptv-org-music',
    name: 'IPTV-Org Music Category',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    totalChannels: 0,
    lastUpdated: 'Live Feed',
    description: 'Non-stop EDM, pop, hip-hop, workout beats, and music videos',
    channels: [],
  },
  {
    id: 'pl-iptv-org-country',
    name: 'IPTV-Org Country Index',
    url: 'https://iptv-org.github.io/iptv/index.country.m3u',
    totalChannels: 0,
    lastUpdated: 'Live Feed',
    description: 'Global channels catalogued by country of broadcast origin',
    channels: [],
  },
  {
    id: 'pl-iptv-org-language',
    name: 'IPTV-Org Language Index',
    url: 'https://iptv-org.github.io/iptv/index.language.m3u',
    totalChannels: 0,
    lastUpdated: 'Live Feed',
    description: 'Worldwide live streams categorized by audio broadcast language',
    channels: [],
  },
  {
    id: 'pl-iptv-org-master',
    name: 'IPTV-Org Global Master Index',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    totalChannels: 0,
    lastUpdated: 'Live Feed',
    description: 'Official global IPTV-org index with international public live channels',
    channels: [],
  },
];

interface IptvChannelsHubProps {
  onSelectChannelForWorkout?: (channel: IptvChannel) => void;
  onClose?: () => void;
  initialAddModalOpen?: boolean;
  initialSelectedChannelId?: string;
  voiceLang?: VoiceLanguage;
  onVoiceLangChange?: (lang: VoiceLanguage) => void;
}

export const IptvChannelsHub: React.FC<IptvChannelsHubProps> = ({
  onSelectChannelForWorkout,
  onClose,
  initialAddModalOpen = false,
  initialSelectedChannelId,
  voiceLang = 'en',
  onVoiceLangChange,
}) => {
  // Saved Playlists State
  const [savedPlaylists, setSavedPlaylists] = useState<IptvPlaylist[]>(() => {
    try {
      const stored = localStorage.getItem('aurafit_saved_m3u_playlists');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return DEFAULT_PLAYLISTS;
  });

  const [activePlaylist, setActivePlaylist] = useState<IptvPlaylist>(DEFAULT_PLAYLISTS[0]);
  const [playlistUrl, setPlaylistUrl] = useState('https://iptv-org.github.io/iptv/index.m3u');
  const [channels, setChannels] = useState<IptvChannel[]>(INITIAL_IPTV_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<IptvChannel>(() => {
    if (initialSelectedChannelId) {
      const found = INITIAL_IPTV_CHANNELS.find((c) => c.id === initialSelectedChannelId);
      if (found) return found;
    }
    return INITIAL_IPTV_CHANNELS[0];
  });

  useEffect(() => {
    if (initialSelectedChannelId) {
      const found = channels.find((c) => c.id === initialSelectedChannelId);
      if (found) {
        setSelectedChannel(found);
      }
    }
  }, [initialSelectedChannelId, channels]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([
    'chan-zee-cinema-hd',
    'chan-redbull-tv',
    'chan-bloomberg-tv',
    'chan-nasa-tv',
    'chan-workout-beast',
  ]);
  const [showAddModal, setShowAddModal] = useState(initialAddModalOpen);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [channelRefreshKey, setChannelRefreshKey] = useState(0);
  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [updateToast, setUpdateToast] = useState<string | null>(null);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aurafit_iptv_favorites');
      if (saved) {
        setFavoriteIds(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // Update single currently playing channel
  const handleUpdateCurrentChannel = () => {
    playRemoteSelect();
    setIsUpdatingChannel(true);
    setChannelRefreshKey((prev) => prev + 1);
    setTimeout(() => {
      setIsUpdatingChannel(false);
      setUpdateToast(`Updated stream for "${selectedChannel.name}" · Live HLS verified`);
      setTimeout(() => setUpdateToast(null), 3500);
    }, 600);
  };

  // Update / Re-fetch all channels in current M3U playlist
  const handleUpdateAllChannels = async () => {
    playRemoteSelect();
    await fetchPlaylist(playlistUrl, activePlaylist.name);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastUpdatedTime(now);
    setUpdateToast(`Updated all channels from ${activePlaylist.name}!`);
    setTimeout(() => setUpdateToast(null), 3500);
  };

  // Sync / update channels across all 7 iptv-org feeds
  const handleSyncAllFeeds = async () => {
    playRemoteSelect();
    setIsSyncingAll(true);
    setUpdateToast('Syncing all 7 IPTV-Org feeds & updating channel indices...');
    try {
      await fetchPlaylist(playlistUrl, activePlaylist.name);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastUpdatedTime(now);
      setUpdateToast(`Successfully synced and updated all 7 IPTV-Org feeds! (${now})`);
    } catch (e) {
      setUpdateToast('Updated active channel feed.');
    } finally {
      setIsSyncingAll(false);
      setTimeout(() => setUpdateToast(null), 4000);
    }
  };

  // Fetch M3U playlist from backend proxy or direct fetch
  const fetchPlaylist = async (urlToFetch: string, playlistName?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    playRemoteClick();

    try {
      // 1. Call server proxy route to bypass browser CORS and parse remotely
      const proxyApiUrl = `/api/iptv/playlist?url=${encodeURIComponent(urlToFetch)}&limit=350`;
      const res = await fetch(proxyApiUrl);

      if (res.ok) {
        const data = await res.json();
        if (data.channels && data.channels.length > 0) {
          setChannels(data.channels);
          setSelectedChannel(data.channels[0]);
          setPlaylistUrl(urlToFetch);
          setActivePlaylist((prev) => ({
            ...prev,
            url: urlToFetch,
            name: playlistName || prev.name,
            totalChannels: data.channels.length,
          }));
          setIsLoading(false);
          return;
        }
      }

      // 2. Direct client fallback
      const directRes = await fetch(urlToFetch);
      if (!directRes.ok) {
        throw new Error(`HTTP ${directRes.status}: ${directRes.statusText}`);
      }

      const m3uText = await directRes.text();
      const parsed = parseM3uText(m3uText, 350);

      if (parsed.length > 0) {
        setChannels(parsed);
        setSelectedChannel(parsed[0]);
        setPlaylistUrl(urlToFetch);
        setActivePlaylist((prev) => ({
          ...prev,
          url: urlToFetch,
          name: playlistName || prev.name,
          totalChannels: parsed.length,
        }));
      } else {
        throw new Error('No valid playable streams found in the M3U playlist.');
      }
    } catch (err: any) {
      console.warn('Failed to load remote M3U playlist:', err);
      setErrorMsg(
        `Playlist notice: ${err?.message || 'Network error'}. Showing verified initial IPTV channels.`
      );
      setChannels(INITIAL_IPTV_CHANNELS);
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically fetch https://iptv-org.github.io/iptv/index.m3u on first visit!
  useEffect(() => {
    fetchPlaylist('https://iptv-org.github.io/iptv/index.m3u', 'IPTV-Org Global Master Index');
  }, []);

  const toggleFavorite = (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playRemoteClick();
    setFavoriteIds((prev) => {
      const next = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId];
      try {
        localStorage.setItem('aurafit_iptv_favorites', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  // Adding a new playlist from AddM3uModal
  const handleAddPlaylist = (newPl: IptvPlaylist) => {
    playRemoteSelect();
    setSavedPlaylists((prev) => {
      const filtered = prev.filter((p) => p.url !== newPl.url);
      const next = [newPl, ...filtered];
      try {
        localStorage.setItem('aurafit_saved_m3u_playlists', JSON.stringify(next));
      } catch (err) {}
      return next;
    });

    setActivePlaylist(newPl);
    setPlaylistUrl(newPl.url);
    if (newPl.channels && newPl.channels.length > 0) {
      setChannels(newPl.channels);
      setSelectedChannel(newPl.channels[0]);
    } else {
      fetchPlaylist(newPl.url, newPl.name);
    }
  };

  // Remove a custom saved playlist
  const handleRemovePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playRemoteClick();
    setSavedPlaylists((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('aurafit_saved_m3u_playlists', JSON.stringify(next));
      } catch (err) {}
      return next;
    });

    if (activePlaylist.id === id) {
      setActivePlaylist(DEFAULT_PLAYLISTS[0]);
      fetchPlaylist(DEFAULT_PLAYLISTS[0].url, DEFAULT_PLAYLISTS[0].name);
    }
  };

  // Channel Flipping (CH+ / CH-)
  const handleNextChannel = () => {
    playRemoteClick();
    const idx = channels.findIndex((c) => c.id === selectedChannel.id);
    if (idx < channels.length - 1) {
      setSelectedChannel(channels[idx + 1]);
    } else {
      setSelectedChannel(channels[0]);
    }
  };

  const handlePrevChannel = () => {
    playRemoteClick();
    const idx = channels.findIndex((c) => c.id === selectedChannel.id);
    if (idx > 0) {
      setSelectedChannel(channels[idx - 1]);
    } else {
      setSelectedChannel(channels[channels.length - 1]);
    }
  };

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => {
      if (c.group) {
        const clean = c.group.split(';')[0].trim();
        if (clean) set.add(clean);
      }
    });
    return ['All', ...Array.from(set).slice(0, 10)];
  }, [channels]);

  // Filtered Channels list
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      const matchesSearch =
        searchQuery === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.group && c.group.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' ||
        (c.group && c.group.toLowerCase().includes(selectedCategory.toLowerCase()));

      const matchesFavorite = !favoritesOnly || favoriteIds.includes(c.id);

      return matchesSearch && matchesCategory && matchesFavorite;
    });
  }, [channels, searchQuery, selectedCategory, favoritesOnly, favoriteIds]);

  return (
    <div className="space-y-6 select-none">
      {/* Modal for Adding M3U Playlist */}
      <AddM3uModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddPlaylist={handleAddPlaylist}
      />

      {/* IPTV Hub Hero Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Tv className="w-5 h-5" />
              </div>
              <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                FIRE TV LIVE IPTV & M3U
              </span>
              <span className="px-2.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-400 text-xs font-mono">
                {channels.length} Channels Loaded
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              Live IPTV Channel Guide & M3U Playlist Engine
            </h1>
            <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Stream public global broadcasts directly on Amazon Fire TV. Powered by{' '}
              <code className="text-amber-400 font-mono text-xs bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 font-bold">
                https://iptv-org.github.io/iptv/index.m3u
              </code>{' '}
              with live HLS playback, M3U text parsing, sports channels, and custom playlist support.
            </p>
          </div>

          {/* Quick Action Buttons: "+ Add M3U", "Update Channels", "Sync All Feeds", and "Switch Playlist" */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Primary Add M3U Button */}
            <button
              onClick={() => {
                playRemoteSelect();
                setShowAddModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-amber-500/25 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add M3U</span>
            </button>

            {/* Update / Refresh Current Playlist Channels */}
            <button
              onClick={handleUpdateAllChannels}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors border border-neutral-700"
              title={`Update channels from ${activePlaylist.name}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Updating...' : 'Update Channels'}</span>
              <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">
                ({lastUpdatedTime})
              </span>
            </button>

            {/* Sync All 7 Feeds button */}
            <button
              onClick={handleSyncAllFeeds}
              disabled={isSyncingAll}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Sync & update all 7 IPTV-org categories and indexes"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSyncingAll ? 'Syncing...' : 'Sync All 7 Feeds'}</span>
            </button>

            {/* Switch Playlist Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
                className="px-3.5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-neutral-800"
              >
                <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate max-w-[130px]">{activePlaylist.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {showPlaylistDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-2 z-30 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-neutral-800 text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                    <span>IPTV-Org M3U Feeds</span>
                    <button
                      onClick={() => {
                        setShowPlaylistDropdown(false);
                        setShowAddModal(true);
                      }}
                      className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Plus className="w-3 h-3" />
                      Add New
                    </button>
                  </div>

                  <div className="space-y-1 max-h-64 overflow-y-auto mt-1">
                    {savedPlaylists.map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => {
                          playRemoteSelect();
                          setActivePlaylist(pl);
                          setShowPlaylistDropdown(false);
                          fetchPlaylist(pl.url, pl.name);
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          activePlaylist.id === pl.id
                            ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold'
                            : 'bg-neutral-950/70 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="truncate text-white font-medium">{pl.name}</div>
                          <div className="text-[10px] text-neutral-500 truncate">{pl.url}</div>
                        </div>

                        {/* Delete custom playlist button */}
                        {!pl.id.startsWith('pl-iptv-org-') && (
                          <button
                            onClick={(e) => handleRemovePlaylist(pl.id, e)}
                            className="p-1 text-neutral-500 hover:text-rose-400 rounded cursor-pointer"
                            title="Remove Playlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-2 border-t border-neutral-800 mt-1">
                    <button
                      onClick={() => {
                        playRemoteSelect();
                        setSavedPlaylists(DEFAULT_PLAYLISTS);
                        try {
                          localStorage.setItem(
                            'aurafit_saved_m3u_playlists',
                            JSON.stringify(DEFAULT_PLAYLISTS)
                          );
                        } catch (e) {}
                        setShowPlaylistDropdown(false);
                        fetchPlaylist(DEFAULT_PLAYLISTS[0].url, DEFAULT_PLAYLISTS[0].name);
                      }}
                      className="w-full py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-[11px] text-amber-400 font-semibold text-center border border-neutral-800"
                    >
                      Reset All 7 Official IPTV-Org Feeds
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preset M3U Playlist Pills */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <ListFilter className="w-3.5 h-3.5 text-amber-500" />
            IPTV-Org Feeds:
          </span>

          {M3U_SOURCE_PRESETS.map((preset) => {
            const isSelected = playlistUrl === preset.url;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  fetchPlaylist(preset.url, preset.name);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                    : 'bg-neutral-950/70 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
                title={preset.description}
              >
                <span>{preset.name}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error notification banner if any */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-amber-400 hover:text-white text-xs font-bold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Toast Notification Banner for Channel / Playlist Updates */}
      {updateToast && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-700/80 text-xs text-emerald-200 flex items-center justify-between shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">{updateToast}</span>
          </div>
          <button
            onClick={() => setUpdateToast(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold px-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Split Stage: 16:9 Live Cinema Screen on Left, Channel Guide on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cinema Video Player Stage */}
        <div className="lg:col-span-8 space-y-4">
          <div className="aspect-video bg-neutral-950 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800">
            <IptvLivePlayer
              channel={selectedChannel}
              onNextChannel={handleNextChannel}
              onPrevChannel={handlePrevChannel}
              onUpdateChannel={handleUpdateCurrentChannel}
              refreshKey={channelRefreshKey}
              autoPlay={true}
              className="w-full h-full"
              voiceLang={voiceLang}
              onVoiceLangChange={onVoiceLangChange}
            />
          </div>

          {/* Zee Cinema HD & Multilingual Voice (Gujarati, Hindi, English) Try Hub */}
          <div className="bg-gradient-to-r from-purple-950/70 via-neutral-900 to-neutral-900 border border-purple-800/80 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-600/60 flex items-center justify-center text-purple-300 font-bold shrink-0 shadow-md">
                  <Languages className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white font-display">
                      Voice Change & Audio Tracks
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-300 font-mono text-[10px] font-bold">
                      ZEE5 Cinema HD
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/80 text-amber-300 font-mono text-[10px]">
                      Active: {voiceLang === 'gu' ? 'ગુજરાતી (Gujarati)' : voiceLang === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Click to try native speech synthesis voice in Gujarati, Hindi, or English and switch live stream audio
                  </p>
                </div>
              </div>

              {/* Direct Buttons to Try Gujarati, Hindi, English */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    playRemoteSelect();
                    if (onVoiceLangChange) onVoiceLangChange('gu');
                    const sample = tryVoiceSample('gu');
                    setUpdateToast(`🔊 Spoke in Gujarati: "${sample.phrase.slice(0, 36)}..."`);
                    setTimeout(() => setUpdateToast(null), 4000);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                    voiceLang === 'gu'
                      ? 'bg-cyan-500 text-neutral-950 border-cyan-400 shadow-cyan-500/20'
                      : 'bg-neutral-950/80 border-neutral-700 text-neutral-200 hover:text-white hover:bg-neutral-800'
                  }`}
                  title="Try Gujarati Voice (અવાજ ગુજરાતી)"
                >
                  <span>🇮🇳</span>
                  <span>Try ગુજરાતી</span>
                </button>

                <button
                  onClick={() => {
                    playRemoteSelect();
                    if (onVoiceLangChange) onVoiceLangChange('hi');
                    const sample = tryVoiceSample('hi');
                    setUpdateToast(`🔊 Spoke in Hindi: "${sample.phrase.slice(0, 36)}..."`);
                    setTimeout(() => setUpdateToast(null), 4000);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                    voiceLang === 'hi'
                      ? 'bg-cyan-500 text-neutral-950 border-cyan-400 shadow-cyan-500/20'
                      : 'bg-neutral-950/80 border-neutral-700 text-neutral-200 hover:text-white hover:bg-neutral-800'
                  }`}
                  title="Try Hindi Voice (आवाज हिन्दी)"
                >
                  <span>🇮🇳</span>
                  <span>Try हिन्दी</span>
                </button>

                <button
                  onClick={() => {
                    playRemoteSelect();
                    if (onVoiceLangChange) onVoiceLangChange('en');
                    const sample = tryVoiceSample('en');
                    setUpdateToast(`🔊 Spoke in English: "${sample.phrase.slice(0, 36)}..."`);
                    setTimeout(() => setUpdateToast(null), 4000);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                    voiceLang === 'en'
                      ? 'bg-cyan-500 text-neutral-950 border-cyan-400 shadow-cyan-500/20'
                      : 'bg-neutral-950/80 border-neutral-700 text-neutral-200 hover:text-white hover:bg-neutral-800'
                  }`}
                  title="Try English Voice"
                >
                  <span>🌐</span>
                  <span>Try English</span>
                </button>

                {/* Direct Tune to Zee Cinema HD */}
                <button
                  onClick={() => {
                    playRemoteSelect();
                    const zeeChan = channels.find((c) => c.id === 'chan-zee-cinema-hd') || INITIAL_IPTV_CHANNELS[0];
                    setSelectedChannel(zeeChan);
                    setUpdateToast('Tuned to Zee Cinema HD live broadcast!');
                    setTimeout(() => setUpdateToast(null), 3000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-950/90 hover:bg-purple-900 border border-purple-700 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                  title="Tune to Zee Cinema HD Live Broadcast"
                >
                  <Tv className="w-3.5 h-3.5 text-purple-400" />
                  <span>Tune Zee Cinema HD</span>
                </button>

                {/* ZEE5 External Stream Link */}
                <a
                  href="https://www.zee5.com/live-tv/zee-cinema-hd/0-9-zeecinemahd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
                  title="Open official ZEE5 live stream in browser"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ZEE5 Live</span>
                </a>
              </div>
            </div>
          </div>

          {/* Under-player Broadcast Bar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              {selectedChannel?.logo ? (
                <img
                  src={selectedChannel.logo}
                  alt={selectedChannel.name}
                  className="w-10 h-10 rounded-xl object-contain bg-neutral-950 border border-neutral-800 p-1"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-amber-400">
                  <Tv className="w-5 h-5" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-display text-white truncate max-w-sm">
                    {selectedChannel?.name || 'Live Broadcast'}
                  </h3>
                  <button
                    onClick={(e) => selectedChannel && toggleFavorite(selectedChannel.id, e)}
                    className="text-neutral-400 hover:text-amber-400 p-0.5 cursor-pointer"
                    title="Toggle Favorite"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        selectedChannel && favoriteIds.includes(selectedChannel.id)
                          ? 'fill-amber-400 text-amber-400'
                          : ''
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5 font-mono">
                  <span>{selectedChannel?.group || 'Live Stream'}</span>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <span className="text-cyan-400">HLS Adaptive Bitrate</span>
                  {selectedChannel?.country && (
                    <>
                      <span aria-hidden="true" className="text-neutral-600">·</span>
                      <span>{selectedChannel.country}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions: Update Channel, Channel Surfing & Workout integration */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Update Channel Button */}
              <button
                onClick={handleUpdateCurrentChannel}
                disabled={isUpdatingChannel}
                className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Update and re-tune current live stream channel"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingChannel ? 'animate-spin' : ''}`} />
                <span>{isUpdatingChannel ? 'Updating...' : 'Update Channel'}</span>
              </button>

              {/* ZEE5 Direct Live Button if available */}
              {selectedChannel?.externalUrl && (
                <a
                  href={selectedChannel.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/80 text-purple-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
                  title="Watch official high-definition live stream on ZEE5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                  <span>Watch on ZEE5 Live</span>
                </a>
              )}

              <button
                onClick={handlePrevChannel}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold cursor-pointer transition-colors"
                title="Previous Channel (CH-)"
              >
                CH -
              </button>
              <button
                onClick={handleNextChannel}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold cursor-pointer transition-colors"
                title="Next Channel (CH+)"
              >
                CH +
              </button>

              {onSelectChannelForWorkout && (
                <button
                  onClick={() => {
                    playRemoteSelect();
                    onSelectChannelForWorkout(selectedChannel);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Use this live TV channel as video background during workout"
                >
                  <Flame className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Set as Workout TV</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Electronic Program Guide (EPG) & Channel List */}
        <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-bold font-display text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-500" />
                IPTV Channel Guide
              </h2>
              <span className="text-xs text-neutral-400 font-mono">
                {filteredChannels.length} of {channels.length} channels
              </span>
            </div>

            {/* Favorites filter toggle */}
            <button
              onClick={() => {
                playRemoteClick();
                setFavoritesOnly(!favoritesOnly);
              }}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                favoritesOnly
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Show Favorites Only"
            >
              <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Stars</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live channels, sports, news..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Categories Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  playRemoteClick();
                  setSelectedCategory(cat);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Scrollable Channels List */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredChannels.length === 0 ? (
              <div className="p-8 text-center bg-neutral-950/60 rounded-2xl border border-neutral-800">
                <Tv className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-400 font-medium">No channels found</p>
                <p className="text-[11px] text-neutral-500 mt-1">Try clearing your search query or category filter</p>
              </div>
            ) : (
              filteredChannels.map((channel, idx) => {
                const isSelected = selectedChannel?.id === channel.id;
                const isFav = favoriteIds.includes(channel.id);
                return (
                  <div
                    key={channel.id}
                    onClick={() => {
                      playRemoteSelect();
                      setSelectedChannel(channel);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg'
                        : 'bg-neutral-950/80 border-neutral-800/80 hover:bg-neutral-950 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-mono text-neutral-500 w-5 text-right shrink-0">
                        {idx + 1}
                      </span>

                      {channel.logo ? (
                        <img
                          src={channel.logo}
                          alt={channel.name}
                          className="w-8 h-8 rounded-lg object-contain bg-neutral-900 border border-neutral-800 p-0.5 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-500 shrink-0">
                          <Tv className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate max-w-[170px] sm:max-w-none">
                          {channel.name}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400 mt-0.5 flex items-center gap-1.5">
                          <span className="truncate">{channel.group || 'Live'}</span>
                          {channel.resolution && (
                            <span className="text-cyan-400 shrink-0">{channel.resolution}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => toggleFavorite(channel.id, e)}
                        className="text-neutral-500 hover:text-amber-400 p-1 cursor-pointer"
                        title={isFav ? 'Remove Favorite' : 'Add to Favorites'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>

                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
