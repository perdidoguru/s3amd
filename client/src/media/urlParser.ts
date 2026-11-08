import { MediaType } from '../types.js';

export interface ParsedMedia {
  type: MediaType;
  mediaId: string;
  url: string;
  title?: string;
  isLive?: boolean;
  extraInfo?: string;
}

export function parseMediaUrl(inputUrl: string): ParsedMedia {
  const cleanUrl = inputUrl.trim();
  if (!cleanUrl) {
    return { type: 'none', mediaId: '', url: '' };
  }

  // 1. YouTube
  // Matches: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID, youtube.com/live/ID
  const ytMatch = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      mediaId: ytMatch[1],
      url: cleanUrl,
      title: `YouTube: ${ytMatch[1]}`,
    };
  }

  // 2. Twitch
  // Matches: twitch.tv/username or twitch.tv/videos/12345
  const twitchVideoMatch = cleanUrl.match(/twitch\.tv\/videos\/(\d+)/i);
  if (twitchVideoMatch && twitchVideoMatch[1]) {
    return {
      type: 'twitch',
      mediaId: `video:${twitchVideoMatch[1]}`,
      url: cleanUrl,
      title: `Twitch VOD: ${twitchVideoMatch[1]}`,
    };
  }

  const twitchChannelMatch = cleanUrl.match(/twitch\.tv\/([a-zA-Z0-9_]{3,25})/i);
  if (twitchChannelMatch && twitchChannelMatch[1]) {
    const channel = twitchChannelMatch[1].toLowerCase();
    // Ignore non-channel paths
    if (!['directory', 'p', 'videos', 'settings', 'search'].includes(channel)) {
      return {
        type: 'twitch',
        mediaId: `channel:${channel}`,
        url: cleanUrl,
        title: `Twitch Ao Vivo: ${channel}`,
        isLive: true,
      };
    }
  }

  // 3. TikTok
  // Matches: tiktok.com/@username/video/123456789 or tiktok.com/@username/live
  const tiktokLiveMatch = cleanUrl.match(/tiktok\.com\/@([a-zA-Z0-9._]+)\/live/i);
  if (tiktokLiveMatch && tiktokLiveMatch[1]) {
    return {
      type: 'tiktok',
      mediaId: `live:${tiktokLiveMatch[1]}`,
      url: cleanUrl,
      title: `TikTok LIVE: @${tiktokLiveMatch[1]}`,
      isLive: true,
      extraInfo: 'Aviso: Políticas da TikTok bloqueiam embed de transmissões LIVE em iframes externos. Uma opção para assistir externamente em popout/aba será fornecida.',
    };
  }

  const tiktokVideoMatch = cleanUrl.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|v\/)(\d+)/i);
  if (tiktokVideoMatch && tiktokVideoMatch[1]) {
    return {
      type: 'tiktok',
      mediaId: `video:${tiktokVideoMatch[1]}`,
      url: cleanUrl,
      title: `TikTok: ${tiktokVideoMatch[1]}`,
    };
  }

  // 4. Direct video URL (.mp4, .webm, .m3u8)
  if (cleanUrl.match(/\.(mp4|webm|ogv|m3u8)(\?.*)?$/i)) {
    return {
      type: 'custom',
      mediaId: cleanUrl,
      url: cleanUrl,
      title: 'Vídeo Direto (MP4/WebM)',
    };
  }

  // Default fallback to custom or youtube query
  return {
    type: 'custom',
    mediaId: cleanUrl,
    url: cleanUrl,
    title: 'Fonte Personalizada',
  };
}
