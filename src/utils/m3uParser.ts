import { IptvChannel } from '../types';

export interface M3uSourcePreset {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  iconName?: string;
}

export const M3U_SOURCE_PRESETS: M3uSourcePreset[] = [
  {
    id: 'iptv-org-category-index',
    name: 'IPTV-Org Grouped by Category',
    url: 'https://iptv-org.github.io/iptv/index.category.m3u',
    description: 'Channels organized by categories (Sports, News, Movies, Music, Docu, Kids)',
    category: 'Category Index',
  },
  {
    id: 'iptv-org-news',
    name: 'IPTV-Org News Category',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    description: 'Live 24/7 global news channels from around the world',
    category: 'News',
  },
  {
    id: 'iptv-org-sports',
    name: 'IPTV-Org Sports Category',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    description: 'Live sporting events, fitness, extreme sports, cycling, and competitions',
    category: 'Sports',
  },
  {
    id: 'iptv-org-movies',
    name: 'IPTV-Org Movies Category',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    description: 'Cinema, blockbusters, action, drama, and film broadcast streams',
    category: 'Movies',
  },
  {
    id: 'iptv-org-music',
    name: 'IPTV-Org Music Category',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    description: 'Non-stop EDM, pop, hip-hop, workout beats, and music videos',
    category: 'Music',
  },
  {
    id: 'iptv-org-country-index',
    name: 'IPTV-Org Grouped by Country',
    url: 'https://iptv-org.github.io/iptv/index.country.m3u',
    description: 'Global channels catalogued by country of broadcast origin',
    category: 'Country Index',
  },
  {
    id: 'iptv-org-language-index',
    name: 'IPTV-Org Grouped by Language',
    url: 'https://iptv-org.github.io/iptv/index.language.m3u',
    description: 'Worldwide live streams categorized by audio broadcast language',
    category: 'Language Index',
  },
  {
    id: 'iptv-org-index',
    name: 'IPTV-Org Global Master Index',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    description: 'Official global IPTV-org master playlist with international public streams',
    category: 'Global Master',
  },
];

/**
 * Parses raw M3U / M3U8 string content into an array of IptvChannel objects
 */
export function parseM3uText(
  m3uContent: string,
  maxChannels: number = 300,
  filterGroup?: string
): IptvChannel[] {
  const lines = m3uContent.split(/\r?\n/);
  const channels: IptvChannel[] = [];
  let currentChannel: Partial<IptvChannel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Check if line is #EXTINF metadata
    if (rawLine.startsWith('#EXTINF:')) {
      const extinfContent = rawLine.substring(8);

      // Extract attributes: tvg-id, tvg-name, tvg-logo, group-title
      const tvgIdMatch = extinfContent.match(/tvg-id="([^"]*)"/i);
      const tvgNameMatch = extinfContent.match(/tvg-name="([^"]*)"/i);
      const tvgLogoMatch = extinfContent.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = extinfContent.match(/group-title="([^"]*)"/i);

      // Channel title is after the last comma
      const lastCommaIdx = extinfContent.lastIndexOf(',');
      let channelName = lastCommaIdx !== -1 ? extinfContent.substring(lastCommaIdx + 1).trim() : '';

      if (!channelName && tvgNameMatch) {
        channelName = tvgNameMatch[1];
      }

      currentChannel = {
        id: `chan-${channels.length + 1}-${Date.now().toString(36)}`,
        name: channelName || `Channel ${channels.length + 1}`,
        logo: tvgLogoMatch ? tvgLogoMatch[1] : undefined,
        group: groupMatch ? groupMatch[1] : 'General',
        tvgId: tvgIdMatch ? tvgIdMatch[1] : undefined,
      };
    } else if (!rawLine.startsWith('#')) {
      // It's a stream URL
      if (currentChannel && (rawLine.startsWith('http://') || rawLine.startsWith('https://'))) {
        const streamUrl = rawLine;

        // Apply group filter if present
        if (
          !filterGroup ||
          filterGroup.toLowerCase() === 'all' ||
          (currentChannel.group &&
            currentChannel.group.toLowerCase().includes(filterGroup.toLowerCase()))
        ) {
          channels.push({
            id: currentChannel.id || `chan-${channels.length + 1}`,
            name: currentChannel.name || `Live Stream ${channels.length + 1}`,
            streamUrl,
            logo: currentChannel.logo,
            group: currentChannel.group || 'General',
            tvgId: currentChannel.tvgId,
          });

          if (channels.length >= maxChannels) {
            break;
          }
        }

        currentChannel = null;
      }
    }
  }

  return channels;
}
