import React, { useState, useMemo } from 'react';
import { ZeeShow, IptvChannel } from '../../types';
import { ZEE_POPULAR_SHOWS } from '../../data/iptvChannels';
import {
  Play,
  ExternalLink,
  Film,
  Sparkles,
  Calendar,
  Clock,
  Search,
  Tv,
  CheckCircle,
} from 'lucide-react';
import { playRemoteClick, playRemoteSelect } from '../../utils/soundEffects';

interface ZeeShowsGridProps {
  onPlayShow: (show: ZeeShow) => void;
  onTuneChannel: (channelName: string) => void;
  className?: string;
}

export const ZeeShowsGrid: React.FC<ZeeShowsGridProps> = ({
  onPlayShow,
  onTuneChannel,
  className = '',
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const genres = ['All', 'Hindi Dramas', 'Gujarati & Regional', 'Movies & Premiere', 'Comedy & Music'];

  const filteredShows = useMemo(() => {
    return ZEE_POPULAR_SHOWS.filter((show) => {
      const matchesSearch =
        searchQuery === '' ||
        show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        show.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        show.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        show.language.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesGenre = true;
      if (selectedGenre === 'Hindi Dramas') {
        matchesGenre = show.language === 'Hindi' && (show.genre.includes('Drama') || show.genre.includes('Romantic'));
      } else if (selectedGenre === 'Gujarati & Regional') {
        matchesGenre = show.language !== 'Hindi';
      } else if (selectedGenre === 'Movies & Premiere') {
        matchesGenre = show.genre.includes('Movie') || show.genre.includes('Blockbuster');
      } else if (selectedGenre === 'Comedy & Music') {
        matchesGenre = show.genre.includes('Comedy') || show.genre.includes('Musical');
      }

      return matchesSearch && matchesGenre;
    });
  }, [searchQuery, selectedGenre]);

  return (
    <div className={`space-y-4 select-none ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-950/80 via-neutral-900 to-neutral-900 border border-purple-800/60 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300 font-bold shrink-0 shadow-md">
            <Film className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold font-display text-white">
                ZEE5 Popular Shows, Serials & Cinema
              </h3>
              <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-300 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                OFFICIAL ZEE5 CATALOG
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Watch full episode previews directly in AuraFit TV or launch on{' '}
              <a
                href="https://www.zee5.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline font-semibold"
              >
                zee5.com
              </a>
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Zee shows..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => {
              playRemoteClick();
              setSelectedGenre(g);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
              selectedGenre === g
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30 font-bold'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Grid of Shows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredShows.map((show) => (
          <div
            key={show.id}
            className="group bg-neutral-950/90 border border-neutral-800 hover:border-purple-500/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-purple-500/10 transition-all flex flex-col justify-between"
          >
            {/* Thumbnail with overlay */}
            <div className="relative aspect-video bg-neutral-900 overflow-hidden">
              <img
                src={show.thumbnail}
                alt={show.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />

              {/* Time slot & channel badges */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-purple-950/90 border border-purple-700/80 text-[10px] font-mono font-bold text-purple-300 shadow">
                  {show.channelName}
                </span>
              </div>

              {show.timeSlot && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-neutral-950/80 px-2 py-0.5 rounded border border-neutral-800">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{show.timeSlot}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-3.5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono text-purple-400 font-semibold truncate">
                    {show.genre}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                    {show.language}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                  {show.title}
                </h4>

                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {show.description}
                </p>
              </div>

              {/* Action buttons */}
              <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    playRemoteSelect();
                    onPlayShow(show);
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-purple-600/25"
                  title="Play video preview on TV"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Episode</span>
                </button>

                {show.zee5Url && (
                  <a
                    href={show.zee5Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Watch full episodes on official ZEE5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ZEE5</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
