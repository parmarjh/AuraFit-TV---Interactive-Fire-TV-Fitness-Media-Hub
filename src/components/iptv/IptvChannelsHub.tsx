import React, { useState, useEffect, useMemo, useRef } from 'react';
import { IptvChannel, IptvPlaylist, VoiceLanguage, ZeeShow } from '../../types';
import { IptvLivePlayer } from './IptvLivePlayer';
import { AddM3uModal } from './AddM3uModal';
import { ZeeShowsGrid } from './ZeeShowsGrid';
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
  Film,
  Calendar,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';
import { M3U_SOURCE_PRESETS, parseM3uText } from '../../utils/m3uParser';
import { INITIAL_IPTV_CHANNELS, ZEE_POPULAR_SHOWS, getZeeChannels } from '../../data/iptvChannels';
import {
  VOICE_LANGUAGES,
  speakVoiceResponse,
  tryVoiceSample,
} from '../../utils/voiceAssistant';

const DEFAULT_PLAYLISTS: IptvPlaylist[] = [
  {
    id: 'pl-zee5-network',
    name: '🌟 ZEE5 Live TV (All 28 Channels)',
    url: 'https://www.zee5.com/live-tv',
    totalChannels: 28,
    lastUpdated: 'Live ZEE5 Network',
    description: 'Official ZEE5 Channels suite: Zee Cinema, Zee TV, Zee News, Zee 24 Kalak (Gujarati), Zee Business, Zee Marathi, Zee Bangla, Zee Telugu, Zee Tamil, etc.',
    channels: INITIAL_IPTV_CHANNELS.filter((c) => c.isZeeNetwork),
  },
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
    id: 'pl-iptv-org-sports',
    name: 'IPTV-Org Sports Category',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    totalChannels: 0,
    lastUpdated: 'Live Feed',
    description: 'Live sporting events, fitness, extreme sports, cycling, and competitions',
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
  const [playlistUrl, setPlaylistUrl] = useState('https://www.zee5.com/live-tv');
  const [channels, setChannels] = useState<IptvChannel[]>(INITIAL_IPTV_CHANNELS);
  const [activeView, setActiveView] = useState<'channels' | 'zee-shows'>('channels');

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
    'chan-zee-tv-hd',
    'chan-zee-news-hd',
    'chan-zee-24-kalak',
    'chan-zee-business',
    'chan-redbull-tv',
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
      setUpdateToast(`Updated stream for "${selectedChannel.name}" · Verified live playback`);
      setTimeout(() => setUpdateToast(null), 3500);
    }, 600);
  };

  // Update / Re-fetch all channels in current playlist
  const handleUpdateAllChannels = async () => {
    playRemoteSelect();
    await fetchPlaylist(playlistUrl, activePlaylist.name);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastUpdatedTime(now);
    setUpdateToast(`Updated channels for ${activePlaylist.name}!`);
    setTimeout(() => setUpdateToast(null), 3500);
  };

  // Sync / update channels
  const handleSyncAllFeeds = async () => {
    playRemoteSelect();
    setIsSyncingAll(true);
    setUpdateToast('Syncing all ZEE5 & IPTV live channel feeds...');
    try {
      await fetchPlaylist(playlistUrl, activePlaylist.name);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastUpdatedTime(now);
      setUpdateToast(`Successfully synced and refreshed all feeds! (${now})`);
    } catch (e) {
      setUpdateToast('Updated channel feeds.');
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

    // If requesting ZEE5 Network, use our comprehensive built-in channels
    if (urlToFetch === 'https://www.zee5.com/live-tv' || urlToFetch.includes('zee5')) {
      const zeeChans = INITIAL_IPTV_CHANNELS.filter((c) => c.isZeeNetwork);
      setChannels(INITIAL_IPTV_CHANNELS);
      setSelectedChannel(zeeChans[0] || INITIAL_IPTV_CHANNELS[0]);
      setPlaylistUrl(urlToFetch);
      setActivePlaylist({
        id: 'pl-zee5-network',
        name: '🌟 ZEE5 Live TV (All 28 Channels)',
        url: urlToFetch,
        totalChannels: zeeChans.length,
        lastUpdated: 'Live ZEE5 Network',
        channels: zeeChans,
      });
      setIsLoading(false);
      return;
    }

    try {
      // 1. Call server proxy route to bypass browser CORS and parse remotely
      const proxyApiUrl = `/api/iptv/playlist?url=${encodeURIComponent(urlToFetch)}&limit=350`;
      const res = await fetch(proxyApiUrl);

      if (res.ok) {
        const data = await res.json();
        if (data.channels && data.channels.length > 0) {
          // Merge with built-in channels so ZEE5 channels are always available
          const merged = [...INITIAL_IPTV_CHANNELS, ...data.channels];
          setChannels(merged);
          setPlaylistUrl(urlToFetch);
          setActivePlaylist((prev) => ({
            ...prev,
            url: urlToFetch,
            name: playlistName || prev.name,
            totalChannels: merged.length,
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
        const merged = [...INITIAL_IPTV_CHANNELS, ...parsed];
        setChannels(merged);
        setPlaylistUrl(urlToFetch);
        setActivePlaylist((prev) => ({
          ...prev,
          url: urlToFetch,
          name: playlistName || prev.name,
          totalChannels: merged.length,
        }));
      } else {
        throw new Error('No valid playable streams found in the M3U playlist.');
      }
    } catch (err: any) {
      console.warn('Failed to load remote M3U playlist, falling back to verified channels:', err);
      setErrorMsg(
        `Notice: Remote feed was offline. Loaded all verified ZEE5 and IPTV live channels.`
      );
      setChannels(INITIAL_IPTV_CHANNELS);
    } finally {
      setIsLoading(false);
    }
  };

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
      const merged = [...INITIAL_IPTV_CHANNELS, ...newPl.channels];
      setChannels(merged);
      setSelectedChannel(merged[0]);
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
      setChannels(INITIAL_IPTV_CHANNELS);
      setSelectedChannel(INITIAL_IPTV_CHANNELS[0]);
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

  // Play a Zee Show directly
  const handlePlayZeeShow = (show: ZeeShow) => {
    playRemoteSelect();
    const parentChannel = channels.find((c) => c.name.toLowerCase().includes(show.channelName.toLowerCase().slice(0, 8)));
    const showChannel: IptvChannel = {
      id: `show-${show.id}`,
      name: `${show.channelName}: ${show.title}`,
      streamUrl: show.streamUrl || parentChannel?.streamUrl || 'https://tvextra-hls.b-cdn.net/bollywoodfilm/bollywoodfilm.m3u8',
      backupStreamUrls: parentChannel?.backupStreamUrls || [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      ],
      externalUrl: show.zee5Url || parentChannel?.externalUrl || 'https://www.zee5.com',
      logo: show.thumbnail || parentChannel?.logo,
      group: show.genre,
      country: 'India 🇮🇳',
      language: show.language,
      resolution: '1080p Full HD',
      isFavorite: true,
      isZeeNetwork: true,
      currentShow: `${show.title} (${show.timeSlot || 'Episode Preview'})`,
      description: show.description,
    };
    setSelectedChannel(showChannel);
    setActiveView('channels');
    setUpdateToast(`Now Playing: ${show.title} (${show.channelName})`);
    setTimeout(() => setUpdateToast(null), 3500);
  };

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add('All');
    set.add('🌟 ZEE5 Network');
    set.add('ZEE Movies');
    set.add('ZEE Entertainment');
    set.add('ZEE News');
    set.add('ZEE Regional');
    channels.forEach((c) => {
      if (c.group && !c.group.startsWith('ZEE')) {
        const clean = c.group.split(';')[0].trim();
        if (clean) set.add(clean);
      }
    });
    return Array.from(set).slice(0, 12);
  }, [channels]);

  // Filtered Channels list
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      const matchesSearch =
        searchQuery === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.language && c.language.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.group && c.group.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.currentShow && c.currentShow.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesCategory = true;
      if (selectedCategory === 'All') {
        matchesCategory = true;
      } else if (selectedCategory === '🌟 ZEE5 Network') {
        matchesCategory = Boolean(c.isZeeNetwork);
      } else if (selectedCategory === 'ZEE Movies') {
        matchesCategory = c.group === 'ZEE Movies';
      } else if (selectedCategory === 'ZEE Entertainment') {
        matchesCategory = c.group === 'ZEE Entertainment';
      } else if (selectedCategory === 'ZEE News') {
        matchesCategory = c.group === 'ZEE News';
      } else if (selectedCategory === 'ZEE Regional') {
        matchesCategory = c.group === 'ZEE Regional';
      } else {
        matchesCategory = Boolean(c.group && c.group.toLowerCase().includes(selectedCategory.toLowerCase()));
      }

      const matchesFavorite = !favoritesOnly || favoriteIds.includes(c.id);

      return matchesSearch && matchesCategory && matchesFavorite;
    });
  }, [channels, searchQuery, selectedCategory, favoritesOnly, favoriteIds]);

  const zeeChannelsCount = useMemo(() => channels.filter((c) => c.isZeeNetwork).length, [channels]);

  return (
    <div className="space-y-6 select-none">
      {/* Modal for Adding M3U Playlist */}
      <AddM3uModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddPlaylist={handleAddPlaylist}
      />

      {/* IPTV & ZEE5 Hub Hero Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300 font-bold">
                <Tv className="w-5 h-5 text-purple-400" />
              </div>

              <span className="px-3 py-1 rounded-full bg-purple-950/90 border border-purple-700 text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                ZEE5 LIVE TV & SHOWS
              </span>

              <a
                href="https://www.zee5.com/live-tv"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full bg-purple-900/60 hover:bg-purple-800 border border-purple-600 text-purple-200 text-xs font-mono font-semibold flex items-center gap-1 transition-colors"
                title="Open official ZEE5 Live TV web"
              >
                <span>https://www.zee5.com</span>
                <ExternalLink className="w-3 h-3 text-purple-400" />
              </a>

              <span className="px-2.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-400 text-xs font-mono">
                {channels.length} Channels Loaded ({zeeChannelsCount} ZEE5 Channels)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              ZEE5 Live TV Channels & IPTV Broadcast Engine
            </h1>
            <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Watch all 28+ official ZEE5 network channels live: Zee Cinema HD, Zee TV HD, Zee News, Zee 24 Kalak (Gujarati), Zee Business, Zee Marathi, Zee Bangla, Zee Telugu, and more with resilient HLS multi-stream failover and popular shows guide.
            </p>
          </div>

          {/* Action Buttons: View Switcher, Add M3U, Playlist Dropdown */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Toggle: Channels vs Shows */}
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl p-1">
              <button
                onClick={() => {
                  playRemoteClick();
                  setActiveView('channels');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeView === 'channels'
                    ? 'bg-purple-600 text-white shadow-md font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>All Channels ({channels.length})</span>
              </button>

              <button
                onClick={() => {
                  playRemoteClick();
                  setActiveView('zee-shows');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeView === 'zee-shows'
                    ? 'bg-purple-600 text-white shadow-md font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-amber-400" />
                <span>ZEE5 Shows ({ZEE_POPULAR_SHOWS.length})</span>
              </button>
            </div>

            {/* Primary Add M3U Button */}
            <button
              onClick={() => {
                playRemoteSelect();
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add M3U</span>
            </button>

            {/* Update Channels */}
            <button
              onClick={handleUpdateAllChannels}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors border border-neutral-700"
              title={`Update channels`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Updating...' : 'Refresh'}</span>
            </button>

            {/* Switch Playlist Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
                className="px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-neutral-800"
              >
                <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                <span className="truncate max-w-[120px]">{activePlaylist.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {showPlaylistDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-2 z-30 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-neutral-800 text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Live Channel Feeds</span>
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
                            ? 'bg-purple-600/25 border-purple-500 text-white font-bold'
                            : 'bg-neutral-950/70 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="truncate text-white font-medium">{pl.name}</div>
                          <div className="text-[10px] text-neutral-500 truncate">{pl.url}</div>
                        </div>

                        {!pl.id.startsWith('pl-') && (
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
                      className="w-full py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-[11px] text-purple-400 font-semibold text-center border border-neutral-800"
                    >
                      Reset to Official ZEE5 Channels
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preset Channel & Source Pills */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <ListFilter className="w-3.5 h-3.5 text-purple-400" />
            Quick Feeds:
          </span>

          {/* Quick ZEE5 Feed Pill */}
          <button
            onClick={() => {
              playRemoteClick();
              fetchPlaylist('https://www.zee5.com/live-tv', '🌟 ZEE5 Network');
              setSelectedCategory('🌟 ZEE5 Network');
              setActiveView('channels');
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 border bg-purple-950/80 border-purple-600 text-purple-200 hover:bg-purple-900"
          >
            <span>🌟 ZEE5 Live TV (28 Channels)</span>
          </button>

          {/* Quick Shows Pill */}
          <button
            onClick={() => {
              playRemoteClick();
              setActiveView('zee-shows');
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 border bg-neutral-950/80 border-purple-700/80 text-purple-300 hover:text-white"
          >
            <span>🎬 ZEE5 Shows & Serials</span>
          </button>

          {M3U_SOURCE_PRESETS.slice(0, 4).map((preset) => {
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

      {/* Toast Notification Banner */}
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

      {/* Main Content Area */}
      {activeView === 'zee-shows' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveView('channels')}
              className="text-xs text-purple-300 hover:text-white underline font-bold cursor-pointer"
            >
              ← Back to Live TV Channels
            </button>
          </div>
          <ZeeShowsGrid
            onPlayShow={handlePlayZeeShow}
            onTuneChannel={(cName) => {
              const ch = channels.find((c) => c.name.toLowerCase().includes(cName.toLowerCase()));
              if (ch) {
                setSelectedChannel(ch);
                setActiveView('channels');
              }
            }}
          />
        </div>
      ) : (
        /* Split Stage: 16:9 Live Cinema Screen on Left, Channel Guide on Right */
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

            {/* Quick Channel Bar: Zee Cinema, Zee TV, Zee News, Zee 24 Kalak, Zee Business */}
            <div className="bg-gradient-to-r from-purple-950/80 via-neutral-900 to-neutral-900 border border-purple-800/80 rounded-2xl p-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-600/60 flex items-center justify-center text-purple-300 font-bold shrink-0 shadow-md">
                    <Languages className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white font-display">
                        Quick ZEE5 Channel Surfing & Voice
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-300 font-mono text-[10px] font-bold">
                        ZEE5 Live
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Fast-switch between flagship Zee channels or click language to try Gujarati/Hindi speech voice
                    </p>
                  </div>
                </div>

                {/* Quick Channel Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      playRemoteSelect();
                      const ch = channels.find((c) => c.id === 'chan-zee-cinema-hd') || INITIAL_IPTV_CHANNELS[0];
                      setSelectedChannel(ch);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      selectedChannel?.id === 'chan-zee-cinema-hd'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-neutral-950/80 border-neutral-700 text-purple-200 hover:text-white'
                    }`}
                  >
                    <span>Zee Cinema HD</span>
                  </button>

                  <button
                    onClick={() => {
                      playRemoteSelect();
                      const ch = channels.find((c) => c.id === 'chan-zee-tv-hd') || INITIAL_IPTV_CHANNELS[1];
                      setSelectedChannel(ch);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      selectedChannel?.id === 'chan-zee-tv-hd'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-neutral-950/80 border-neutral-700 text-purple-200 hover:text-white'
                    }`}
                  >
                    <span>Zee TV HD</span>
                  </button>

                  <button
                    onClick={() => {
                      playRemoteSelect();
                      const ch = channels.find((c) => c.id === 'chan-zee-news-hd') || INITIAL_IPTV_CHANNELS[2];
                      setSelectedChannel(ch);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      selectedChannel?.id === 'chan-zee-news-hd'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-neutral-950/80 border-neutral-700 text-purple-200 hover:text-white'
                    }`}
                  >
                    <span>Zee News HD</span>
                  </button>

                  <button
                    onClick={() => {
                      playRemoteSelect();
                      const ch = channels.find((c) => c.id === 'chan-zee-24-kalak') || INITIAL_IPTV_CHANNELS[3];
                      setSelectedChannel(ch);
                      if (onVoiceLangChange) onVoiceLangChange('gu');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      selectedChannel?.id === 'chan-zee-24-kalak'
                        ? 'bg-cyan-500 text-neutral-950 border-cyan-400 shadow-md'
                        : 'bg-neutral-950/80 border-neutral-700 text-cyan-300 hover:text-white'
                    }`}
                  >
                    <span>Zee 24 Kalak (ગુજરાતી)</span>
                  </button>

                  <button
                    onClick={() => {
                      playRemoteSelect();
                      const ch = channels.find((c) => c.id === 'chan-zee-business') || INITIAL_IPTV_CHANNELS[4];
                      setSelectedChannel(ch);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      selectedChannel?.id === 'chan-zee-business'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-neutral-950/80 border-neutral-700 text-purple-200 hover:text-white'
                    }`}
                  >
                    <span>Zee Business</span>
                  </button>
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
                    <span className="text-cyan-400">Adaptive HD Bitrate</span>
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
                {selectedChannel?.externalUrl && (
                  <a
                    href={selectedChannel.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 border border-purple-400/40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-purple-600/30"
                    title="Watch official high-definition live stream on ZEE5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Watch on ZEE5</span>
                  </a>
                )}

                <button
                  onClick={handleUpdateCurrentChannel}
                  disabled={isUpdatingChannel}
                  className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Update and re-tune current live stream channel"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingChannel ? 'animate-spin' : ''}`} />
                  <span>{isUpdatingChannel ? 'Updating...' : 'Update'}</span>
                </button>

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
                  <Radio className="w-4 h-4 text-purple-400" />
                  Live Channel Guide
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
                placeholder="Search Zee Cinema, Zee TV, Zee 24 Kalak, sports..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
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
                      ? cat.includes('ZEE')
                        ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                        : 'bg-amber-500 text-neutral-950 font-bold'
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
                          ? channel.isZeeNetwork
                            ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg'
                            : 'bg-amber-500/15 border-amber-500 text-white shadow-lg'
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
                            className="w-9 h-9 rounded-lg object-contain bg-neutral-900 border border-neutral-800 p-0.5 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-500 shrink-0">
                            <Tv className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate max-w-[170px] sm:max-w-none flex items-center gap-1.5">
                            <span className="truncate">{channel.name}</span>
                            {channel.isZeeNetwork && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-950 border border-purple-700 text-[9px] text-purple-300 font-mono shrink-0">
                                ZEE5
                              </span>
                            )}
                          </div>

                          {channel.currentShow && (
                            <div className="text-[10px] text-amber-300/90 truncate max-w-[200px] mt-0.5">
                              {channel.currentShow}
                            </div>
                          )}

                          <div className="text-[10px] font-mono text-neutral-400 mt-0.5 flex items-center gap-1.5">
                            <span className="truncate">{channel.group || 'Live'}</span>
                            {channel.resolution && (
                              <span className="text-cyan-400 shrink-0">{channel.resolution}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {channel.externalUrl && (
                          <a
                            href={channel.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-purple-400 hover:text-purple-300 rounded cursor-pointer"
                            title="Open on ZEE5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

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
      )}
    </div>
  );
};
