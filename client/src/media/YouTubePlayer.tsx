import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  playing: boolean;
  currentTime: number;
  volume: number;
  isHost: boolean;
  onTimeUpdate?: (time: number) => void;
  onPlayStateChange?: (playing: boolean) => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  playing,
  currentTime,
  volume,
  isHost,
  onPlayStateChange,
}) => {
  const containerId = useRef(`yt-player-${Math.random().toString(36).substring(7)}`);
  const playerRef = useRef<any>(null);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 200);
        return;
      }

      if (!isMounted) return;

      try {
        playerRef.current = new window.YT.Player(containerId.current, {
          width: '100%',
          height: '100%',
          videoId,
          playerVars: {
            autoplay: playing ? 1 : 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              event.target.setVolume(Math.round(volume * 100));
              if (currentTime > 0) {
                event.target.seekTo(currentTime, true);
              }
              if (playing) {
                event.target.playVideo();
              } else {
                event.target.pauseVideo();
              }
            },
            onStateChange: (event: any) => {
              if (isInternalUpdate.current) return;
              // 1: PLAYING, 2: PAUSED
              if (event.data === 1 && onPlayStateChange && isHost) {
                onPlayStateChange(true);
              } else if (event.data === 2 && onPlayStateChange && isHost) {
                onPlayStateChange(false);
              }
            },
          },
        });
      } catch (err) {
        console.warn('Error creating YT.Player:', err);
      }
    };

    initPlayer();

    return () => {
      isMounted = false;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [videoId]);

  // Sync play/pause state from server
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.getPlayerState !== 'function') return;

    try {
      const state = playerRef.current.getPlayerState();
      isInternalUpdate.current = true;
      if (playing && state !== 1) {
        playerRef.current.playVideo();
      } else if (!playing && state === 1) {
        playerRef.current.pauseVideo();
      }
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 500);
    } catch (e) {}
  }, [playing]);

  // Sync seek/drift time
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

    try {
      const current = playerRef.current.getCurrentTime();
      // Only correct if drift exceeds 2.5 seconds
      if (Math.abs(current - currentTime) > 2.5) {
        isInternalUpdate.current = true;
        playerRef.current.seekTo(currentTime, true);
        setTimeout(() => {
          isInternalUpdate.current = false;
        }, 500);
      }
    } catch (e) {}
  }, [currentTime]);

  // Sync volume
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(Math.round(volume * 100));
      } catch (e) {}
    }
  }, [volume]);

  return (
    <div className="screen-media-container" style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>
      <div id={containerId.current} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
    </div>
  );
};
