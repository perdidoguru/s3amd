import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Room,
  Player,
  MediaState,
  AnimationState,
  ToastMessage,
  ServerToClientEvents,
  ClientToServerEvents,
} from './types.js';
import { CinemaScene } from './components/3d/CinemaScene.js';
import { LobbyModal } from './components/ui/LobbyModal.js';
import { HUD } from './components/ui/HUD.js';
import { ScreenControlModal } from './components/ui/ScreenControlModal.js';
import { ParticipantListModal } from './components/ui/ParticipantListModal.js';
import { AudioSettingsModal } from './components/ui/AudioSettingsModal.js';
import { ToastContainer } from './components/ui/Toast.js';
import { voiceManager, VoiceState } from './audio/LiveKitVoice.js';
import { spatialAudio } from './audio/SpatialAudioManager.js';

export const App: React.FC = () => {
  // State
  const [inLobby, setInLobby] = useState(true);
  const [room, setRoom] = useState<Room | null>(null);
  const [myId, setMyId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('Visitante');
  const [playerColor, setPlayerColor] = useState<string>('#6366f1');
  const [socketConnected, setSocketConnected] = useState(false);

  // Audio & Modals
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isConnected: false,
    isMuted: false,
    isSpeaking: false,
    hasPermission: false,
    error: null,
    usingFallback: false,
  });
  const [screenVolume, setScreenVolume] = useState(0.85);
  const [masterVoiceVolume, setMasterVoiceVolume] = useState(1.0);
  const [isPushToTalk, setIsPushToTalk] = useState(false);

  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  // Monitor browser pointer lock state
  useEffect(() => {
    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement !== null);
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  const handleTogglePointerLock = useCallback(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    } else {
      const canvas = document.querySelector('canvas');
      canvas?.requestPointerLock?.();
    }
  }, []);

  // Release pointer lock when opening dialogs or returning to lobby
  useEffect(() => {
    if (isScreenModalOpen || isParticipantsOpen || isAudioSettingsOpen || inLobby) {
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    }
  }, [isScreenModalOpen, isParticipantsOpen, isAudioSettingsOpen, inLobby]);

  // Helper to show toasts
  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Listen to voice state & speaking events
  useEffect(() => {
    const unsubscribeVoice = voiceManager.onStateChange(setVoiceState);
    const unsubscribeSpeaking = voiceManager.onSpeakingChange((isSpeaking) => {
      if (socketRef.current && room) {
        socketRef.current.emit('player:speaking', { isSpeaking });
      }
    });

    return () => {
      unsubscribeVoice();
      unsubscribeSpeaking();
    };
  }, [room]);

  // Push to talk keyboard listener (key 'V')
  useEffect(() => {
    if (!isPushToTalk) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyV' && !e.repeat) {
        voiceManager.startPushing();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyV') {
        voiceManager.stopPushing();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPushToTalk]);

  // Join Room Handler
  const handleJoinLobby = (data: {
    playerName: string;
    color: string;
    code?: string;
    createPrivate?: boolean;
  }) => {
    spatialAudio.init();

    setPlayerName(data.playerName);
    setPlayerColor(data.color);

    // Initialize Socket.io connection (in production uses same origin, in dev uses proxy or port 3001)
    const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('room:join', {
        playerName: data.playerName,
        color: data.color,
        code: data.code,
        createPrivate: data.createPrivate,
      });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      addToast('Conexão perdida. Tentando reconectar...', 'warning');
    });

    socket.on('room:joined', async ({ room: joinedRoom, myId: assignedId, livekitToken, livekitUrl }) => {
      setRoom(joinedRoom);
      setMyId(assignedId);
      setInLobby(false);

      // Update URL query with room code so user can copy URL easily
      const url = new URL(window.location.href);
      url.searchParams.set('room', joinedRoom.code);
      window.history.replaceState({}, '', url.toString());

      addToast(`Você entrou na sala ${joinedRoom.code}!`, 'success');

      // Connect to LiveKit WebRTC Voice
      await voiceManager.connect(livekitUrl, livekitToken);
    });

    socket.on('room:error', ({ message }) => {
      addToast(message, 'error');
    });

    socket.on('player:joined', (newPlayer: Player) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [newPlayer.id]: newPlayer,
          },
        };
      });
      addToast(`${newPlayer.name} entrou no cinema.`, 'info');
    });

    socket.on('player:left', ({ playerId, newHostId }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const leftPlayer = prev.players[playerId];
        const updatedPlayers = { ...prev.players };
        delete updatedPlayers[playerId];

        // Also free any chair they had
        const updatedChairs = { ...prev.chairs };
        Object.values(updatedChairs).forEach((c) => {
          if (c.occupiedBy === playerId) c.occupiedBy = null;
        });

        if (leftPlayer) {
          addToast(`${leftPlayer.name} saiu do cinema.`, 'info');
        }

        return {
          ...prev,
          hostId: newHostId || prev.hostId,
          players: updatedPlayers,
          chairs: updatedChairs,
        };
      });
      spatialAudio.detachRemoteStream(playerId);
    });

    // Batch movement sync from server (25Hz)
    socket.on('players:update', (updates) => {
      setRoom((prev) => {
        if (!prev) return prev;
        let changed = false;
        const updatedPlayers = { ...prev.players };

        Object.entries(updates).forEach(([pid, update]) => {
          if (updatedPlayers[pid] && pid !== assignedIdRef.current) {
            updatedPlayers[pid] = {
              ...updatedPlayers[pid],
              position: update.position,
              rotationY: update.rotationY,
              animation: update.animation,
              isSpeaking: update.isSpeaking ?? updatedPlayers[pid].isSpeaking,
            };
            changed = true;
          }
        });

        return changed ? { ...prev, players: updatedPlayers } : prev;
      });
    });

    socket.on('chair:occupied', ({ chairId, playerId }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const chair = prev.chairs[chairId];
        const occupant = prev.players[playerId];
        if (chair) {
          chair.occupiedBy = playerId;
        }
        if (occupant) {
          occupant.seatedChairId = chairId;
          occupant.animation = 'sitting';
        }
        return { ...prev };
      });

      if (playerId === socket.id) {
        addToast('Você sentou na cadeira.', 'info');
      }
    });

    socket.on('chair:freed', ({ chairId }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const chair = prev.chairs[chairId];
        if (chair) {
          const occupantId = chair.occupiedBy;
          chair.occupiedBy = null;
          if (occupantId && prev.players[occupantId]) {
            prev.players[occupantId].seatedChairId = null;
            prev.players[occupantId].animation = 'idle';
          }
        }
        return { ...prev };
      });
    });

    socket.on('media:updated', (mediaState) => {
      setRoom((prev) => (prev ? { ...prev, mediaState } : prev));
    });

    socket.on('host:changed', ({ hostId }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, hostId };
        Object.values(updated.players).forEach((p) => {
          p.isHost = p.id === hostId;
        });
        return updated;
      });
      if (hostId === socket.id) {
        addToast('Você agora é o anfitrião do cinema!', 'success');
      }
    });

    socket.on('speaking:update', ({ playerId, isSpeaking }) => {
      setRoom((prev) => {
        if (!prev || !prev.players[playerId]) return prev;
        const player = { ...prev.players[playerId], isSpeaking };
        return {
          ...prev,
          players: { ...prev.players, [playerId]: player },
        };
      });
    });
  };

  const assignedIdRef = useRef('');
  assignedIdRef.current = myId;

  // Sit & Stand actions
  const handleSit = useCallback((chairId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('chair:sit', { chairId });
    }
  }, []);

  const handleStand = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('chair:stand');
    }
  }, []);

  // Movement broadcast
  const handleMovementUpdate = useCallback(
    (update: { position: [number, number, number]; rotationY: number; animation: AnimationState }) => {
      if (socketRef.current) {
        socketRef.current.emit('player:move', update);
      }
    },
    []
  );

  // Media controls
  const handleUpdateMedia = (update: Partial<MediaState>) => {
    if (socketRef.current) {
      socketRef.current.emit('media:update', update);
    }
  };

  const handlePlayStateChange = (playing: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit('media:update', { playing });
    }
  };

  const handleTimeUpdate = (time: number) => {
    if (socketRef.current && room?.players[myId]?.isHost) {
      socketRef.current.emit('media:update', { currentTime: time });
    }
  };

  // Toggle Mic
  const handleToggleMic = () => {
    const isNowMuted = voiceManager.toggleMute();
    if (socketRef.current) {
      socketRef.current.emit('player:mute', { isMuted: isNowMuted });
    }
  };

  // Leave room
  const handleLeaveRoom = () => {
    voiceManager.disconnect();
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setRoom(null);
    setInLobby(true);

    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  };

  // Copy Invite link
  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${room?.code || ''}`;
    navigator.clipboard.writeText(inviteUrl);
    addToast('Link de convite copiado para a área de transferência!', 'success');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', background: '#020617' }}>
      {inLobby || !room ? (
        <LobbyModal onJoin={handleJoinLobby} />
      ) : (
        <>
          {/* Main 3D Cinema Scene */}
          <CinemaScene
            room={room}
            myId={myId}
            localPlayerName={playerName}
            localPlayerColor={playerColor}
            volume={screenVolume}
            isSpeaking={voiceState.isSpeaking}
            isMuted={voiceState.isMuted}
            onSit={handleSit}
            onStand={handleStand}
            onMovementUpdate={handleMovementUpdate}
            onPlayStateChange={handlePlayStateChange}
            onTimeUpdate={handleTimeUpdate}
          />

          {/* Clean HUD Overlay */}
          <HUD
            room={room}
            myId={myId}
            voiceState={voiceState}
            socketConnected={socketConnected}
            isPointerLocked={isPointerLocked}
            onTogglePointerLock={handleTogglePointerLock}
            onToggleMic={handleToggleMic}
            onOpenScreenControls={() => setIsScreenModalOpen(true)}
            onOpenParticipants={() => setIsParticipantsOpen(true)}
            onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
            onLeaveRoom={handleLeaveRoom}
            onCopyInvite={handleCopyInvite}
          />

          {/* Screen Controls Modal */}
          {isScreenModalOpen && (
            <ScreenControlModal
              mediaState={room.mediaState}
              isHost={room.players[myId]?.isHost ?? false}
              localVolume={screenVolume}
              onClose={() => setIsScreenModalOpen(false)}
              onUpdateMedia={handleUpdateMedia}
              onVolumeChange={setScreenVolume}
            />
          )}

          {/* Participants Modal */}
          {isParticipantsOpen && (
            <ParticipantListModal
              players={room.players}
              myId={myId}
              roomCode={room.code}
              onClose={() => setIsParticipantsOpen(false)}
            />
          )}

          {/* Audio Settings Modal */}
          {isAudioSettingsOpen && (
            <AudioSettingsModal
              voiceState={voiceState}
              masterVolume={masterVoiceVolume}
              isPushToTalk={isPushToTalk}
              onClose={() => setIsAudioSettingsOpen(false)}
              onToggleMute={handleToggleMic}
              onTogglePushToTalk={(enabled) => {
                setIsPushToTalk(enabled);
                voiceManager.setPushToTalk(enabled);
              }}
              onMasterVolumeChange={setMasterVoiceVolume}
            />
          )}

          {/* Floating Toast Alerts */}
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </>
      )}
    </div>
  );
};
