import React, { useState, useEffect } from 'react';
import { Film, Users, Sparkles, KeyRound } from 'lucide-react';

interface LobbyModalProps {
  onJoin: (data: { playerName: string; color: string; code?: string; createPrivate?: boolean }) => void;
}

const COLOR_PALETTE = [
  { name: 'Índigo Neon', hex: '#6366f1' },
  { name: 'Ciano Cyber', hex: '#06b6d4' },
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Âmbar Dourado', hex: '#f59e0b' },
  { name: 'Rosa Choque', hex: '#ec4899' },
  { name: 'Vermelho Cinema', hex: '#ef4444' },
  { name: 'Violeta Elétrico', hex: '#8b5cf6' },
  { name: 'Safira Noturna', hex: '#3b82f6' },
];

export const LobbyModal: React.FC<LobbyModalProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0].hex);
  const [roomCode, setRoomCode] = useState('');
  const [isCustomRoom, setIsCustomRoom] = useState(false);

  useEffect(() => {
    // Check if URL has ?room=CODE
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('room');
    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
      setIsCustomRoom(true);
    }

    // Load saved nickname if exists
    const savedName = localStorage.getItem('s3amd_name');
    if (savedName) setName(savedName);
  }, []);

  const handleJoin = (createPrivate = false) => {
    const finalName = name.trim() || `Visitante_${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('s3amd_name', finalName);

    onJoin({
      playerName: finalName,
      color,
      code: roomCode ? roomCode.trim().toUpperCase() : undefined,
      createPrivate,
    });
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
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.15)',
          backdropFilter: 'blur(20px)',
          color: '#f8fafc',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Film size={32} color="#fff" />
          </div>
          <h1
            style={{
              margin: '0 0 6px 0',
              fontSize: '28px',
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-0.5px',
              background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Cinema Social 3D
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', lineHeight: 1.4 }}>
            Cinema ao ar livre multiplayer com voz espacial e streaming sincronizado
          </p>
        </div>

        {/* Name input */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
            Seu Apelido no Cinema
          </label>
          <input
            type="text"
            placeholder="Ex: Lucas, Carol, Arthur..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
          />
        </div>

        {/* Color Picker */}
        <div style={{ marginBottom: '26px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
            Cor do seu Personagem
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {COLOR_PALETTE.map((item) => (
              <button
                key={item.hex}
                type="button"
                onClick={() => setColor(item.hex)}
                title={item.name}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: item.hex,
                  border: color === item.hex ? '3px solid #ffffff' : '2px solid transparent',
                  cursor: 'pointer',
                  transform: color === item.hex ? 'scale(1.12)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  boxShadow: color === item.hex ? `0 0 14px ${item.hex}` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Room Code Selection */}
        {isCustomRoom ? (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
              Código da Sala
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Ex: CINE88"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={10}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setIsCustomRoom(false);
                  setRoomCode('');
                }}
                style={{
                  padding: '0 14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#94a3b8',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={() => handleJoin(false)}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: 'none',
              borderRadius: '14px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Users size={18} />
            {roomCode ? `Entrar na Sala ${roomCode}` : 'Entrar no Cinema Principal'}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleJoin(true)}
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#e2e8f0',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)')}
            >
              <Sparkles size={16} color="#a855f7" />
              Criar Sala Privada
            </button>

            {!isCustomRoom && (
              <button
                type="button"
                onClick={() => setIsCustomRoom(true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)')}
              >
                <KeyRound size={16} color="#38bdf8" />
                Digitar Código
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
