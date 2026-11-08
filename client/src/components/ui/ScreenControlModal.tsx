import React, { useState } from 'react';
import { MediaState, MediaType } from '../../types.js';
import { parseMediaUrl } from '../../media/urlParser.js';
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  Volume2,
  Tv,
  Radio,
  ExternalLink,
  Crown,
} from 'lucide-react';

interface ScreenControlModalProps {
  mediaState: MediaState;
  isHost: boolean;
  localVolume: number;
  onClose: () => void;
  onUpdateMedia: (update: Partial<MediaState>) => void;
  onVolumeChange: (vol: number) => void;
}

const PRESETS = [
  {
    name: 'Big Buck Bunny (MP4 - Textura 3D Real)',
    type: 'custom' as MediaType,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    id: 'big-buck-bunny-mp4',
  },
  {
    name: 'Tears of Steel (MP4 - Textura 3D Real)',
    type: 'custom' as MediaType,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    id: 'tears-of-steel-mp4',
  },
  {
    name: 'Lofi Girl - Relax & Study (YouTube)',
    type: 'youtube' as MediaType,
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    id: 'jfKfPfyJRdk',
  },
  {
    name: 'Canal Oficial Twitch Gaming (Twitch)',
    type: 'twitch' as MediaType,
    url: 'https://www.twitch.tv/twitchgaming',
    id: 'channel:twitchgaming',
  },
];

export const ScreenControlModal: React.FC<ScreenControlModalProps> = ({
  mediaState,
  isHost,
  localVolume,
  onClose,
  onUpdateMedia,
  onVolumeChange,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;

    const parsed = parseMediaUrl(urlInput.trim());
    if (parsed.type === 'none') {
      setErrorMsg('Endereço de vídeo ou transmissão inválido.');
      return;
    }

    setErrorMsg('');
    onUpdateMedia({
      type: parsed.type,
      mediaId: parsed.mediaId,
      url: parsed.url,
      title: parsed.title,
      playing: true,
      currentTime: 0,
    });
    setUrlInput('');
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    onUpdateMedia({
      type: preset.type,
      mediaId: preset.id,
      url: preset.url,
      title: preset.name,
      playing: true,
      currentTime: 0,
    });
  };

  const handleSeek = (offsetSec: number) => {
    const newTime = Math.max(0, mediaState.currentTime + offsetSec);
    onUpdateMedia({
      currentTime: newTime,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'rgba(23, 23, 28, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '28px',
          color: '#f8fafc',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tv size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Controles do Telão</h2>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {isHost ? 'Você é o anfitrião (controle total)' : 'Modo espectador'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Media Info */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#6366f1', fontWeight: 700, marginBottom: '4px' }}>
            Em exibição agora ({mediaState.type.toUpperCase()})
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {mediaState.title || mediaState.url || 'Nenhum vídeo em exibição'}
          </div>
        </div>

        {/* Host Playback Controls */}
        {isHost ? (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
              Comandos de Reprodução em Tempo Real
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => onUpdateMedia({ playing: !mediaState.playing })}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: mediaState.playing ? '#ef4444' : '#10b981',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {mediaState.playing ? (
                  <>
                    <Pause size={16} /> Pausar para Todos
                  </>
                ) : (
                  <>
                    <Play size={16} /> Reproduzir para Todos
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSeek(-10)}
                title="Voltar 10 segundos"
                style={{
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '13px',
                }}
              >
                <RotateCcw size={16} /> -10s
              </button>

              <button
                type="button"
                onClick={() => handleSeek(10)}
                title="Avançar 10 segundos"
                style={{
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '13px',
                }}
              >
                <RotateCw size={16} /> +10s
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              color: '#facc15',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <Crown size={16} style={{ flexShrink: 0 }} />
            <span>Apenas o anfitrião da sala pode alterar o vídeo e controlar a reprodução do telão.</span>
          </div>
        )}

        {/* Local Cinema Volume */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={16} /> Seu Volume do Telão
            </span>
            <span style={{ fontWeight: 700 }}>{Math.round(localVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={localVolume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
          />
        </div>

        {/* URL Input Form (for Host) */}
        {isHost && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
              Carregar Novo Vídeo ou Transmissão
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Cole link do YouTube, Twitch, TikTok ou MP4..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyUrl()}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                style={{
                  padding: '10px 16px',
                  background: '#6366f1',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Carregar
              </button>
            </div>
            {errorMsg && (
              <span style={{ display: 'block', color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>
                {errorMsg}
              </span>
            )}
          </div>
        )}

        {/* Quick Presets */}
        {isHost && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
              Sugestões Rápidas de Conteúdo
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                >
                  <span>{preset.name}</span>
                  <span style={{ fontSize: '11px', color: '#818cf8', textTransform: 'uppercase' }}>
                    {preset.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
