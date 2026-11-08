import React from 'react';
import { Html } from '@react-three/drei';
import { Chair } from '../../types.js';

interface ChairsProps {
  chairs: Record<string, Chair>;
  seatedChairId: string | null;
  nearChairId: string | null;
  onSit: (chairId: string) => void;
  onStand: () => void;
}

export const Chairs: React.FC<ChairsProps> = ({
  chairs,
  seatedChairId,
  nearChairId,
  onSit,
  onStand,
}) => {
  // Tiered platform risers underneath rows
  const tierPlatforms = [
    { row: 1, z: -5, y: 0.05, h: 0.1 },
    { row: 2, z: -2, y: 0.175, h: 0.35 },
    { row: 3, z: 1, y: 0.3, h: 0.6 },
    { row: 4, z: 4, y: 0.425, h: 0.85 },
  ];

  return (
    <group>
      {/* Tiered wooden/carpet floor steps */}
      {tierPlatforms.map((tier) => (
        <mesh
          key={`tier-${tier.row}`}
          position={[0, tier.y, tier.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[14, tier.h, 2.2]} />
          <meshStandardMaterial color="#1e1e24" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}

      {/* Render Individual Chairs */}
      {Object.values(chairs).map((chair) => {
        const isOccupied = Boolean(chair.occupiedBy);
        const isMySeat = seatedChairId === chair.id;
        const isNear = nearChairId === chair.id && !isOccupied && !seatedChairId;

        return (
          <group
            key={chair.id}
            position={chair.position}
            rotation={[0, chair.rotationY, 0]}
          >
            {/* Chair Base / Metal Pedestal */}
            <mesh position={[0, 0.2, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.12, 0.4, 8]} />
              <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Seat Cushion (Cinema Velvet) */}
            <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.65, 0.12, 0.65]} />
              <meshStandardMaterial
                color={isNear ? '#be123c' : '#881337'}
                roughness={0.8}
                metalness={0.1}
              />
            </mesh>

            {/* Backrest */}
            <mesh position={[0, 0.85, 0.28]} rotation={[-0.1, 0, 0]} castShadow>
              <boxGeometry args={[0.65, 0.8, 0.12]} />
              <meshStandardMaterial
                color={isNear ? '#be123c' : '#881337'}
                roughness={0.8}
                metalness={0.1}
              />
            </mesh>

            {/* Headrest */}
            <mesh position={[0, 1.3, 0.32]} rotation={[-0.1, 0, 0]} castShadow>
              <boxGeometry args={[0.45, 0.22, 0.12]} />
              <meshStandardMaterial color="#4c0519" roughness={0.7} />
            </mesh>

            {/* Left Armrest with cup holder */}
            <mesh position={[-0.38, 0.6, 0.05]} castShadow>
              <boxGeometry args={[0.09, 0.06, 0.55]} />
              <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.4} />
            </mesh>

            {/* Right Armrest with cup holder */}
            <mesh position={[0.38, 0.6, 0.05]} castShadow>
              <boxGeometry args={[0.09, 0.06, 0.55]} />
              <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.4} />
            </mesh>

            {/* Interactive 3D Prompt: "[E] Sentar" */}
            {isNear && (
              <Html center position={[0, 1.1, 0]} distanceFactor={10}>
                <button
                  onClick={() => onSit(chair.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1.5px solid #ec4899',
                    borderRadius: '20px',
                    color: '#fff',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 0 16px rgba(236, 72, 153, 0.5)',
                    backdropFilter: 'blur(8px)',
                    animation: 'bounce 1s infinite alternate',
                  }}
                >
                  <kbd
                    style={{
                      background: '#ec4899',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  >
                    E
                  </kbd>
                  Sentar
                </button>
              </Html>
            )}

            {/* Interactive 3D Prompt when player is in this seat: "[E] Levantar" */}
            {isMySeat && (
              <Html center position={[0, 1.3, 0]} distanceFactor={10}>
                <button
                  onClick={onStand}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1.5px solid #3b82f6',
                    borderRadius: '20px',
                    color: '#fff',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 0 16px rgba(59, 130, 246, 0.5)',
                  }}
                >
                  <kbd
                    style={{
                      background: '#3b82f6',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  >
                    E
                  </kbd>
                  Levantar
                </button>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};
