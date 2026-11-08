import React, { useEffect, useRef } from 'react';

interface CustomPlayerProps {
  url: string;
  playing: boolean;
  currentTime: number;
  volume: number;
  isHost: boolean;
  onPlayStateChange?: (playing: boolean) => void;
}

export const CustomPlayer: React.FC<CustomPlayerProps> = ({
  url,
  playing,
  currentTime,
  volume,
  isHost,
  onPlayStateChange,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [playing]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (Math.abs(videoRef.current.currentTime - currentTime) > 2) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video
        ref={videoRef}
        src={url}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        controls
        playsInline
        onPlay={() => isHost && onPlayStateChange && onPlayStateChange(true)}
        onPause={() => isHost && onPlayStateChange && onPlayStateChange(false)}
      />
    </div>
  );
};
