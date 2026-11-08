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
  // Character front is +Z, so rotationY = Math.PI starts facing cinema screen (-Z)
  const rotationY = useRef(Math.PI);
  const isGrounded = useRef(true);
  const currentAnimation = useRef<AnimationState>('idle');
  const [animState, setAnimState] = useState<AnimationState>('idle');

  // Input states
  const keys = useRef<{ [key: string]: boolean }>({});
  const mouseDrag = useRef(false);
  // yaw: 0 faces cinema screen (-Z)
  // pitch: <0 looks UP at screen/sky; >0 looks DOWN at ground
  const cameraAngles = useRef({ yaw: 0, pitch: -0.12 });
  // Camera zoom distance (Roblox-style mouse wheel zoom)
  const targetCamDist = useRef(3.6);
  const currentCamDist = useRef(3.6);
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

  // Roblox-style camera controls:
  // Hold mouse button (left or right) to lock and rotate camera smoothly;
  // Releasing the mouse button IMMEDIATELY restores the normal mouse cursor!
  useEffect(() => {
    const canvas = gl.domElement;
    const container = canvas.parentElement || canvas;

    const onMouseDown = (e: MouseEvent) => {
      // 0 = left click, 2 = right click
      if (e.button === 0 || e.button === 2) {
        mouseDrag.current = true;
        try {
          if (document.pointerLockElement !== canvas) {
            canvas.requestPointerLock?.();
          }
        } catch (err) {}
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      mouseDrag.current = false;
      // Immediately release pointer lock so cursor is restored
      if (document.pointerLockElement === canvas) {
        try {
          document.exitPointerLock?.();
        } catch (err) {}
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      // Only rotate camera when mouse button is being held down (like Roblox)
      if (!mouseDrag.current) return;

      const sensitivity = 0.003;
      cameraAngles.current.yaw += e.movementX * sensitivity;
      // Allow pitching UP to -1.15 rad (~ -66 deg) and DOWN to +1.0 rad (~ +57 deg)
      cameraAngles.current.pitch = Math.max(
        -1.15,
        Math.min(1.0, cameraAngles.current.pitch + e.movementY * sensitivity)
      );
    };

    const onContextMenu = (e: MouseEvent) => {
      // Prevent browser context menu when right-clicking to rotate camera (Roblox behavior)
      e.preventDefault();
    };

    const onWheel = (e: WheelEvent) => {
      // Roblox-style camera zoom in/out with mouse wheel
      const zoomSpeed = 0.003;
      targetCamDist.current = Math.max(
        0.2, // First person / eye level view
        Math.min(6.5, targetCamDist.current + e.deltaY * zoomSpeed)
      );
    };

    const onBlur = () => {
      mouseDrag.current = false;
      if (document.pointerLockElement === canvas) {
        try {
          document.exitPointerLock?.();
        } catch (err) {}
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('contextmenu', onContextMenu);
    container.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('blur', onBlur);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('contextmenu', onContextMenu);
      container.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('blur', onBlur);
    };
  }, [gl]);

  // Frame loop
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const yaw = cameraAngles.current.yaw;
    const pitch = cameraAngles.current.pitch;

    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    // View direction vector (yaw = 0 -> facing -Z towards screen, pitch < 0 -> looking UP towards top of screen)
    const viewDir = new THREE.Vector3(
      Math.sin(yaw) * cosPitch,
      -sinPitch,
      -Math.cos(yaw) * cosPitch
    );

    // Smooth camera distance interpolation (Roblox-style zoom)
    const isSeated = Boolean(seatedChairId && chairs[seatedChairId]);
    // When seated, default to eye level view (0.25m) so the screen is completely unobstructed
    const desiredDist = isSeated ? Math.min(targetCamDist.current, 0.25) : targetCamDist.current;
    currentCamDist.current = THREE.MathUtils.lerp(currentCamDist.current, desiredDist, 0.15);

    // Hide local avatar when seated or zoomed into first-person/eye level (< 0.85m)
    // This ensures your own avatar NEVER blocks your view of the cinema screen
    if (playerRef.current) {
      playerRef.current.visible = !isSeated && currentCamDist.current >= 0.85;
    }

    // 1. If seated, lock to chair position and orientation
    if (seatedChairId && chairs[seatedChairId]) {
      const chair = chairs[seatedChairId];
      pos.current.set(chair.position[0], chair.position[1], chair.position[2]);
      // Character model front is +Z. Facing cinema screen (-Z) requires rotationY = Math.PI
      rotationY.current = Math.PI;

      if (currentAnimation.current !== 'sitting') {
        currentAnimation.current = 'sitting';
        setAnimState('sitting');
      }

      if (playerRef.current) {
        playerRef.current.position.copy(pos.current);
        playerRef.current.rotation.y = rotationY.current;
      }

      // Camera while seated: eye level view facing cinema screen (y=1.2m, unobstructed)
      const pivot = new THREE.Vector3(pos.current.x, pos.current.y + 1.2, pos.current.z);
      const targetCamPos = pivot.clone().sub(viewDir.clone().multiplyScalar(currentCamDist.current));
      if (targetCamPos.y < pos.current.y + 0.4) {
        targetCamPos.y = pos.current.y + 0.4;
      }

      camera.position.lerp(targetCamPos, 0.18);
      const lookTarget = camera.position.clone().add(viewDir.clone().multiplyScalar(15));
      camera.lookAt(lookTarget);

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
    const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));

    if (keys.current['KeyW'] || keys.current['ArrowUp']) moveDir.add(forward);
    if (keys.current['KeyS'] || keys.current['ArrowDown']) moveDir.sub(forward);
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveDir.sub(right);
    if (keys.current['KeyD'] || keys.current['ArrowRight']) moveDir.add(right);

    const isMoving = moveDir.lengthSq() > 0.001;
    const isSprinting = keys.current['ShiftLeft'] || keys.current['ShiftRight'];
    const speed = isSprinting ? 6.2 : 3.8;

    if (isMoving) {
      moveDir.normalize();
      pos.current.addScaledVector(moveDir, speed * dt);

      // Turn character towards direction of movement (Character front is +Z)
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

    // Prevent walking into screen stage (stage is at z <= -11.5)
    if (pos.current.z < -9.0 && Math.abs(pos.current.x) < 9.5) {
      pos.current.z = -9.0;
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

    // Roblox-style third-person camera:
    // When looking up towards the elevated screen (pitch < 0, viewDir.y > 0),
    // lift the camera pivot smoothly so the player's head never obstructs the screen.
    const pitchLift = Math.max(0, viewDir.y) * 1.1;
    // Over-the-shoulder subtle offset when in third person to keep crosshairs clear
    const shoulderOffset = new THREE.Vector3(
      Math.cos(yaw) * 0.35 * Math.min(1, currentCamDist.current / 2.5),
      0,
      Math.sin(yaw) * 0.35 * Math.min(1, currentCamDist.current / 2.5)
    );

    const pivot = new THREE.Vector3(
      pos.current.x + shoulderOffset.x,
      pos.current.y + 1.55 + pitchLift,
      pos.current.z + shoulderOffset.z
    );

    const targetCamPos = pivot.clone().sub(viewDir.clone().multiplyScalar(currentCamDist.current));
    // Ground clamp with safety clearance so camera never clips into lawn
    if (targetCamPos.y < 0.55) {
      targetCamPos.y = 0.55;
    }

    camera.position.lerp(targetCamPos, 0.18);
    const lookTarget = camera.position.clone().add(viewDir.clone().multiplyScalar(15));
    camera.lookAt(lookTarget);

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
    <group ref={playerRef} position={[0, 0, 7]} rotation={[0, Math.PI, 0]}>
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
