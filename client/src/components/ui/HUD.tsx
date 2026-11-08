import React, { useState } from 'react';
import { Room, Player } from '../../types.js';
import { VoiceState } from '../../audio/LiveKitVoice.js';
import {
  Mic,
  MicOff,
  Tv,
  Users,
  Settings,
  LogOut,
  Copy,
  Check,
  Crown,
  Volume2,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface HUDProps {
  room: Room;
  myId: string;
  voiceState: VoiceState;
  socketConnected: boolean;
  isTheaterMode?: boolean;
  onToggleMic: () => void;
  onOpenScreenControls: () => void;
  onOpenParticipants: () => void;
  onOpenAudioSettings: () => void;
  onLeaveRoom: () => void;
  onCopyInvite: () => void;
  onToggleTheaterMode?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  room,
  myId,
  voiceState,
  socketConnected,
  isTheaterMode = false,
  onToggleMic,
  onOpenScreenControls,
  onOpenParticipants,
  onOpenAudioSettings,
  onLeaveRoom,
  onCopyInvite,
  onToggleTheaterMode,
}) => {
  const [copied, setCopied] = useState(false);
  const localPlayer = room.players[myId];
  const isHost = localPlayer?.isHost ?? false;
  const isSeated = Boolean(localPlayer?.seatedChairId);
  const participantCount = Object.keys(room.players).length;

  const handleCopy = () => {
    onCopyInvite();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 20px',
        boxSizing: 'border-box',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        {/* Left: Cinema Logo & Room Code */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '8px 14px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: socketConnected ? '#10b981' : '#ef4444',
              boxShadow: socketConnected ? '0 0 10px #10b981' : '0 0 10px #ef4444',
            }}
            title={socketConnected ? 'Conectado ao servidor' : 'Desconectado'}
          />

          <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.2px' }}>
            {room.name || `Cinema #${room.code}`}
          </span>

          <button
            onClick={handleCopy}
            title="Copiar link de convite"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              color: '#818cf8',
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 10px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Copiado!' : room.code}</span>
          </button>
        </div>

        {/* Right: Participant Count & Host Badge */}
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isHost && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '12px',
                padding: '6px 12px',
                color: '#facc15',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <Crown size={14} /> Anfitrião
            </div>
          )}

          <button
            onClick={onOpenParticipants}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '8px 14px',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Users size={16} color="#6366f1" />
            <span>{participantCount}</span>
          </button>
        </div>
      </div>

      {/* Center Prompt (when seated) */}
      {isSeated && (
        <div
          style={{
            alignSelf: 'center',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '20px',
            padding: '6px 18px',
            color: '#93c5fd',
            fontSize: '13px',
            fontWeight: 600,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          Você está sentado. Pressione <kbd style={{ background: '#2563eb', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>E</kbd> ou <kbd style={{ background: '#2563eb', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>Espaço</kbd> para levantar.
        </div>
      )}

      {/* Bottom Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        {/* Left: Controls Shortcut Pill */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '8px 14px',
            color: '#94a3b8',
            fontSize: '12px',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span><strong style={{ color: '#fff' }}>WASD:</strong> Mover</span>
          <span>•</span>
          <span><strong style={{ color: '#fff' }}>Mouse:</strong> Olhar</span>
          <span>•</span>
          <span><strong style={{ color: '#fff' }}>E:</strong> Sentar/Levantar</span>
          <span>•</span>
          <span><strong style={{ color: '#fff' }}>Espaço:</strong> Pular</span>
        </div>

        {/* Center: Main Action Buttons */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '8px 14px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Mic Button */}
          <button
            onClick={onToggleMic}
            title={voiceState.isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: voiceState.isMuted ? '#ef4444' : voiceState.isSpeaking ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 14px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: voiceState.isSpeaking ? '0 0 12px #10b981' : 'none',
            }}
          >
            {voiceState.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            <span>{voiceState.isMuted ? 'Mutado' : voiceState.isSpeaking ? 'Falando' : 'Microfone'}</span>
          </button>

          {/* Screen Controls Button */}
          <button
            onClick={onOpenScreenControls}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isHost ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 14px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: isHost ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none',
            }}
          >
            <Tv size={18} />
            <span>Controles do Telão</span>
          </button>

          {/* Theater Mode (Expand Video) Button */}
          {onToggleTheaterMode && (
            <button
              onClick={onToggleTheaterMode}
              title={isTheaterMode ? 'Voltar ao Cinema 3D' : 'Expandir Telão (Modo Cinema Cheio)'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isTheaterMode ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 12px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isTheaterMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              <span>{isTheaterMode ? 'Modo 3D' : 'Expandir'}</span>
            </button>
          )}

          {/* Audio Settings */}
          <button
            onClick={onOpenAudioSettings}
            title="Configurações de Áudio"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '12px',
              padding: '10px',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Right: Exit / Leave Button */}
        <div style={{ pointerEvents: 'auto' }}>
          <button
            onClick={onLeaveRoom}
            title="Sair do Cinema"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '8px 14px',
              color: '#f87171',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
};
