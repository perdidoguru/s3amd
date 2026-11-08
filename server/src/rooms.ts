import { Chair, MediaState, Player, Room } from './types.js';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  // Map player socket id -> room code
  private playerRooms: Map<string, string> = new Map();

  constructor() {
    // Create a default public room for quick joins
    this.createRoom('MAIN', false, 'Cinema Principal');
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateChairs(): Record<string, Chair> {
    const chairs: Record<string, Chair> = {};
    const rows = [
      { row: 1, z: -5, y: 0.1 },
      { row: 2, z: -2, y: 0.35 }, // tiered seating (slight elevation for great view)
      { row: 3, z: 1, y: 0.6 },
      { row: 4, z: 4, y: 0.85 },
    ];
    const xOffsets = [-5, -3.5, -2, -0.7, 0.7, 2, 3.5, 5];

    rows.forEach(({ row, z, y }) => {
      xOffsets.forEach((x, colIndex) => {
        const id = `chair_r${row}_c${colIndex + 1}`;
        chairs[id] = {
          id,
          row,
          col: colIndex + 1,
          position: [x, y, z],
          // Screen is at z = -14, so looking towards -z
          rotationY: 0,
          occupiedBy: null,
        };
      });
    });

    return chairs;
  }

  public createRoom(code?: string, isPrivate = false, name?: string): Room {
    const roomCode = (code || this.generateRoomCode()).toUpperCase();
    if (this.rooms.has(roomCode)) {
      return this.rooms.get(roomCode)!;
    }

    const defaultMedia: MediaState = {
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      mediaId: 'dQw4w9WgXcQ',
      title: 'Boas-vindas ao Cinema Virtual',
      playing: true,
      currentTime: 0,
      lastSyncTimestamp: Date.now(),
      hostId: '',
    };

    const room: Room = {
      code: roomCode,
      name: name || `Cinema #${roomCode}`,
      hostId: '',
      isPrivate,
      players: {},
      chairs: this.generateChairs(),
      mediaState: defaultMedia,
      createdAt: Date.now(),
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  public getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  public getPlayerRoomCode(playerId: string): string | undefined {
    return this.playerRooms.get(playerId);
  }

  public addPlayer(roomCode: string, player: Player): { room: Room; isNewHost: boolean } {
    let room = this.getRoom(roomCode);
    if (!room) {
      room = this.createRoom(roomCode);
    }

    let isNewHost = false;
    if (!room.hostId || Object.keys(room.players).length === 0) {
      room.hostId = player.id;
      player.isHost = true;
      room.mediaState.hostId = player.id;
      isNewHost = true;
    }

    room.players[player.id] = player;
    this.playerRooms.set(player.id, room.code);

    return { room, isNewHost };
  }

  public removePlayer(playerId: string): { room?: Room; freedChairId?: string; newHostId?: string } {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return {};

    const room = this.rooms.get(roomCode);
    this.playerRooms.delete(playerId);
    if (!room) return {};

    const player = room.players[playerId];
    let freedChairId: string | undefined;

    // Free chair if player was seated
    if (player && player.seatedChairId && room.chairs[player.seatedChairId]) {
      freedChairId = player.seatedChairId;
      room.chairs[freedChairId].occupiedBy = null;
    } else {
      // Safety check all chairs
      for (const [chairId, chair] of Object.entries(room.chairs)) {
        if (chair.occupiedBy === playerId) {
          chair.occupiedBy = null;
          freedChairId = chairId;
          break;
        }
      }
    }

    delete room.players[playerId];

    let newHostId: string | undefined;
    // If host left, assign new host if other players exist
    if (room.hostId === playerId) {
      const remainingIds = Object.keys(room.players);
      if (remainingIds.length > 0) {
        newHostId = remainingIds[0];
        room.hostId = newHostId;
        room.players[newHostId].isHost = true;
        room.mediaState.hostId = newHostId;
      } else {
        room.hostId = '';
      }
    }

    // Clean up empty private rooms after some time (except MAIN)
    if (room.code !== 'MAIN' && Object.keys(room.players).length === 0) {
      this.rooms.delete(room.code);
    }

    return { room, freedChairId, newHostId };
  }

  public sitPlayer(playerId: string, chairId: string): { success: boolean; chair?: Chair; reason?: string } {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return { success: false, reason: 'Player not in room' };

    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, reason: 'Room not found' };

    const chair = room.chairs[chairId];
    if (!chair) return { success: false, reason: 'Chair not found' };

    if (chair.occupiedBy && chair.occupiedBy !== playerId) {
      return { success: false, reason: 'Chair is already occupied' };
    }

    const player = room.players[playerId];
    if (!player) return { success: false, reason: 'Player not found' };

    // If player was in another chair, free it
    if (player.seatedChairId && player.seatedChairId !== chairId) {
      const oldChair = room.chairs[player.seatedChairId];
      if (oldChair) oldChair.occupiedBy = null;
    }

    chair.occupiedBy = playerId;
    player.seatedChairId = chairId;
    player.animation = 'sitting';
    player.position = [...chair.position] as [number, number, number];
    player.rotationY = chair.rotationY;

    return { success: true, chair };
  }

  public standPlayer(playerId: string): { success: boolean; freedChairId?: string } {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return { success: false };

    const room = this.rooms.get(roomCode);
    if (!room) return { success: false };

    const player = room.players[playerId];
    if (!player) return { success: false };

    let freedChairId: string | undefined;
    if (player.seatedChairId && room.chairs[player.seatedChairId]) {
      freedChairId = player.seatedChairId;
      room.chairs[freedChairId].occupiedBy = null;
      player.seatedChairId = null;
      player.animation = 'idle';
      // Shift player slightly forward from seat
      player.position[2] -= 0.5;
    }

    return { success: true, freedChairId };
  }

  public updateMedia(playerId: string, update: Partial<MediaState>): { success: boolean; updatedMedia?: MediaState } {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return { success: false };

    const room = this.rooms.get(roomCode);
    if (!room) return { success: false };

    // Allow host to update media, or first participant if host disconnected
    if (room.hostId && room.hostId !== playerId) {
      return { success: false };
    }

    room.mediaState = {
      ...room.mediaState,
      ...update,
      lastSyncTimestamp: Date.now(),
    };

    return { success: true, updatedMedia: room.mediaState };
  }
}
