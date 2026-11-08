import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { MediaState } from '../../types.js';
import { ScreenMediaView } from '../../media/ScreenMediaView.js';

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
  const screenY = 5.4;
  const screenZ = -14.0;

  // Shader material with NoBlending that punches an alpha=0 cutout into the WebGL canvas,
  // allowing the HTML iframe behind it to show through while letting 3D meshes (characters, chairs)
  // in front of the screen occlude the video naturally.
  const occlusionMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        blending: THREE.NoBlending,
        vertexShader: `
          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          void main() {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          }
        `,
      }),
    []
  );

  const occlusionGeometry = useMemo(
    () => new THREE.PlaneGeometry(screenWidth, screenHeight),
    [screenWidth, screenHeight]
  );

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
      {!mediaState.type && (
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[screenWidth, screenHeight]} />
          <meshBasicMaterial color="#020204" />
        </mesh>
      )}

      {/* Cinema Screen Backlight / Ambient Glow (soft blue/violet) */}
      <pointLight position={[0, 0, 1.5]} intensity={1.8} distance={16} color="#6366f1" />

      {/* Screen Support Trusses (Poles extending to ground) */}
      <mesh position={[-6.8, -3.2, -0.3]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 5.5]} />
        <meshStandardMaterial color="#27272a" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[6.8, -3.2, -0.3]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 5.5]} />
        <meshStandardMaterial color="#27272a" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Decorative Cinema Sign on top */}
      <mesh position={[0, screenHeight / 2 + 0.5, 0]}>
        <boxGeometry args={[5, 0.6, 0.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.2} />
      </mesh>
      <pointLight position={[0, screenHeight / 2 + 0.8, 0.5]} intensity={0.8} distance={4} color="#a855f7" />

      {/* HTML Video Player with 3D Depth Occlusion Blending */}
      <Html
        transform
        occlude="blending"
        geometry={occlusionGeometry}
        material={occlusionMaterial}
        position={[0, 0, 0.08]}
        distanceFactor={4.375}
        zIndexRange={[100, 0]}
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
    </group>
  );
};
