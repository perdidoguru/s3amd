import React from 'react';
import { X, Volume2, Mic, Radio, Headphones, ShieldCheck, AlertCircle } from 'lucide-react';
import { VoiceState } from '../../audio/LiveKitVoice.js';
import { spatialAudio } from '../../audio/SpatialAudioManager.js';

interface AudioSettingsModalProps {
  voiceState: VoiceState;
  masterVolume: number;
  isPushToTalk: boolean;
  onClose: () => void;
  onToggleMute: () => void;
  onTogglePushToTalk: (enabled: boolean) => void;
  onMasterVolumeChange: (vol: number) => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  voiceState,
  masterVolume,
  isPushToTalk,
  onClose,
  onToggleMute,
  onTogglePushToTalk,
  onMasterVolumeChange,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
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
          padding: '26px',
          color: '#f8fafc',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Headphones size={20} color="#6366f1" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Configurações de Áudio</h2>
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

        {/* Master Voice Volume */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={16} /> Volume Geral das Vozes
            </span>
            <span style={{ fontWeight: 700 }}>{Math.round(masterVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={masterVolume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              spatialAudio.setMasterVolume(val);
              onMasterVolumeChange(val);
            }}
            style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
          />
        </div>

        {/* Push to Talk Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Modo Pressione para Falar (PTT)</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Segure a tecla <kbd style={{ background: '#334155', padding: '1px 5px', borderRadius: '4px' }}>V</kbd> ou botão do mouse para falar
            </div>
          </div>
          <input
            type="checkbox"
            checked={isPushToTalk}
            onChange={(e) => onTogglePushToTalk(e.target.checked)}
            style={{ width: '20px', height: '20px', accentColor: '#6366f1', cursor: 'pointer' }}
          />
        </div>

        {/* Spatial Audio HRTF Details Card */}
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '20px',
            fontSize: '12px',
            lineHeight: 1.5,
            color: '#cbd5e1',
          }}
        >
          <strong style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={15} /> Áudio Espacial 3D (HRTF Ativo)
          </strong>
          <p style={{ margin: '6px 0 0 0' }}>
            O áudio utiliza funções de transferência de cabeça (HRTF) da Web Audio API. Quando você caminha para perto de alguém, a voz se torna nítida; se afasta, diminui suavemente; se virar a cabeça, o som acompanha o ouvido correspondente.
          </p>
        </div>

        {/* LiveKit Connection Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: voiceState.isConnected
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${voiceState.isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            fontSize: '12px',
            color: voiceState.isConnected ? '#10b981' : '#f59e0b',
          }}
        >
          {voiceState.isConnected ? (
            <>
              <ShieldCheck size={16} />
              <span>LiveKit Cloud WebRTC conectado em tempo real</span>
            </>
          ) : (
            <>
              <AlertCircle size={16} />
              <span>{voiceState.error || 'Modo áudio local/fallback ativo'}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
