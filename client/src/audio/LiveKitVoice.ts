import {
  Room as LKRoom,
  RoomEvent,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteTrack,
  Track,
} from 'livekit-client';
import { spatialAudio } from './SpatialAudioManager.js';

export interface VoiceState {
  isConnected: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  hasPermission: boolean;
  error: string | null;
  usingFallback: boolean;
}

export class LiveKitVoiceManager {
  private room: LKRoom | null = null;
  private localStream: MediaStream | null = null;
  private isMuted: boolean = false;
  private isPushToTalk: boolean = false;
  private isPushingToTalk: boolean = false;
  private speakingListeners: ((isSpeaking: boolean) => void)[] = [];
  private stateListeners: ((state: VoiceState) => void)[] = [];
  private localAudioAnalyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private state: VoiceState = {
    isConnected: false,
    isMuted: false,
    isSpeaking: false,
    hasPermission: false,
    error: null,
    usingFallback: false,
  };

  private notifyState(): void {
    this.stateListeners.forEach((fn) => fn({ ...this.state }));
  }

  public onStateChange(fn: (state: VoiceState) => void): () => void {
    this.stateListeners.push(fn);
    fn({ ...this.state });
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== fn);
    };
  }

  public onSpeakingChange(fn: (isSpeaking: boolean) => void): () => void {
    this.speakingListeners.push(fn);
    return () => {
      this.speakingListeners = this.speakingListeners.filter((l) => l !== fn);
    };
  }

  public async connect(url?: string, token?: string): Promise<boolean> {
    spatialAudio.init();

    if (!url || !token) {
      console.warn('[LiveKit] No LiveKit URL or token provided. Entering fallback / simulated audio mode.');
      this.state = {
        ...this.state,
        isConnected: false,
        usingFallback: true,
        error: 'LiveKit Cloud não configurado (adicione LIVEKIT_URL, API_KEY e SECRET no .env)',
      };
      this.notifyState();
      // Setup local mic test so player can test microphone locally
      await this.initLocalMicMonitoring();
      return false;
    }

    try {
      this.room = new LKRoom({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.setupRoomEvents();

      await this.room.connect(url, token);
      console.log('[LiveKit] Connected to room:', this.room.name);

      // Enable microphone
      await this.room.localParticipant.setMicrophoneEnabled(!this.isMuted);
      this.state = {
        ...this.state,
        isConnected: true,
        hasPermission: true,
        usingFallback: false,
        error: null,
      };
      this.notifyState();

      this.startLocalVoiceMonitoring();
      return true;
    } catch (err: any) {
      console.error('[LiveKit] Connection failed:', err);
      this.state = {
        ...this.state,
        isConnected: false,
        usingFallback: true,
        error: `Falha na conexão de voz: ${err.message || 'Erro desconhecido'}`,
      };
      this.notifyState();
      await this.initLocalMicMonitoring();
      return false;
    }
  }

  private setupRoomEvents(): void {
    if (!this.room) return;

    this.room
      .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, pub: RemoteTrackPublication, participant: RemoteParticipant) => {
        if (track.kind === Track.Kind.Audio) {
          const mediaStreamTrack = track.mediaStreamTrack;
          if (mediaStreamTrack) {
            const stream = new MediaStream([mediaStreamTrack]);
            spatialAudio.attachRemoteStream(participant.identity, stream);
          }
        }
      })
      .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, pub: RemoteTrackPublication, participant: RemoteParticipant) => {
        if (track.kind === Track.Kind.Audio) {
          spatialAudio.detachRemoteStream(participant.identity);
        }
      })
      .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        spatialAudio.detachRemoteStream(participant.identity);
      })
      .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        if (this.room) {
          const isLocalSpeaking = speakers.some((s) => s.identity === this.room?.localParticipant.identity);
          if (isLocalSpeaking !== this.state.isSpeaking) {
            this.state.isSpeaking = isLocalSpeaking;
            this.notifyState();
            this.speakingListeners.forEach((fn) => fn(isLocalSpeaking));
          }
        }
      })
      .on(RoomEvent.Disconnected, () => {
        console.log('[LiveKit] Disconnected from room');
        this.state = { ...this.state, isConnected: false };
        this.notifyState();
      });
  }

  // Local microphone volume detection (works in both LiveKit and fallback mode)
  public async initLocalMicMonitoring(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.localStream = stream;
      this.state.hasPermission = true;
      this.notifyState();

      const audioCtx = spatialAudio.init();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      this.localAudioAnalyser = analyser;

      this.startVoiceThresholdLoop();
    } catch (err: any) {
      console.warn('[Voice] Microphone access denied or unavailable:', err);
      this.state.hasPermission = false;
      this.notifyState();
    }
  }

  private startLocalVoiceMonitoring(): void {
    if (!this.localAudioAnalyser) {
      this.initLocalMicMonitoring();
    }
  }

  private startVoiceThresholdLoop(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const dataArray = new Uint8Array(256);
    let speakingFrames = 0;

    const checkVolume = () => {
      if (this.localAudioAnalyser) {
        this.localAudioAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;

        // If muted or push-to-talk not active, don't trigger speaking
        const shouldBeActive = !this.isMuted && (!this.isPushToTalk || this.isPushingToTalk);
        const isSpeaking = shouldBeActive && avg > 14;

        if (isSpeaking) {
          speakingFrames = Math.min(speakingFrames + 1, 10);
        } else {
          speakingFrames = Math.max(speakingFrames - 1, 0);
        }

        const currentlySpeaking = speakingFrames > 2;
        if (currentlySpeaking !== this.state.isSpeaking) {
          this.state.isSpeaking = currentlySpeaking;
          this.notifyState();
          this.speakingListeners.forEach((fn) => fn(currentlySpeaking));
        }
      }

      this.animFrameId = requestAnimationFrame(checkVolume);
    };

    this.animFrameId = requestAnimationFrame(checkVolume);
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.state.isMuted = muted;
    this.notifyState();

    if (this.room && this.room.localParticipant) {
      this.room.localParticipant.setMicrophoneEnabled(!muted);
    }
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setPushToTalk(enabled: boolean): void {
    this.isPushToTalk = enabled;
    if (enabled) {
      this.setMuted(true);
    }
  }

  public startPushing(): void {
    if (!this.isPushToTalk) return;
    this.isPushingToTalk = true;
    this.setMuted(false);
  }

  public stopPushing(): void {
    if (!this.isPushToTalk) return;
    this.isPushingToTalk = false;
    this.setMuted(true);
  }

  public disconnect(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }
    this.state = {
      isConnected: false,
      isMuted: false,
      isSpeaking: false,
      hasPermission: false,
      error: null,
      usingFallback: false,
    };
    this.notifyState();
  }
}

export const voiceManager = new LiveKitVoiceManager();
