import React from 'react';
import { IptvChannel } from '../../types';
import { INITIAL_IPTV_CHANNELS, ZEE_POPULAR_SHOWS } from '../../data/iptvChannels';
import { Tv, Radio, Play, ChevronRight, Sparkles, Star, Plus, ExternalLink, Film } from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';

interface TvIptvShelfProps {
  onOpenIptvHub: () => void;
  onLaunchChannel: (channel: IptvChannel) => void;
  onAddM3u?: () => void;
}

export const TvIptvShelf: React.FC<TvIptvShelfProps> = ({
  onOpenIptvHub,
  onLaunchChannel,
  onAddM3u,
}) => {
  const featuredZeeChannels = INITIAL_IPTV_CHANNELS.filter((c) => c.isZeeNetwork).slice(0, 4);

  return (
    <div className="bg-gradient-to-r from-purple-950/30 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
      {/* Background subtle purple glow */}
      <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Shelf Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
            <Tv className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold font-display text-white">
                ZEE5 Live TV Channels & Broadcast Hub
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/90 border border-purple-700 text-purple-300 font-bold flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                ZEE5 OFFICIAL
              </span>
              <a
                href="https://www.zee5.com/live-tv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-purple-900 text-purple-300 hover:text-white flex items-center gap-1"
                title="Visit zee5.com/live-tv"
              >
                <span>zee5.com/live-tv</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Stream Zee Cinema HD, Zee TV HD, Zee News, Zee 24 Kalak (Gujarati), Zee Business, and 28+ channels live on Fire TV
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0 flex-wrap">
          <button
            onClick={() => {
              playRemoteSelect();
              onOpenIptvHub();
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/25 active:scale-95"
          >
            <Film className="w-3.5 h-3.5" />
            <span>All 28 ZEE5 Channels</span>
            <ChevronRight className="w-3.5 h-3.5 text-purple-200" />
          </button>

          <button
            onClick={() => {
              playRemoteSelect();
              if (onAddM3u) onAddM3u();
              else onOpenIptvHub();
            }}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add M3U</span>
          </button>
        </div>
      </div>

      {/* Horizontal Carousel of Featured Live ZEE5 Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {featuredZeeChannels.map((chan) => (
          <div
            key={chan.id}
            onClick={() => {
              playRemoteSelect();
              onLaunchChannel(chan);
            }}
            className="group bg-neutral-950/90 border border-neutral-800 rounded-2xl p-4 hover:border-purple-500/80 transition-all cursor-pointer flex flex-col justify-between shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                {chan.logo ? (
                  <img
                    src={chan.logo}
                    alt={chan.name}
                    className="w-9 h-9 rounded-lg object-contain bg-neutral-900 border border-neutral-800 p-0.5"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-purple-400">
                    <Tv className="w-4 h-4" />
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300 font-bold">
                    ZEE5
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-purple-300 transition-colors">
                    {chan.resolution || 'HD'}
                  </span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                {chan.name}
              </h4>

              {chan.currentShow ? (
                <p className="text-[11px] text-amber-300/90 mt-1 line-clamp-1 font-medium">
                  {chan.currentShow}
                </p>
              ) : (
                <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                  {chan.group} · {chan.language}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Broadcast
              </span>

              <span className="text-xs font-semibold text-purple-300 group-hover:text-white flex items-center gap-1">
                <Play className="w-3 h-3 text-purple-400 fill-purple-400" />
                Watch Now
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
