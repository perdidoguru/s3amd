import React from 'react';
import { Html } from '@react-three/drei';
import { MediaState } from '../../types.js';
import { ScreenMediaView } from '../../media/ScreenMediaView.js';
import { VideoTextureScreen } from './VideoTextureScreen.js';

interface ScreenProps {
  mediaState: MediaState;
  volume: number;
  isHost: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  onTimeUpdate?: (time: number) => void;
}

export const Screen: React.FC<ScreenProps> = ({
  mediaState,
  volume,
  isHost,
  onPlayStateChange,
  onTimeUpdate,
}) => {
  // Screen dimensions in 3D units (16:9 ratio)
  const screenWidth = 14;
  const screenHeight = 7.875;
  // Elevated screen height: bottom at 3.66m (2m above standing players' heads for 100% clear sightlines)
  const screenY = 7.6;
  const screenZ = -14.0;

  return (
    <group position={[0, screenY, screenZ]}>
      {/* Outer Metal Screen Frame */}
      <mesh position={[0, 0, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[screenWidth + 0.6, screenHeight + 0.6, 0.4]} />
        <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Inner Screen Bezel / Border */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[screenWidth + 0.1, screenHeight + 0.1, 0.2]} />
        <meshStandardMaterial color="#18181b" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Screen Backplane (Dark backdrop when no media is chosen) */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[screenWidth, screenHeight]} />
        <meshBasicMaterial color="#020204" />
      </mesh>

      {/* Cinema Screen Backlight / Ambient Glow (soft blue/violet) */}
      <pointLight position={[0, 0, 1.8]} intensity={2.2} distance={20} color="#6366f1" />

      {/* Dual Heavy-Duty Steel Truss Columns (extending from ground y=0 up to screen) */}
      <mesh position={[-6.9, -3.8, -0.2]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 7.6, 16]} />
        <meshStandardMaterial color="#27272a" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[6.9, -3.8, -0.2]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 7.6, 16]} />
        <meshStandardMaterial color="#27272a" metalness={0.85} roughness={0.35} />
      </mesh>

      {/* Rear Steel Truss Cross-Beams */}
      <mesh position={[0, -2.5, -0.35]}>
        <boxGeometry args={[14, 0.18, 0.18]} />
        <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, -5.2, -0.35]}>
        <boxGeometry args={[14, 0.18, 0.18]} />
        <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Concert Line Array Speakers (Left & Right towers) */}
      {[-7.35, 7.35].map((x, i) => (
        <group key={`speakers-${i}`} position={[x, -1.2, 0.15]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 1.6, 0.5]} />
            <meshStandardMaterial color="#111827" roughness={0.6} metalness={0.4} />
          </mesh>
          {/* Subwoofers below at stage level */}
          <mesh position={[0, -5.6, 0.2]} castShadow>
            <boxGeometry args={[0.9, 1.2, 0.8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Decorative Cinema Header Sign on top */}
      <mesh position={[0, screenHeight / 2 + 0.5, 0]}>
        <boxGeometry args={[5, 0.6, 0.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.2} />
      </mesh>
      <pointLight position={[0, screenHeight / 2 + 0.8, 0.5]} intensity={0.8} distance={4} color="#a855f7" />

      {/* Native 3D GPU Video Texture Mode (MP4 / WebM / HLS direct streams) */}
      {mediaState.type === 'custom' && (
        <VideoTextureScreen
          url={mediaState.url}
          playing={mediaState.playing}
          currentTime={mediaState.currentTime}
          volume={volume}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          onPlayStateChange={onPlayStateChange}
          onTimeUpdate={onTimeUpdate}
        />
      )}

      {/* Official Platform Player Mode (YouTube, Twitch, TikTok) */}
      {mediaState.type && mediaState.type !== 'custom' && (
        <Html
          transform
          position={[0, 0, 0.08]}
          distanceFactor={4.375}
          zIndexRange={[10, 0]}
          style={{
            width: '1280px',
            height: '720px',
            userSelect: 'none',
            pointerEvents: 'auto',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: '#000',
          }}
        >
          <ScreenMediaView
            mediaState={mediaState}
            volume={volume}
            isHost={isHost}
            onPlayStateChange={onPlayStateChange}
            onTimeUpdate={onTimeUpdate}
          />
        </Html>
      )}
    </group>
  );
};
