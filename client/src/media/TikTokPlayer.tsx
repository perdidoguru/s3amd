import React from 'react';
import { ExternalLink, Radio, Video, AlertCircle } from 'lucide-react';

interface TikTokPlayerProps {
  mediaId: string;
  url: string;
}

export const TikTokPlayer: React.FC<TikTokPlayerProps> = ({ mediaId, url }) => {
  const isLive = mediaId.startsWith('live:');
  const channelName = isLive ? mediaId.replace('live:', '') : '';
  const videoId = !isLive && mediaId.startsWith('video:') ? mediaId.replace('video:', '') : mediaId;

  if (isLive) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #010101 0%, #161823 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '24px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(254, 44, 85, 0.2)',
            border: '1px solid #fe2c55',
            color: '#fe2c55',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '16px',
            animation: 'pulse 2s infinite',
          }}
        >
          <Radio size={16} /> TRANSMISSÃO TIKTOK LIVE
        </div>

        <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', fontWeight: 700 }}>
          @{channelName} está ao vivo no TikTok
        </h2>

        <div
          style={{
            maxWidth: '560px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            margin: '16px 0 24px 0',
            fontSize: '13px',
            lineHeight: 1.5,
            color: '#d1d5db',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            textAlign: 'left',
          }}
        >
          <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Aviso de Compatibilidade de Mídia:</strong>
            <p style={{ margin: '4px 0 0 0' }}>
              A plataforma TikTok restringe a reprodução de transmissões <em>LIVE</em> oficiais em iframes embutidos
              de websites externos por diretrizes de segurança (Content Security Policy e frame-ancestors).
            </p>
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#fe2c55',
            color: '#fff',
            textDecoration: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(254, 44, 85, 0.4)',
            transition: 'transform 0.2s, background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <ExternalLink size={18} /> Assistir Transmissão Oficial no TikTok
        </a>
      </div>
    );
  }

  // Regular TikTok Video Post Embed
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#010101',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <iframe
        src={`https://www.tiktok.com/embed/v2/${videoId}?lang=pt-BR`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title="TikTok Embed"
      />
    </div>
  );
};
