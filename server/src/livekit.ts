import { AccessToken } from 'livekit-server-sdk';

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const livekitUrl = process.env.LIVEKIT_URL;

export async function generateLiveKitToken(roomCode: string, participantId: string, participantName: string): Promise<string | null> {
  if (!apiKey || !apiSecret || !livekitUrl) {
    return null;
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantId,
      name: participantName,
      ttl: '4h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomCode,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return await at.toJwt();
  } catch (err) {
    console.error('Failed to generate LiveKit token:', err);
    return null;
  }
}

export function getLiveKitUrl(): string | null {
  return livekitUrl || null;
}
