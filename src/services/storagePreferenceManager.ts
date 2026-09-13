// Storage Preference & Direct Memory Card / Phone Storage Manager
import { StorageConfig, StorageDestination } from '../types';

const STORAGE_PREF_KEY = 'video_downloader_storage_config_v1';

const DEFAULT_CONFIG: StorageConfig = {
  destination: 'sd_card', // Default set to SD Card as requested
  customFolder: 'Movies/Downloader',
  useNativePicker: true,
  autoSaveToSD: true,
  lastUsedPath: 'SD Card / Movies',
};

class StoragePreferenceManager {
  private config: StorageConfig;
  private listeners: Set<(config: StorageConfig) => void> = new Set();

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): StorageConfig {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
      const raw = localStorage.getItem(STORAGE_PREF_KEY);
      if (!raw) return DEFAULT_CONFIG;
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  public getConfig(): StorageConfig {
    return { ...this.config };
  }

  public setConfig(update: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...update };
    try {
      localStorage.setItem(STORAGE_PREF_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to persist storage config:', e);
    }
    this.notifyListeners();
  }

  public setDestination(destination: StorageDestination): void {
    this.setConfig({ destination });
  }

  public isNativePickerSupported(): boolean {
    return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
  }

  public isShareFilesSupported(): boolean {
    return typeof navigator !== 'undefined' && 'canShare' in navigator && typeof navigator.share === 'function';
  }

  /**
   * Directly save file to Memory Card (SD Card) or Phone Storage using Native File System Picker,
   * Native Share to File Manager, or Browser Download.
   */
  public async saveFileToUserStorage(
    fileName: string,
    fileSource: Blob | string,
    options?: {
      mimeType?: string;
      forcePicker?: boolean;
      destinationOverride?: StorageDestination;
    }
  ): Promise<{ success: boolean; method: 'picker' | 'share' | 'browser'; message: string }> {
    const activeDestination = options?.destinationOverride || this.config.destination;
    const isExplicitUserAction = !!options?.forcePicker;

    // If this is an automated download trigger with a stream URL (not an explicit button click),
    // trigger browser download directly via the stream URL to avoid 0 KB memory blob truncations.
    if (typeof fileSource === 'string' && !isExplicitUserAction) {
      this.fallbackBrowserDownload(fileName, fileSource);
      return {
        success: true,
        method: 'browser',
        message: 'ফাইল ডাউনলোড শুরু হয়েছে...',
      };
    }

    // Get real Blob for FilePicker or Web Share
    let blob: Blob;
    try {
      if (typeof fileSource === 'string') {
        const res = await fetch(fileSource);
        if (!res.ok) {
          throw new Error(`Stream fetch failed: HTTP ${res.status}`);
        }
        blob = await res.blob();
      } else {
        blob = fileSource;
      }
    } catch (fetchErr) {
      console.warn('Could not fetch blob for direct save, falling back to URL download:', fetchErr);
      if (typeof fileSource === 'string') {
        this.fallbackBrowserDownload(fileName, fileSource);
        return {
          success: true,
          method: 'browser',
          message: 'ব্রাউজার সরাসরি ডাউনলোড পদ্ধতিতে সেভ হচ্ছে...',
        };
      }
      return { success: false, method: 'browser', message: 'ফাইল প্রসেসিং ব্যর্থ হয়েছে' };
    }

    // 1. Try File System Access API (showSaveFilePicker)
    // When user explicitly clicks "Save to SD Card", this allows picking the SD Card directory
    if (isExplicitUserAction && this.isNativePickerSupported()) {
      try {
        const ext = fileName.split('.').pop() || 'mp4';
        const isAudio = ext === 'mp3' || ext === 'm4a';

        const pickerOptions: any = {
          suggestedName: fileName,
          types: [
            {
              description: isAudio ? 'Audio File (মেমোরি কার্ড / অডিও)' : 'Video File (মেমোরি কার্ড / ভিডিও)',
              accept: {
                [blob.type || (isAudio ? 'audio/mpeg' : 'video/mp4')]: [`.${ext}`],
              },
            },
          ],
        };

        // @ts-ignore
        const fileHandle = await window.showSaveFilePicker(pickerOptions);
        const writableStream = await fileHandle.createWritable();
        await writableStream.write(blob);
        await writableStream.close();

        const destName = activeDestination === 'sd_card' ? 'মেমোরি কার্ডে (SD Card)' : 'ফোন মেমোরিতে';
        return {
          success: true,
          method: 'picker',
          message: `মিডিয়া ফাইলটি সফলভাবে ${destName} সেভ হয়েছে!`,
        };
      } catch (err: any) {
        // User cancelled picker dialog or permission denied
        if (err.name === 'AbortError') {
          return { success: false, method: 'picker', message: 'ইউজার সেভ ডায়ালগ বাতিল করেছেন' };
        }
        console.warn('showSaveFilePicker encountered error, trying next method:', err);
      }
    }

    // 2. Try Web Share API with File (Android / iOS File Manager & SD Card transfer)
    if (this.isShareFilesSupported() && isExplicitUserAction) {
      try {
        const file = new File([blob], fileName, { type: blob.type || 'video/mp4' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: fileName,
            text: 'মেমোরি কার্ড বা ফোন ফাইল ম্যানেজারে সেভ করুন',
          });
          return {
            success: true,
            method: 'share',
            message: 'ফাইলটি ফাইল ম্যানেজার / মেমোরি কার্ডে পাঠানোর ডায়ালগ খোলা হয়েছে',
          };
        }
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          return { success: false, method: 'share', message: 'শেয়ার ডায়ালগ বাতিল করা হয়েছে' };
        }
      }
    }

    // 3. Fallback: Browser Download trigger
    if (typeof fileSource === 'string') {
      this.fallbackBrowserDownload(fileName, fileSource);
    } else {
      const blobUrl = URL.createObjectURL(blob);
      this.fallbackBrowserDownload(fileName, blobUrl);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    }

    const targetLabel = activeDestination === 'sd_card' 
      ? 'মেমোরি কার্ডে (ব্রাউজার ডিফল্ট লোকেশন অনুযায়ী)' 
      : 'ফোন মেমোরিতে (Downloads ফোল্ডার)';

    return {
      success: true,
      method: 'browser',
      message: `ফাইল ডাউনলোড শুরু হয়েছে (${targetLabel})।`,
    };
  }

  public fallbackBrowserDownload(fileName: string, url: string): void {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      // Do NOT set target='_blank' because it triggers a blank tab and causes 0 KB downloads in mobile browsers
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 3000);
    } catch (e) {
      window.location.href = url;
    }
  }

  public subscribe(listener: (config: StorageConfig) => void): () => void {
    this.listeners.add(listener);
    listener(this.getConfig());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const current = this.getConfig();
    this.listeners.forEach((fn) => fn(current));
  }
}

export const storagePreferenceManager = new StoragePreferenceManager();
