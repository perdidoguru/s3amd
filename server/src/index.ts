import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import {
  ClientToServerEvents,
  ServerToClientEvents,
  Player,
  PlayerMovementUpdate,
} from './types.js';
import { RoomManager } from './rooms.js';
import { generateLiveKitToken, getLiveKitUrl } from './livekit.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin in production)
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const roomManager = new RoomManager();

// Pending updates buffer for 25Hz broadcast loop
const pendingPlayerUpdates: Map<string, Map<string, PlayerMovementUpdate>> = new Map();

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/livekit/config', (req, res) => {
  res.json({
    enabled: Boolean(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET && process.env.LIVEKIT_URL),
    url: getLiveKitUrl(),
  });
});

app.post('/api/livekit/token', async (req, res) => {
  const { roomCode, participantId, participantName } = req.body;
  if (!roomCode || !participantId) {
    return res.status(400).json({ error: 'roomCode and participantId are required' });
  }

  const token = await generateLiveKitToken(roomCode, participantId, participantName || 'Convidado');
  const url = getLiveKitUrl();

  return res.json({ token, url });
});

// Serve static frontend build if present
const clientDistCandidates = [
  path.join(__dirname, '../../client/dist'),
  path.join(__dirname, '../client/dist'),
  path.join(process.cwd(), 'client/dist'),
];

let clientDistPath = clientDistCandidates.find((dir) => fs.existsSync(dir));

if (clientDistPath) {
  console.log(`Serving static client files from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath!, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Cinema Social 3D Server running. Client dist not found (dev mode).');
  });
}

// Socket.IO Logic
io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('room:join', async (data) => {
    try {
      const roomCode = (data.code || (data.createPrivate ? roomManager.generateRoomCode() : 'MAIN')).toUpperCase();
      const playerName = (data.playerName || 'Visitante').trim().slice(0, 24);
      const playerColor = data.color || '#3b82f6';

      const player: Player = {
        id: socket.id,
        name: playerName,
        color: playerColor,
        position: [0, 0, 7], // Spawn area behind rows
        rotationY: 0,
        animation: 'idle',
        seatedChairId: null,
        isSpeaking: false,
        isMuted: false,
        isHost: false,
        joinedAt: Date.now(),
      };

      const { room, isNewHost } = roomManager.addPlayer(roomCode, player);
      socket.join(room.code);

      // Prepare LiveKit token
      const livekitToken = await generateLiveKitToken(room.code, socket.id, playerName);
      const livekitUrl = getLiveKitUrl() || undefined;

      // Reply to joining player
      socket.emit('room:joined', {
        room,
        myId: socket.id,
        livekitToken: livekitToken || undefined,
        livekitUrl,
      });

      // Broadcast to other players in room
      socket.to(room.code).emit('player:joined', player);

      if (isNewHost) {
        io.to(room.code).emit('host:changed', { hostId: socket.id });
      }

      console.log(`[Room ${room.code}] Player ${player.name} (${socket.id}) joined. Total: ${Object.keys(room.players).length}`);
    } catch (err: any) {
      console.error('Error joining room:', err);
      socket.emit('room:error', { message: 'Erro ao entrar na sala.' });
    }
  });

  socket.on('player:move', (data) => {
    const roomCode = roomManager.getPlayerRoomCode(socket.id);
    if (!roomCode) return;

    const room = roomManager.getRoom(roomCode);
    if (!room || !room.players[socket.id]) return;

    const player = room.players[socket.id];
    // If seated, lock position to chair
    if (player.seatedChairId) {
      return;
    }

    player.position = data.position;
    player.rotationY = data.rotationY;
    player.animation = data.animation;
    if (data.isSpeaking !== undefined) {
      player.isSpeaking = data.isSpeaking;
    }

    // Queue for batch tick
    if (!pendingPlayerUpdates.has(roomCode)) {
      pendingPlayerUpdates.set(roomCode, new Map());
    }
    pendingPlayerUpdates.get(roomCode)!.set(socket.id, data);
  });

  socket.on('chair:sit', (data) => {
    const roomCode = roomManager.getPlayerRoomCode(socket.id);
    if (!roomCode) return;

    const result = roomManager.sitPlayer(socket.id, data.chairId);
    if (result.success && result.chair) {
      io.to(roomCode).emit('chair:occupied', {
        chairId: data.chairId,
        playerId: socket.id,
      });
      console.log(`[Room ${roomCode}] Player ${socket.id} sat on ${data.chairId}`);
    } else {
      socket.emit('room:error', { message: result.reason || 'Não foi possível sentar nesta cadeira.' });
    }
  });

  socket.on('chair:stand', () => {
    const roomCode = roomManager.getPlayerRoomCode(socket.id);
    if (!roomCode) return;

    const result = roomManager.standPlayer(socket.id);
    if (result.success && result.freedChairId) {
      io.to(roomCode).emit('chair:freed', {
        chairId: result.freedChairId,
      });
      console.log(`[Room ${roomCode}] Player ${socket.id} stood up from ${result.freedChairId}`);
    }
  });

  socket.on('player:speaking', (data) => {
    const roomCode = roomManager.getPlayerRoomCode(socket.id);
    if (!roomCode) return;

    const room = roomManager.getRoom(roomCode);
    if (room && room.players[socket.id]) {
      room.players[socket.id].isSpeaking = data.isSpeaking;
      socket.to(roomCode).emit('speaking:update', {
        playerId: socket.id,
        isSpeaking: data.isSpeaking,
      });
    }
  });

  socket.on('player:mute', (data) => {
    const roomCode = roomManager.getPlayerRoomCode(socket.id);
    if (!roomCode) return;

    const room = roomManager.getRoom(roomCode);
    if (room && room.players[socket.id]) {
      room.players[socket.id].isMuted = data.isMuted;
    }
  });

  socket.on('media:update', (data) => {
    const roomCode = roomManager.getPlayerRoomCode(socket.id);
    if (!roomCode) return;

    const result = roomManager.updateMedia(socket.id, data);
    if (result.success && result.updatedMedia) {
      io.to(roomCode).emit('media:updated', result.updatedMedia);
      console.log(`[Room ${roomCode}] Media updated:`, result.updatedMedia.type, result.updatedMedia.title);
    }
  });

  socket.on('media:sync_request', () => {
    const roomCode = roomManager.getPlayerRoomCode(socket.id);
    if (!roomCode) return;

    const room = roomManager.getRoom(roomCode);
    if (room) {
      socket.emit('media:updated', room.mediaState);
    }
  });

  socket.on('disconnect', () => {
    const roomCode = roomManager.getPlayerRoomCode(socket.id);
    if (roomCode) {
      const { room, freedChairId, newHostId } = roomManager.removePlayer(socket.id);

      if (freedChairId) {
        io.to(roomCode).emit('chair:freed', { chairId: freedChairId });
      }

      io.to(roomCode).emit('player:left', {
        playerId: socket.id,
        newHostId,
      });

      if (newHostId) {
        io.to(roomCode).emit('host:changed', { hostId: newHostId });
      }

      console.log(`[Socket] Disconnected: ${socket.id} from Room ${roomCode}`);
    }
  });
});

// Periodic batch movement broadcast loop (25 Hz = every 40ms)
setInterval(() => {
  pendingPlayerUpdates.forEach((updates, roomCode) => {
    if (updates.size > 0) {
      const batch: Record<string, PlayerMovementUpdate> = {};
      updates.forEach((update, playerId) => {
        batch[playerId] = update;
      });
      io.to(roomCode).emit('players:update', batch);
      updates.clear();
    }
  });
}, 40);

const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`>>> Cinema Social 3D Server listening on port ${PORT}`);
  console.log(`>>> Environment: ${process.env.NODE_ENV || 'development'}`);
});
