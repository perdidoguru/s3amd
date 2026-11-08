import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimationState, Chair } from '../../types.js';
import { CharacterModel } from './CharacterModel.js';
import { spatialAudio } from '../../audio/SpatialAudioManager.js';

interface LocalPlayerProps {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  seatedChairId: string | null;
  chairs: Record<string, Chair>;
  onSit: (chairId: string) => void;
  onStand: () => void;
  onNearChairChange: (chairId: string | null) => void;
  onMovementUpdate: (update: {
    position: [number, number, number];
    rotationY: number;
    animation: AnimationState;
  }) => void;
}

export const LocalPlayer: React.FC<LocalPlayerProps> = ({
  name,
  color,
  isHost,
  isSpeaking,
  isMuted,
  seatedChairId,
  chairs,
  onSit,
  onStand,
  onNearChairChange,
  onMovementUpdate,
}) => {
  const { camera, gl } = useThree();
  const playerRef = useRef<THREE.Group>(null);

  // Position, velocity and state
  const pos = useRef(new THREE.Vector3(0, 0, 7));
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const rotationY = useRef(0);
  const isGrounded = useRef(true);
  const currentAnimation = useRef<AnimationState>('idle');
  const [animState, setAnimState] = useState<AnimationState>('idle');

  // Input states
  const keys = useRef<{ [key: string]: boolean }>({});
  const mouseDrag = useRef(false);
  const cameraAngles = useRef({ theta: Math.PI, phi: 0.35 }); // Initial camera facing forward towards screen (-z)
  const lastSendTime = useRef(0);
  const nearChairIdRef = useRef<string | null>(null);

  // Keyboard handlers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;

      // Handle 'E' or 'Space' to sit / stand
      if (e.code === 'KeyE') {
        if (seatedChairId) {
          onStand();
        } else if (nearChairIdRef.current) {
          onSit(nearChairIdRef.current);
        }
      }

      if (e.code === 'Space' && seatedChairId) {
        onStand();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [seatedChairId, onSit, onStand]);

  // Mouse look controls (orbit drag)
  useEffect(() => {
    const canvas = gl.domElement;

    const onMouseDown = (e: MouseEvent) => {
      // Allow dragging camera with left or right click
      if (e.button === 0 || e.button === 2) {
        mouseDrag.current = true;
      }
    };

    const onMouseUp = () => {
      mouseDrag.current = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseDrag.current) return;
      const sensitivity = 0.0035;
      cameraAngles.current.theta -= e.movementX * sensitivity;
      cameraAngles.current.phi = Math.max(
        0.05,
        Math.min(Math.PI / 2.3, cameraAngles.current.phi + e.movementY * sensitivity)
      );
    };

    const onWheel = (e: WheelEvent) => {
      // Zoom in/out slightly if needed
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [gl]);

  // Frame loop
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);

    // 1. If seated, lock to chair position and orientation
    if (seatedChairId && chairs[seatedChairId]) {
      const chair = chairs[seatedChairId];
      pos.current.set(chair.position[0], chair.position[1], chair.position[2]);
      rotationY.current = chair.rotationY;

      if (currentAnimation.current !== 'sitting') {
        currentAnimation.current = 'sitting';
        setAnimState('sitting');
      }

      if (playerRef.current) {
        playerRef.current.position.copy(pos.current);
        playerRef.current.rotation.y = rotationY.current;
      }

      // Camera while seated: smooth panoramic view towards cinema screen
      const camDist = 3.2;
      const theta = cameraAngles.current.theta;
      const phi = cameraAngles.current.phi;

      const targetCamPos = new THREE.Vector3(
        pos.current.x + camDist * Math.sin(theta) * Math.cos(phi),
        pos.current.y + 1.2 + camDist * Math.sin(phi),
        pos.current.z + camDist * Math.cos(theta) * Math.cos(phi)
      );

      camera.position.lerp(targetCamPos, 0.1);
      camera.lookAt(pos.current.x, pos.current.y + 1.3, pos.current.z - 2.0);

      // Update spatial audio listener
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      spatialAudio.updateListener(
        camera.position.x,
        camera.position.y,
        camera.position.z,
        camDir.x,
        camDir.y,
        camDir.z
      );

      // Send sitting state update periodically
      const now = performance.now();
      if (now - lastSendTime.current > 100) {
        lastSendTime.current = now;
        onMovementUpdate({
          position: [pos.current.x, pos.current.y, pos.current.z],
          rotationY: rotationY.current,
          animation: 'sitting',
        });
      }

      return;
    }

    // 2. Walking & Movement logic
    const moveDir = new THREE.Vector3();
    const forward = new THREE.Vector3(Math.sin(cameraAngles.current.theta), 0, Math.cos(cameraAngles.current.theta));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    if (keys.current['KeyW'] || keys.current['ArrowUp']) moveDir.sub(forward);
    if (keys.current['KeyS'] || keys.current['ArrowDown']) moveDir.add(forward);
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveDir.sub(right);
    if (keys.current['KeyD'] || keys.current['ArrowRight']) moveDir.add(right);

    const isMoving = moveDir.lengthSq() > 0.001;
    const isSprinting = keys.current['ShiftLeft'] || keys.current['ShiftRight'];
    const speed = isSprinting ? 6.2 : 3.8;

    if (isMoving) {
      moveDir.normalize();
      pos.current.addScaledVector(moveDir, speed * dt);

      // Turn character towards direction of movement
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      // Smooth angular interpolation
      let diff = targetAngle - rotationY.current;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      rotationY.current += diff * Math.min(1, 14 * dt);
    }

    // Jump & Gravity
    if (keys.current['Space'] && isGrounded.current) {
      velocity.current.y = 5.2;
      isGrounded.current = false;
    }

    if (!isGrounded.current) {
      velocity.current.y -= 16.0 * dt; // gravity
      pos.current.y += velocity.current.y * dt;
      if (pos.current.y <= 0) {
        pos.current.y = 0;
        velocity.current.y = 0;
        isGrounded.current = true;
      }
    }

    // Courtyard boundaries collision
    pos.current.x = Math.max(-12.5, Math.min(12.5, pos.current.x));
    pos.current.z = Math.max(-11.5, Math.min(12.5, pos.current.z));

    // Prevent walking into screen stage
    if (pos.current.z < -11.0 && Math.abs(pos.current.x) < 8.5) {
      pos.current.z = -11.0;
    }

    // Determine current animation
    let newAnim: AnimationState = 'idle';
    if (!isGrounded.current) {
      newAnim = 'jump';
    } else if (isMoving) {
      newAnim = 'walk';
    }

    if (currentAnimation.current !== newAnim) {
      currentAnimation.current = newAnim;
      setAnimState(newAnim);
    }

    if (playerRef.current) {
      playerRef.current.position.copy(pos.current);
      playerRef.current.rotation.y = rotationY.current;
    }

    // Third-person camera follow
    const camDist = 4.2;
    const theta = cameraAngles.current.theta;
    const phi = cameraAngles.current.phi;

    const targetCamPos = new THREE.Vector3(
      pos.current.x + camDist * Math.sin(theta) * Math.cos(phi),
      pos.current.y + 1.6 + camDist * Math.sin(phi),
      pos.current.z + camDist * Math.cos(theta) * Math.cos(phi)
    );

    camera.position.lerp(targetCamPos, 0.15);
    camera.lookAt(pos.current.x, pos.current.y + 1.2, pos.current.z);

    // Update Web Audio API listener position & direction
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    spatialAudio.updateListener(
      camera.position.x,
      camera.position.y,
      camera.position.z,
      camDir.x,
      camDir.y,
      camDir.z
    );

    // Proximity check for unoccupied chairs (< 1.6m)
    let closestChairId: string | null = null;
    let closestDistSq = 2.56; // 1.6^2

    Object.values(chairs).forEach((c) => {
      if (!c.occupiedBy) {
        const dx = c.position[0] - pos.current.x;
        const dz = c.position[2] - pos.current.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestChairId = c.id;
        }
      }
    });

    if (closestChairId !== nearChairIdRef.current) {
      nearChairIdRef.current = closestChairId;
      onNearChairChange(closestChairId);
    }

    // Send movement sync update to server at 25Hz (every 40ms)
    const now = performance.now();
    if (now - lastSendTime.current > 40) {
      lastSendTime.current = now;
      onMovementUpdate({
        position: [pos.current.x, pos.current.y, pos.current.z],
        rotationY: rotationY.current,
        animation: currentAnimation.current,
      });
    }
  });

  return (
    <group ref={playerRef} position={[0, 0, 7]}>
      <CharacterModel
        name={name}
        color={color}
        animation={animState}
        isHost={isHost}
        isSpeaking={isSpeaking}
        isMuted={isMuted}
        isLocal={true}
      />
    </group>
  );
};
