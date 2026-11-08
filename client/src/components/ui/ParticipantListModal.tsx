import React from 'react';
import { Player } from '../../types.js';
import { X, Users, Crown, Mic, MicOff, Volume2 } from 'lucide-react';
import { spatialAudio } from '../../audio/SpatialAudioManager.js';

interface ParticipantListModalProps {
  players: Record<string, Player>;
  myId: string;
  roomCode: string;
  onClose: () => void;
}

export const ParticipantListModal: React.FC<ParticipantListModalProps> = ({
  players,
  myId,
  roomCode,
  onClose,
}) => {
  const playerList = Object.values(players);

  const handlePlayerVolume = (playerId: string, volume: number) => {
    spatialAudio.setPlayerVolume(playerId, volume);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(23, 23, 28, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '24px',
          color: '#f8fafc',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="#6366f1" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              Participantes ({playerList.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
          Sala: <strong style={{ color: '#fff' }}>{roomCode}</strong> • O volume de cada amigo diminui e muda de lado conforme a posição no cinema 3D.
        </div>

        {/* Players List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
          {playerList.map((player) => {
            const isMe = player.id === myId;

            return (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: isMe ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                  border: isMe ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: player.color,
                      boxShadow: `0 0 8px ${player.color}`,
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{player.name}</span>
                      {player.isHost && <Crown size={14} color="#fbbf24" />}
                      {isMe && <span style={{ fontSize: '11px', color: '#818cf8' }}>(Você)</span>}
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {player.seatedChairId ? 'Sentado assistindo' : 'Explorando o cinema'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {player.isSpeaking ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#10b981',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      <Mic size={14} /> Falando
                    </div>
                  ) : player.isMuted ? (
                    <MicOff size={14} color="#ef4444" />
                  ) : (
                    <Mic size={14} color="#64748b" />
                  )}

                  {!isMe && (
                    <div title="Volume deste participante" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Volume2 size={13} color="#94a3b8" />
                      <input
                        type="range"
                        min={0}
                        max={1.5}
                        step={0.1}
                        defaultValue={1.0}
                        onChange={(e) => handlePlayerVolume(player.id, parseFloat(e.target.value))}
                        style={{ width: '60px', accentColor: '#6366f1' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
