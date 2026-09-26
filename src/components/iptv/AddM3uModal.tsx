import React, { useState, useRef } from 'react';
import { IptvChannel, IptvPlaylist } from '../../types';
import { parseM3uText, M3U_SOURCE_PRESETS } from '../../utils/m3uParser';
import {
  X,
  Link,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Tv,
  ListPlus,
  Sparkles,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';

interface AddM3uModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlaylist: (playlist: IptvPlaylist) => void;
}

export const AddM3uModal: React.FC<AddM3uModalProps> = ({
  isOpen,
  onClose,
  onAddPlaylist,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'paste' | 'file'>('url');
  const [url, setUrl] = useState('https://iptv-org.github.io/iptv/index.m3u');
  const [name, setName] = useState('IPTV-Org Master Playlist');
  const [rawText, setRawText] = useState('');
  const [channelLimit, setChannelLimit] = useState(300);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle Preset Selection
  const handleSelectPreset = (presetUrl: string, presetName: string) => {
    playRemoteClick();
    setUrl(presetUrl);
    setName(presetName);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Add all 7 presets simultaneously
  const handleAddAllSevenPresets = () => {
    playRemoteSelect();
    setSuccessMsg('Added all official IPTV-Org playlists to your Fire TV lineup!');
    M3U_SOURCE_PRESETS.forEach((preset) => {
      const pl: IptvPlaylist = {
        id: `pl-${preset.id}`,
        name: preset.name,
        url: preset.url,
        totalChannels: 0,
        lastUpdated: 'Live Feed',
        description: preset.description,
        channels: [],
      };
      onAddPlaylist(pl);
    });
    setTimeout(() => {
      onClose();
    }, 800);
  };

  // Submit URL flow
  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    playRemoteSelect();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Try server proxy endpoint to bypass browser CORS
      const proxyApi = `/api/iptv/playlist?url=${encodeURIComponent(url.trim())}&limit=${channelLimit}`;
      const res = await fetch(proxyApi);

      let parsedChannels: IptvChannel[] = [];

      if (res.ok) {
        const data = await res.json();
        if (data.channels && data.channels.length > 0) {
          parsedChannels = data.channels;
        }
      }

      // 2. Direct fallback if proxy didn't return
      if (parsedChannels.length === 0) {
        const directRes = await fetch(url.trim());
        if (!directRes.ok) throw new Error(`HTTP ${directRes.status}: ${directRes.statusText}`);
        const text = await directRes.text();
        parsedChannels = parseM3uText(text, channelLimit);
      }

      if (parsedChannels.length === 0) {
        throw new Error('No valid playable streams found in the M3U playlist.');
      }

      const newPlaylist: IptvPlaylist = {
        id: `pl-${Date.now()}`,
        name: name.trim() || 'Custom M3U Playlist',
        url: url.trim(),
        totalChannels: parsedChannels.length,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: `Loaded ${parsedChannels.length} channels from ${url.trim()}`,
        channels: parsedChannels,
      };

      setSuccessMsg(`Successfully parsed ${parsedChannels.length} channels!`);
      setTimeout(() => {
        onAddPlaylist(newPlaylist);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Failed to load playlist:', err);
      setErrorMsg(err?.message || 'Failed to fetch or parse the M3U playlist.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Raw Text flow
  const handleSubmitPaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    playRemoteSelect();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const parsedChannels = parseM3uText(rawText, channelLimit);
      if (parsedChannels.length === 0) {
        throw new Error('No valid channel stream entries found in the pasted text.');
      }

      const newPlaylist: IptvPlaylist = {
        id: `pl-raw-${Date.now()}`,
        name: name.trim() || 'Pasted M3U Playlist',
        url: 'Pasted M3U Text',
        totalChannels: parsedChannels.length,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: `Pasted M3U text with ${parsedChannels.length} channels`,
        channels: parsedChannels,
      };

      setSuccessMsg(`Successfully parsed ${parsedChannels.length} channels!`);
      setTimeout(() => {
        onAddPlaylist(newPlaylist);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to parse M3U text.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit File flow
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playRemoteSelect();
    setIsLoading(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedChannels = parseM3uText(content, channelLimit);

        if (parsedChannels.length === 0) {
          throw new Error('No valid channels found in the uploaded file.');
        }

        const newPlaylist: IptvPlaylist = {
          id: `pl-file-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: `File: ${file.name}`,
          totalChannels: parsedChannels.length,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          description: `Uploaded file ${file.name} (${parsedChannels.length} channels)`,
          channels: parsedChannels,
        };

        setSuccessMsg(`Successfully parsed ${parsedChannels.length} channels from ${file.name}!`);
        setTimeout(() => {
          onAddPlaylist(newPlaylist);
          onClose();
        }, 700);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Error parsing uploaded M3U file.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Ambient glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                Add M3U IPTV Playlist
              </h2>
              <span className="text-xs text-neutral-400">
                Connect external M3U / M3U8 stream playlists directly to Fire TV
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              playRemoteClick();
              onClose();
            }}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Switcher Tabs */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs">
          <button
            onClick={() => {
              playRemoteClick();
              setActiveTab('url');
            }}
            className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Playlist URL</span>
          </button>

          <button
            onClick={() => {
              playRemoteClick();
              setActiveTab('paste');
            }}
            className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste M3U Text</span>
          </button>

          <button
            onClick={() => {
              playRemoteClick();
              setActiveTab('file');
            }}
            className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: URL Input Form */}
        {activeTab === 'url' && (
          <form onSubmit={handleSubmitUrl} className="mt-4 space-y-4">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                Playlist Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. IPTV-Org Master Index"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
                  M3U / M3U8 Playlist URL
                </label>
                <span className="text-[10px] font-mono text-cyan-400">Supported: .m3u, .m3u8, HLS</span>
              </div>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://iptv-org.github.io/iptv/index.m3u"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quick 1-Click Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Quick 1-Click Presets:
                </span>
                <button
                  type="button"
                  onClick={handleAddAllSevenPresets}
                  className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  + Add All 7 Playlists
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {M3U_SOURCE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url, preset.name)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer truncate ${
                      url === preset.url
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="truncate font-semibold text-[11px]">{preset.name}</div>
                    <div className="text-[10px] text-neutral-500 truncate">{preset.category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Channel count limit */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-neutral-400">Channels to import:</span>
              <div className="flex items-center gap-1">
                {[100, 300, 500, 1000].map((lim) => (
                  <button
                    key={lim}
                    type="button"
                    onClick={() => setChannelLimit(lim)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                      channelLimit === lim
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {lim}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing Channels...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Add M3U Playlist</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Raw Text Paste */}
        {activeTab === 'paste' && (
          <form onSubmit={handleSubmitPaste} className="mt-4 space-y-4">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                Playlist Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Custom M3U Channels"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
                Paste M3U Content (#EXTM3U ...)
              </label>
              <textarea
                required
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={'#EXTM3U\n#EXTINF:-1 tvg-id="Sample" group-title="Sports",Sample Sports\nhttps://example.com/stream.m3u8'}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Import M3U Text</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Local File Upload */}
        {activeTab === 'file' && (
          <div className="mt-4 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".m3u,.m3u8,text/plain"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-amber-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-neutral-950/60"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Click to Select M3U / M3U8 File</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                Supports standard <code className="text-amber-400">.m3u</code>, <code className="text-amber-400">.m3u8</code>, or text playlist files from your computer.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
