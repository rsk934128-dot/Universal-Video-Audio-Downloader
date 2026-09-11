// Background Keep-Alive & Mobile Activity Service
import { notificationManager } from './notificationManager';

class BackgroundKeepAlive {
  private wakeLockSentinel: any = null;
  private isKeepAliveActive: boolean = false;
  private heartbeatInterval: any = null;
  private audioContext: AudioContext | null = null;
  private silentOscillator: OscillatorNode | null = null;
  private silentGain: GainNode | null = null;
  private listeners: Set<(isActive: boolean) => void> = new Set();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initNetworkListeners();
      this.initVisibilityListener();

      // Check if user previously enabled Always-Active mode
      const saved = localStorage.getItem('downloader_always_active');
      if (saved === 'true') {
        this.enable();
      }
    }
  }

  private initNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Mobile network online - re-syncing background tasks');
      notificationManager.notifyInternetRestored();
      this.pingServer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Mobile network offline');
    });
  }

  private initVisibilityListener() {
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'hidden') {
        console.log('App minimized/backgrounded. Background persistence status:', this.isKeepAliveActive);
        if (this.isKeepAliveActive) {
          this.ensureSilentHeartbeat();
        }
      } else if (document.visibilityState === 'visible') {
        console.log('App brought to foreground');
        if (this.isKeepAliveActive) {
          await this.requestWakeLock();
        }
      }
    });
  }

  // Request Screen Wake Lock (keeps display from sleeping)
  private async requestWakeLock(): Promise<boolean> {
    if ('wakeLock' in navigator) {
      try {
        // @ts-ignore
        this.wakeLockSentinel = await navigator.wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
        return true;
      } catch (err) {
        console.warn('Wake Lock request skipped or unsupported:', err);
      }
    }
    return false;
  }

  private releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {}
      this.wakeLockSentinel = null;
    }
  }

  // Audio keep-alive: mobile browsers (iOS Safari & Android Chrome) grant continuous
  // background CPU time to tabs playing audio, bypassing aggressive background freezing.
  private ensureSilentHeartbeat() {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      if (this.audioContext && !this.silentOscillator) {
        // Inaudible 20Hz oscillator with gain 0.0001 (completely silent to human ear)
        this.silentOscillator = this.audioContext.createOscillator();
        this.silentGain = this.audioContext.createGain();
        this.silentGain.gain.value = 0.00001; // Silent
        this.silentOscillator.type = 'sine';
        this.silentOscillator.frequency.value = 20;
        this.silentOscillator.connect(this.silentGain);
        this.silentGain.connect(this.audioContext.destination);
        this.silentOscillator.start();
      }
    } catch (e) {
      console.warn('Silent heartbeat audio initialisation bypassed:', e);
    }
  }

  private stopSilentHeartbeat() {
    try {
      if (this.silentOscillator) {
        this.silentOscillator.stop();
        this.silentOscillator.disconnect();
        this.silentOscillator = null;
      }
      if (this.silentGain) {
        this.silentGain.disconnect();
        this.silentGain = null;
      }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.suspend().catch(() => {});
      }
    } catch (e) {
      console.warn('Error stopping silent heartbeat:', e);
    }
  }

  private async pingServer() {
    try {
      await fetch('/api/health', { cache: 'no-store' });
    } catch {}
  }

  // Enable persistent background execution
  public async enable(): Promise<boolean> {
    this.isKeepAliveActive = true;
    localStorage.setItem('downloader_always_active', 'true');

    // 1. Screen Wake Lock
    await this.requestWakeLock();

    // 2. Silent Heartbeat Audio (prevents mobile OS from freezing JS threads when minimized)
    this.ensureSilentHeartbeat();

    // 3. Regular ping to keep networking pipe open
    if (!this.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        if (this.isKeepAliveActive) {
          this.pingServer();
        }
      }, 25000);
    }

    this.notifyListeners();
    return true;
  }

  // Disable persistent background execution
  public disable() {
    this.isKeepAliveActive = false;
    localStorage.setItem('downloader_always_active', 'false');

    this.releaseWakeLock();
    this.stopSilentHeartbeat();

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.notifyListeners();
  }

  public toggle(): boolean {
    if (this.isKeepAliveActive) {
      this.disable();
      return false;
    } else {
      this.enable();
      return true;
    }
  }

  public isActive(): boolean {
    return this.isKeepAliveActive;
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public subscribe(listener: (isActive: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isKeepAliveActive);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn(this.isKeepAliveActive));
  }
}

export const backgroundKeepAlive = new BackgroundKeepAlive();
