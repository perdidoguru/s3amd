import React from 'react';
import { Html } from '@react-three/drei';
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
      {!mediaState.type && (
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[screenWidth, screenHeight]} />
          <meshBasicMaterial color="#020204" />
        </mesh>
      )}

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

      {/* 
        TESTE OBRIGATÓRIO DE OCLUSÃO COM BLENDING (Drei official occlude="blending")
        1. Cubo Vermelho NA FRENTE do telão (z = +2.0m no espaço local = z = -12.0m mundo)
        2. Cubo Azul ATRÁS do telão (z = -2.0m no espaço local = z = -16.0m mundo)
      */}
      {/* 1. CUBO VERMELHO: NA FRENTE DO TELÃO */}
      <mesh position={[-3.0, 0, 2.0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.8, 1.8]} />
        <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* 2. CUBO AZUL: ATRÁS DO TELÃO */}
      <mesh position={[3.0, 0, -2.0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.8, 1.8]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* 
        Drei Official Blending Occlusion:
        <Html transform occlude="blending">
        Integrates HTML elements (including YouTube iframe) natively into WebGL depth buffer.
      */}
      {mediaState.type && (
        <Html
          transform
          occlude="blending"
          position={[0, 0, 0.05]}
          distanceFactor={4.375}
          style={{
            width: '1280px',
            height: '720px',
            userSelect: 'none',
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
