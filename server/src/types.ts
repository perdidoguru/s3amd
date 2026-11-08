export type AnimationState = 'idle' | 'walk' | 'jump' | 'sitting';

export interface Player {
  id: string;
  name: string;
  color: string;
  position: [number, number, number];
  rotationY: number;
  animation: AnimationState;
  seatedChairId: string | null;
  isSpeaking: boolean;
  isMuted: boolean;
  isHost: boolean;
  joinedAt: number;
}

export type MediaType = 'youtube' | 'twitch' | 'tiktok' | 'custom' | 'none';

export interface MediaState {
  type: MediaType;
  url: string;
  mediaId: string;
  title?: string;
  playing: boolean;
  currentTime: number;
  lastSyncTimestamp: number;
  hostId: string;
}

export interface Chair {
  id: string;
  row: number;
  col: number;
  position: [number, number, number];
  rotationY: number;
  occupiedBy: string | null;
}

export interface Room {
  code: string;
  name: string;
  hostId: string;
  isPrivate: boolean;
  players: Record<string, Player>;
  chairs: Record<string, Chair>;
  mediaState: MediaState;
  createdAt: number;
}

export interface PlayerMovementUpdate {
  position: [number, number, number];
  rotationY: number;
  animation: AnimationState;
  isSpeaking?: boolean;
}

export interface ServerToClientEvents {
  'room:joined': (data: { room: Room; myId: string; livekitToken?: string; livekitUrl?: string }) => void;
  'room:error': (data: { message: string }) => void;
  'player:joined': (player: Player) => void;
  'player:left': (data: { playerId: string; newHostId?: string }) => void;
  'players:update': (updates: Record<string, PlayerMovementUpdate>) => void;
  'chair:occupied': (data: { chairId: string; playerId: string }) => void;
  'chair:freed': (data: { chairId: string }) => void;
  'media:updated': (mediaState: MediaState) => void;
  'host:changed': (data: { hostId: string }) => void;
  'speaking:update': (data: { playerId: string; isSpeaking: boolean }) => void;
}

export interface ClientToServerEvents {
  'room:join': (data: { code?: string; playerName: string; color?: string; createPrivate?: boolean }) => void;
  'room:leave': () => void;
  'player:move': (data: PlayerMovementUpdate) => void;
  'chair:sit': (data: { chairId: string }) => void;
  'chair:stand': () => void;
  'player:speaking': (data: { isSpeaking: boolean }) => void;
  'player:mute': (data: { isMuted: boolean }) => void;
  'media:update': (data: Partial<MediaState>) => void;
  'media:sync_request': () => void;
}
