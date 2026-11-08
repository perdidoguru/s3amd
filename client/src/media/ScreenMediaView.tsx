import React from 'react';
import { MediaState } from '../types.js';
import { YouTubePlayer } from './YouTubePlayer.js';
import { TwitchPlayer } from './TwitchPlayer.js';
import { TikTokPlayer } from './TikTokPlayer.js';
import { CustomPlayer } from './CustomPlayer.js';
import { Film } from 'lucide-react';

interface ScreenMediaViewProps {
  mediaState: MediaState;
  volume: number;
  isHost: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  onTimeUpdate?: (time: number) => void;
}

export const ScreenMediaView: React.FC<ScreenMediaViewProps> = ({
  mediaState,
  volume,
  isHost,
  onPlayStateChange,
  onTimeUpdate,
}) => {
  const { type, mediaId, url, playing, currentTime } = mediaState;

  if (type === 'youtube' && mediaId) {
    return (
      <YouTubePlayer
        videoId={mediaId}
        playing={playing}
        currentTime={currentTime}
        volume={volume}
        isHost={isHost}
        onPlayStateChange={onPlayStateChange}
        onTimeUpdate={onTimeUpdate}
      />
    );
  }

  if (type === 'twitch' && mediaId) {
    return (
      <TwitchPlayer
        mediaId={mediaId}
        volume={volume}
        playing={playing}
        isHost={isHost}
      />
    );
  }

  if (type === 'tiktok' && mediaId) {
    return <TikTokPlayer mediaId={mediaId} url={url} />;
  }

  if (type === 'custom' && url) {
    return (
      <CustomPlayer
        url={url}
        playing={playing}
        currentTime={currentTime}
        volume={volume}
        isHost={isHost}
        onPlayStateChange={onPlayStateChange}
      />
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at center, #1e1b4b 0%, #09090b 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a1a1aa',
        fontFamily: 'sans-serif',
      }}
    >
      <Film size={64} color="#6366f1" style={{ marginBottom: '16px', opacity: 0.8 }} />
      <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '20px' }}>Cinema ao Ar Livre</h3>
      <p style={{ margin: 0, fontSize: '14px' }}>
        {isHost ? 'Abra os Controles do Telão no HUD para iniciar um vídeo.' : 'Aguardando o administrador escolher um vídeo...'}
      </p>
    </div>
  );
};
