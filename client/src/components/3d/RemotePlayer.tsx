import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Player } from '../../types.js';
import { CharacterModel } from './CharacterModel.js';
import { spatialAudio } from '../../audio/SpatialAudioManager.js';

interface RemotePlayerProps {
  player: Player;
}

export const RemotePlayer: React.FC<RemotePlayerProps> = ({ player }) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(...player.position));
  const currentRotY = useRef(player.rotationY);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Target from network
    const targetPos = new THREE.Vector3(...player.position);
    const targetRotY = player.rotationY;

    // Smooth interpolation (lerp)
    const factor = Math.min(1, delta * 15);
    currentPos.current.lerp(targetPos, factor);

    // Angular lerp
    let diff = targetRotY - currentRotY.current;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    currentRotY.current += diff * factor;

    groupRef.current.position.copy(currentPos.current);
    groupRef.current.rotation.y = currentRotY.current;

    // Update 3D spatial audio emitter position for this remote player
    spatialAudio.updatePlayerPosition(
      player.id,
      currentPos.current.x,
      currentPos.current.y,
      currentPos.current.z
    );
  });

  return (
    <group ref={groupRef} position={player.position} rotation={[0, player.rotationY, 0]}>
      <CharacterModel
        name={player.name}
        color={player.color}
        animation={player.animation}
        isHost={player.isHost}
        isSpeaking={player.isSpeaking}
        isMuted={player.isMuted}
        isLocal={false}
      />
    </group>
  );
};
