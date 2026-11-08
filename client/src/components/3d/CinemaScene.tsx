import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Room, Player, AnimationState } from '../../types.js';
import { Environment } from './Environment.js';
import { Screen } from './Screen.js';
import { Chairs } from './Chairs.js';
import { LocalPlayer } from './LocalPlayer.js';
import { RemotePlayer } from './RemotePlayer.js';

interface CinemaSceneProps {
  room: Room;
  myId: string;
  localPlayerName: string;
  localPlayerColor: string;
  volume: number;
  isSpeaking: boolean;
  isMuted: boolean;
  isCinemaMode?: boolean;
  onSit: (chairId: string) => void;
  onStand: () => void;
  onExitCinemaMode?: () => void;
  onMovementUpdate: (update: {
    position: [number, number, number];
    rotationY: number;
    animation: AnimationState;
  }) => void;
  onPlayStateChange?: (playing: boolean) => void;
  onTimeUpdate?: (time: number) => void;
}

export const CinemaScene: React.FC<CinemaSceneProps> = ({
  room,
  myId,
  localPlayerName,
  localPlayerColor,
  volume,
  isSpeaking,
  isMuted,
  isCinemaMode = false,
  onSit,
  onStand,
  onExitCinemaMode,
  onMovementUpdate,
  onPlayStateChange,
  onTimeUpdate,
}) => {
  const [nearChairId, setNearChairId] = useState<string | null>(null);

  const localPlayer = room.players[myId];
  const isHost = localPlayer?.isHost ?? false;
  const seatedChairId = localPlayer?.seatedChairId ?? null;

  const remotePlayers = Object.values(room.players).filter((p) => p.id !== myId);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        shadows
        camera={{ position: [0, 4, 12], fov: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {/* Environment (Night sky, lawn, courtyard, string lights, perimeter) */}
        <Environment />

        {/* 3D Cinema Screen with HTML media player */}
        <Screen
          mediaState={room.mediaState}
          volume={volume}
          isHost={isHost}
          onPlayStateChange={onPlayStateChange}
          onTimeUpdate={onTimeUpdate}
        />

        {/* Tiered Seating & Interactive Chairs */}
        <Chairs
          chairs={room.chairs}
          seatedChairId={seatedChairId}
          nearChairId={nearChairId}
          onSit={onSit}
          onStand={onStand}
        />

        {/* Local Player with Physics & Third-Person Camera */}
        <LocalPlayer
          id={myId}
          name={localPlayerName}
          color={localPlayerColor}
          isHost={isHost}
          isSpeaking={isSpeaking}
          isMuted={isMuted}
          seatedChairId={seatedChairId}
          chairs={room.chairs}
          isCinemaMode={isCinemaMode}
          onSit={onSit}
          onStand={onStand}
          onExitCinemaMode={onExitCinemaMode}
          onNearChairChange={setNearChairId}
          onMovementUpdate={onMovementUpdate}
        />

        {/* Remote Players with Real-Time Interpolation & Spatial Audio Tracking */}
        {remotePlayers.map((player: Player) => (
          <RemotePlayer key={player.id} player={player} />
        ))}
      </Canvas>
    </div>
  );
};
