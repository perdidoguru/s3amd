// Spatial Audio Manager using Web Audio API with HRTF and 3D PannerNode

interface PlayerAudioNode {
  source: MediaStreamAudioSourceNode;
  panner: PannerNode;
  gain: GainNode;
  stream: MediaStream;
}

export class SpatialAudioManager {
  private static instance: SpatialAudioManager | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private players: Map<string, PlayerAudioNode> = new Map();
  private isMuted: boolean = false;
  private masterVolume: number = 1.0;

  private constructor() {}

  public static getInstance(): SpatialAudioManager {
    if (!SpatialAudioManager.instance) {
      SpatialAudioManager.instance = new SpatialAudioManager();
    }
    return SpatialAudioManager.instance;
  }

  public init(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch((e) => console.warn('Could not auto-resume audio context:', e));
    }

    return this.ctx;
  }

  public ensureRunning(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public updateListener(
    posX: number,
    posY: number,
    posZ: number,
    forwardX: number,
    forwardY: number,
    forwardZ: number,
    upX: number = 0,
    upY: number = 1,
    upZ: number = 0
  ): void {
    if (!this.ctx) return;
    const listener = this.ctx.listener;
    const time = this.ctx.currentTime;

    if (listener.positionX) {
      listener.positionX.setValueAtTime(posX, time);
      listener.positionY.setValueAtTime(posY, time);
      listener.positionZ.setValueAtTime(posZ, time);
      listener.forwardX.setValueAtTime(forwardX, time);
      listener.forwardY.setValueAtTime(forwardY, time);
      listener.forwardZ.setValueAtTime(forwardZ, time);
      listener.upX.setValueAtTime(upX, time);
      listener.upY.setValueAtTime(upY, time);
      listener.upZ.setValueAtTime(upZ, time);
    } else {
      // Legacy fallback for older Web Audio API
      (listener as any).setPosition(posX, posY, posZ);
      (listener as any).setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);
    }
  }

  public attachRemoteStream(playerId: string, stream: MediaStream): void {
    const ctx = this.init();

    // Clean up any existing node for this player
    this.detachRemoteStream(playerId);

    try {
      const source = ctx.createMediaStreamSource(stream);

      // Create HRTF Panner Node for realistic 3D spatialization
      const panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1.8; // Clear conversational audio up to ~2m
      panner.maxDistance = 35.0; // Audio gently drops to silent at cinema perimeter
      panner.rolloffFactor = 1.15;
      panner.coneInnerAngle = 360; // Omnidirectional vocal projection

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.0, ctx.currentTime);

      // Connect graph: Source -> Panner -> Player Gain -> Master Gain -> Destination
      source.connect(panner);
      panner.connect(gain);
      gain.connect(this.masterGain!);

      this.players.set(playerId, { source, panner, gain, stream });
      console.log(`[SpatialAudio] Attached 3D audio stream for player ${playerId}`);
    } catch (err) {
      console.error(`[SpatialAudio] Failed attaching stream for player ${playerId}:`, err);
    }
  }

  public updatePlayerPosition(playerId: string, x: number, y: number, z: number): void {
    const node = this.players.get(playerId);
    if (!node || !this.ctx) return;

    const time = this.ctx.currentTime;
    // Position voice at approx mouth/head level (+1.6m)
    const headY = y + 1.6;

    if (node.panner.positionX) {
      node.panner.positionX.setValueAtTime(x, time);
      node.panner.positionY.setValueAtTime(headY, time);
      node.panner.positionZ.setValueAtTime(z, time);
    } else {
      (node.panner as any).setPosition(x, headY, z);
    }
  }

  public detachRemoteStream(playerId: string): void {
    const node = this.players.get(playerId);
    if (!node) return;

    try {
      node.source.disconnect();
      node.panner.disconnect();
      node.gain.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }

    this.players.delete(playerId);
    console.log(`[SpatialAudio] Detached audio for player ${playerId}`);
  }

  public setPlayerVolume(playerId: string, volume: number): void {
    const node = this.players.get(playerId);
    if (node && this.ctx) {
      const clamped = Math.max(0, Math.min(2, volume));
      node.gain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1.5, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  public toggleMuteAll(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }
}

export const spatialAudio = SpatialAudioManager.getInstance();
