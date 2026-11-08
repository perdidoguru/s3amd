import React, { useMemo } from 'react';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

export const Environment: React.FC = () => {
  // Generate random tree positions around perimeter
  const treePositions = useMemo(() => {
    const trees: [number, number, number, number][] = [];
    // Left boundary
    for (let z = -14; z <= 14; z += 3.5) {
      trees.push([-17 + (Math.random() - 0.5) * 2, 0, z + (Math.random() - 0.5) * 2, 0.8 + Math.random() * 0.4]);
    }
    // Right boundary
    for (let z = -14; z <= 14; z += 3.5) {
      trees.push([17 + (Math.random() - 0.5) * 2, 0, z + (Math.random() - 0.5) * 2, 0.8 + Math.random() * 0.4]);
    }
    // Back boundary
    for (let x = -15; x <= 15; x += 3.5) {
      trees.push([x + (Math.random() - 0.5) * 2, 0, 16 + (Math.random() - 0.5) * 2, 0.9 + Math.random() * 0.4]);
    }
    return trees;
  }, []);

  // Fairy string lights across the seating area
  const fairyLights = useMemo(() => {
    const lights: [number, number, number][] = [];
    const rowsZ = [-4, -1, 2, 5];
    rowsZ.forEach((z) => {
      for (let x = -7; x <= 7; x += 2.8) {
        // Sag in the middle of wire
        const sag = Math.sin(((x + 7) / 14) * Math.PI) * 0.5;
        lights.push([x, 3.8 - sag, z]);
      }
    });
    return lights;
  }, []);

  return (
    <group>
      {/* 3D Night Sky Dome with Depth Testing (enables WebGL alpha transparency for screen hole-punching) */}
      <mesh renderOrder={10}>
        <sphereGeometry args={[75, 32, 16]} />
        <meshBasicMaterial color="#050814" side={THREE.BackSide} depthTest={true} depthWrite={false} />
      </mesh>
      <fog attach="fog" args={['#050814', 25, 65]} />
      <Stars radius={80} depth={50} count={3500} factor={4} saturation={0.2} fade speed={1} />

      {/* Lighting */}
      <ambientLight intensity={0.35} color="#4338ca" />
      {/* Soft Moonlight casting gentle shadows */}
      <directionalLight
        position={[25, 45, 20]}
        intensity={0.6}
        color="#c7d2fe"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />

      {/* Main Ground (Lawn) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#142618" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Cinema Courtyard Stone Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#1e222d" roughness={0.8} metalness={0.15} />
      </mesh>

      {/* Stone Pathway leading to seats */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 10]} receiveShadow>
        <planeGeometry args={[3, 8]} />
        <meshStandardMaterial color="#2d3748" roughness={0.7} />
      </mesh>

      {/* Stage platform in front of screen */}
      <mesh position={[0, 0.4, -13.5]} receiveShadow castShadow>
        <boxGeometry args={[18, 0.8, 4]} />
        <meshStandardMaterial color="#18181b" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Warm Stage Uplights */}
      <pointLight position={[-6, 0.9, -12]} intensity={0.8} distance={6} color="#fbbf24" />
      <pointLight position={[6, 0.9, -12]} intensity={0.8} distance={6} color="#fbbf24" />
      <pointLight position={[0, 0.9, -12]} intensity={0.8} distance={6} color="#fbbf24" />

      {/* Fairy String Lights (Varal de lâmpadas decorativas) */}
      {/* Light poles */}
      <mesh position={[-7.5, 2.2, -4]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 4.4]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      <mesh position={[7.5, 2.2, -4]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 4.4]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      <mesh position={[-7.5, 2.2, 5]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 4.4]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      <mesh position={[7.5, 2.2, 5]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 4.4]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>

      {/* Glowing bulbs */}
      {fairyLights.map((pos, idx) => (
        <group key={`bulb-${idx}`} position={pos}>
          <mesh>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial
              color="#ffeedd"
              emissive="#ffbb44"
              emissiveIntensity={2.5}
              roughness={0.1}
            />
          </mesh>
          {/* Subtle light from alternating bulbs */}
          {idx % 4 === 0 && (
            <pointLight intensity={0.4} distance={4.5} color="#ffaa33" />
          )}
        </group>
      ))}

      {/* Perimeter Fence / Low Wall */}
      {/* Left Wall */}
      <mesh position={[-13.5, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 1.2, 27]} />
        <meshStandardMaterial color="#27272a" roughness={0.8} />
      </mesh>
      {/* Right Wall */}
      <mesh position={[13.5, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 1.2, 27]} />
        <meshStandardMaterial color="#27272a" roughness={0.8} />
      </mesh>
      {/* Back Wall with entrance gap */}
      <mesh position={[-7.5, 0.6, 13.5]} castShadow receiveShadow>
        <boxGeometry args={[11.5, 1.2, 0.5]} />
        <meshStandardMaterial color="#27272a" roughness={0.8} />
      </mesh>
      <mesh position={[7.5, 0.6, 13.5]} castShadow receiveShadow>
        <boxGeometry args={[11.5, 1.2, 0.5]} />
        <meshStandardMaterial color="#27272a" roughness={0.8} />
      </mesh>

      {/* Lantern Pillars at the entrance */}
      <group position={[-1.8, 0, 13.5]}>
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.25, 2]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 2.1, 0]}>
          <boxGeometry args={[0.35, 0.35, 0.35]} />
          <meshStandardMaterial color="#ffeedd" emissive="#f59e0b" emissiveIntensity={2} />
        </mesh>
        <pointLight position={[0, 2.2, 0]} intensity={1.2} distance={8} color="#f59e0b" />
      </group>

      <group position={[1.8, 0, 13.5]}>
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.25, 2]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 2.1, 0]}>
          <boxGeometry args={[0.35, 0.35, 0.35]} />
          <meshStandardMaterial color="#ffeedd" emissive="#f59e0b" emissiveIntensity={2} />
        </mesh>
        <pointLight position={[0, 2.2, 0]} intensity={1.2} distance={8} color="#f59e0b" />
      </group>

      {/* Stylized Pine Trees around perimeter */}
      {treePositions.map(([x, y, z, s], idx) => (
        <group key={`tree-${idx}`} position={[x, y, z]} scale={[s, s, s]}>
          {/* Trunk */}
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.35, 2.4, 6]} />
            <meshStandardMaterial color="#3d2817" roughness={0.9} />
          </mesh>
          {/* Foliage Layers */}
          <mesh position={[0, 2.8, 0]} castShadow>
            <coneGeometry args={[1.8, 2.2, 6]} />
            <meshStandardMaterial color="#1e3a1e" roughness={0.8} />
          </mesh>
          <mesh position={[0, 4.0, 0]} castShadow>
            <coneGeometry args={[1.4, 2.0, 6]} />
            <meshStandardMaterial color="#244724" roughness={0.8} />
          </mesh>
          <mesh position={[0, 5.0, 0]} castShadow>
            <coneGeometry args={[0.9, 1.6, 6]} />
            <meshStandardMaterial color="#2c552c" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
