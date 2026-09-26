import React from 'react';
import { IptvChannel } from '../../types';
import { INITIAL_IPTV_CHANNELS } from '../../data/iptvChannels';
import { Tv, Radio, Play, ChevronRight, Sparkles, Star, Plus } from 'lucide-react';
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
  return (
    <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
      {/* Background subtle glow */}
      <div className="absolute right-0 top-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Shelf Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold font-display text-white">
                Live IPTV & M3U Sports Broadcasts
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                IPTV-ORG LIVE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                index.m3u
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Stream live sports, fitness channels, global news, and ambient 4K flows during your living room routine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0 flex-wrap">
          <button
            onClick={() => {
              playRemoteSelect();
              if (onAddM3u) onAddM3u();
              else onOpenIptvHub();
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add M3U Playlist</span>
          </button>

          <button
            onClick={() => {
              playRemoteSelect();
              onOpenIptvHub();
            }}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
          >
            <span>Open Channel Guide</span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel of Featured Live Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {INITIAL_IPTV_CHANNELS.slice(0, 4).map((chan) => (
          <div
            key={chan.id}
            onClick={() => {
              playRemoteSelect();
              onLaunchChannel(chan);
            }}
            className="group bg-neutral-950/90 border border-neutral-800 rounded-2xl p-4 hover:border-amber-500/80 transition-all cursor-pointer flex flex-col justify-between shadow-lg hover:shadow-amber-500/10 hover:scale-[1.02]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                {chan.logo ? (
                  <img
                    src={chan.logo}
                    alt={chan.name}
                    className="w-8 h-8 rounded-lg object-contain bg-neutral-900 border border-neutral-800 p-0.5"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400">
                    <Tv className="w-4 h-4" />
                  </div>
                )}

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-amber-300 transition-colors">
                  {chan.resolution || 'HD'}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                {chan.name}
              </h4>
              <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                {chan.group} · {chan.country}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live HLS
              </span>

              <span className="text-xs font-semibold text-neutral-300 group-hover:text-white flex items-center gap-1">
                <Play className="w-3 h-3 text-amber-500 fill-amber-500" />
                Watch Now
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
