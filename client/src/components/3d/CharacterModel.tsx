import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { AnimationState } from '../../types.js';
import { Mic, MicOff, Crown } from 'lucide-react';

interface CharacterModelProps {
  name: string;
  color: string;
  animation: AnimationState;
  isHost?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isLocal?: boolean;
}

export const CharacterModel: React.FC<CharacterModelProps> = ({
  name,
  color,
  animation,
  isHost = false,
  isSpeaking = false,
  isMuted = false,
  isLocal = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  // Procedural animations using useFrame
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Pulse speaking halo
    if (haloRef.current) {
      if (isSpeaking) {
        const scale = 1 + Math.sin(t * 12) * 0.15;
        haloRef.current.scale.set(scale, scale, scale);
      }
    }

    if (animation === 'sitting') {
      // Sitting Pose: thighs forward, calves down, arms on armrests
      if (leftLegRef.current) {
        leftLegRef.current.position.set(-0.16, 0.42, 0.05);
        leftLegRef.current.rotation.set(-Math.PI / 2, 0, 0);
      }
      if (rightLegRef.current) {
        rightLegRef.current.position.set(0.16, 0.42, 0.05);
        rightLegRef.current.rotation.set(-Math.PI / 2, 0, 0);
      }
      if (leftArmRef.current) {
        leftArmRef.current.position.set(-0.35, 0.72, 0.05);
        leftArmRef.current.rotation.set(-0.4, 0, 0.15);
      }
      if (rightArmRef.current) {
        rightArmRef.current.position.set(0.35, 0.72, 0.05);
        rightArmRef.current.rotation.set(-0.4, 0, -0.15);
      }
      if (torsoRef.current) {
        torsoRef.current.position.set(0, 0.45, 0);
        torsoRef.current.rotation.set(0, 0, 0);
      }
      return;
    }

    if (animation === 'walk') {
      // Walking gait cycle
      const walkSpeed = 9;
      const legAngle = Math.sin(t * walkSpeed) * 0.55;
      const armAngle = Math.cos(t * walkSpeed) * 0.45;
      const bob = Math.abs(Math.sin(t * walkSpeed)) * 0.08;

      if (leftLegRef.current) {
        leftLegRef.current.position.set(-0.16, 0.45 + bob, 0);
        leftLegRef.current.rotation.set(legAngle, 0, 0);
      }
      if (rightLegRef.current) {
        rightLegRef.current.position.set(0.16, 0.45 + bob, 0);
        rightLegRef.current.rotation.set(-legAngle, 0, 0);
      }
      if (leftArmRef.current) {
        leftArmRef.current.position.set(-0.35, 0.95 + bob, 0);
        leftArmRef.current.rotation.set(-armAngle, 0, 0);
      }
      if (rightArmRef.current) {
        rightArmRef.current.position.set(0.35, 0.95 + bob, 0);
        rightArmRef.current.rotation.set(armAngle, 0, 0);
      }
      if (torsoRef.current) {
        torsoRef.current.position.set(0, 0.65 + bob, 0);
        torsoRef.current.rotation.set(0.05, 0, 0);
      }
    } else if (animation === 'jump') {
      // Jump pose
      if (leftLegRef.current) {
        leftLegRef.current.rotation.set(0.4, 0, 0);
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.set(0.4, 0, 0);
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.set(-1.2, 0, 0.2);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.set(-1.2, 0, -0.2);
      }
    } else {
      // Idle Breathing
      const breath = Math.sin(t * 2.5) * 0.03;
      if (leftLegRef.current) {
        leftLegRef.current.position.set(-0.16, 0.45, 0);
        leftLegRef.current.rotation.set(0, 0, 0);
      }
      if (rightLegRef.current) {
        rightLegRef.current.position.set(0.16, 0.45, 0);
        rightLegRef.current.rotation.set(0, 0, 0);
      }
      if (leftArmRef.current) {
        leftArmRef.current.position.set(-0.35, 0.95 + breath, 0);
        leftArmRef.current.rotation.set(0.05, 0, 0.05);
      }
      if (rightArmRef.current) {
        rightArmRef.current.position.set(0.35, 0.95 + breath, 0);
        rightArmRef.current.rotation.set(0.05, 0, -0.05);
      }
      if (torsoRef.current) {
        torsoRef.current.position.set(0, 0.65 + breath, 0);
        torsoRef.current.rotation.set(0, 0, 0);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* 3D Floating Nameplate in WebGL for remote players */}
      {!isLocal && (
        <Billboard position={[0, 1.9, 0]}>
          <Text
            fontSize={0.16}
            color={isSpeaking ? '#10b981' : '#ffffff'}
            outlineWidth={0.02}
            outlineColor="#0f172a"
            anchorX="center"
            anchorY="middle"
          >
            {isHost ? `👑 ${name}` : name}
          </Text>
        </Billboard>
      )}

      {/* Speaking Halo Ring */}
      {isSpeaking && (
        <mesh ref={haloRef} position={[0, 1.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.48, 32]} />
          <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Torso & Head Group */}
      <group ref={torsoRef} position={[0, 0.65, 0]}>
        {/* Jacket / Hoodie Body */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.44, 0.48, 0.28]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.6} />
        </mesh>

        {/* Hair Cap / Beanie */}
        <mesh position={[0, 0.68, -0.02]} castShadow>
          <sphereGeometry args={[0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1f2937" roughness={0.8} />
        </mesh>

        {/* Stylized Eyes */}
        <mesh position={[-0.08, 0.62, 0.19]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.08, 0.62, 0.19]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.35, 0.95, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.28, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.35, 0.95, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.28, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.16, 0.45, 0]}>
        <mesh position={[0, -0.24, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.32, 4, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.42, 0.05]} castShadow>
          <boxGeometry args={[0.13, 0.08, 0.22]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.16, 0.45, 0]}>
        <mesh position={[0, -0.24, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.32, 4, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.42, 0.05]} castShadow>
          <boxGeometry args={[0.13, 0.08, 0.22]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
};
