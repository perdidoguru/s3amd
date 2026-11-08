import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    Twitch: any;
  }
}

interface TwitchPlayerProps {
  mediaId: string;
  volume: number;
  playing: boolean;
  isHost: boolean;
}

export const TwitchPlayer: React.FC<TwitchPlayerProps> = ({ mediaId, volume, playing }) => {
  const containerId = useRef(`twitch-player-${Math.random().toString(36).substring(7)}`);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const initTwitch = () => {
      if (!window.Twitch || !window.Twitch.Player) {
        setTimeout(initTwitch, 250);
        return;
      }

      if (!isMounted) return;

      const container = document.getElementById(containerId.current);
      if (!container) return;
      container.innerHTML = '';

      const hostname = window.location.hostname || 'localhost';
      const options: any = {
        width: '100%',
        height: '100%',
        parent: [hostname],
        autoplay: playing,
        muted: false,
      };

      if (mediaId.startsWith('channel:')) {
        options.channel = mediaId.replace('channel:', '');
      } else if (mediaId.startsWith('video:')) {
        options.video = mediaId.replace('video:', '');
      } else {
        options.channel = mediaId;
      }

      try {
        const player = new window.Twitch.Player(containerId.current, options);
        playerRef.current = player;

        player.addEventListener(window.Twitch.Player.READY, () => {
          if (!isMounted) return;
          player.setVolume(volume);
          if (playing) {
            player.play();
          } else {
            player.pause();
          }
        });
      } catch (err) {
        console.warn('Twitch embed init error:', err);
      }
    };

    initTwitch();

    return () => {
      isMounted = false;
      playerRef.current = null;
    };
  }, [mediaId]);

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(volume);
      } catch (e) {}
    }
  }, [volume]);

  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (playing && typeof playerRef.current.play === 'function') {
        playerRef.current.play();
      } else if (!playing && typeof playerRef.current.pause === 'function') {
        playerRef.current.pause();
      }
    } catch (e) {}
  }, [playing]);

  return (
    <div className="screen-media-container" style={{ position: 'relative', width: '1280px', height: '720px', background: '#090812' }}>
      <div id={containerId.current} style={{ position: 'absolute', top: 0, left: 0, width: '1280px', height: '720px' }} />
    </div>
  );
};
