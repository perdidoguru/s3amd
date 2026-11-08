import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface VideoTextureScreenProps {
  url: string;
  playing: boolean;
  currentTime: number;
  volume: number;
  screenWidth: number;
  screenHeight: number;
  onPlayStateChange?: (playing: boolean) => void;
  onTimeUpdate?: (time: number) => void;
}

export const VideoTextureScreen: React.FC<VideoTextureScreenProps> = ({
  url,
  playing,
  currentTime,
  volume,
  screenWidth,
  screenHeight,
  onPlayStateChange,
  onTimeUpdate,
}) => {
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isInternalSeek = useRef(false);

  useEffect(() => {
    if (!url) return;

    // Create an offscreen HTMLVideoElement
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    video.loop = true;
    video.volume = volume;
    videoRef.current = video;

    const videoTex = new THREE.VideoTexture(video);
    videoTex.minFilter = THREE.LinearFilter;
    videoTex.magFilter = THREE.LinearFilter;
    videoTex.format = THREE.RGBAFormat;
    videoTex.colorSpace = THREE.SRGBColorSpace;
    setTexture(videoTex);

    const onTime = () => {
      if (!isInternalSeek.current) {
        onTimeUpdate?.(video.currentTime);
      }
    };

    const onPlay = () => onPlayStateChange?.(true);
    const onPause = () => onPlayStateChange?.(false);

    video.addEventListener('timeupdate', onTime);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    if (playing) {
      video.play().catch(() => {
        // Autoplay policy might require user click; handled gracefully
      });
    }

    return () => {
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.pause();
      video.removeAttribute('src');
      video.load();
      videoTex.dispose();
      videoRef.current = null;
    };
  }, [url]);

  // Sync volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  // Sync play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playing && video.paused) {
      video.play().catch(() => {});
    } else if (!playing && !video.paused) {
      video.pause();
    }
  }, [playing]);

  // Sync seek position
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Math.abs(video.currentTime - currentTime) > 2) {
      isInternalSeek.current = true;
      video.currentTime = currentTime;
      setTimeout(() => {
        isInternalSeek.current = false;
      }, 300);
    }
  }, [currentTime]);

  if (!texture) return null;

  return (
    <mesh position={[0, 0, 0.05]} castShadow receiveShadow>
      <planeGeometry args={[screenWidth, screenHeight]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
};
