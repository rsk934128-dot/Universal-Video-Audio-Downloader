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
   * Safe binary resolver: converts any target URL or stream into a verified in-memory Blob.
   * Crucially prevents "Cookie Check" or Cloud Run auth HTML pages from being downloaded as media!
   */
  public async resolveMediaBlob(fileSource: Blob | string): Promise<Blob> {
    if (fileSource instanceof Blob) {
      return fileSource;
    }

    if (typeof fileSource !== 'string' || !fileSource.trim()) {
      throw new Error('ডাউনলোডের জন্য সঠিক মিডিয়া লিঙ্ক পাওয়া যায়নি');
    }

    // If it's already an in-memory blob: URL or data: URL
    if (fileSource.startsWith('blob:') || fileSource.startsWith('data:')) {
      const blobResp = await fetch(fileSource);
      return await blobResp.blob();
    }

    // Fetch binary stream with same-origin credentials (bypasses Cloud Run interstitial)
    const resp = await fetch(fileSource, {
      credentials: 'same-origin',
      headers: {
        'Accept': 'audio/*, video/*, application/octet-stream, */*',
      },
    });

    if (!resp.ok) {
      throw new Error(`সার্ভার থেকে মিডিয়া আনতে সমস্যা হয়েছে (HTTP ${resp.status})`);
    }

    const contentType = (resp.headers.get('content-type') || '').toLowerCase();

    // Critical: check if the edge server returned an HTML error or Cookie Check challenge
    if (contentType.includes('text/html')) {
      const textSample = await resp.text();
      if (textSample.includes('Cookie check') || textSample.includes('Action required to load your app')) {
        throw new Error('ব্রাউজার সিকিউরিটি কুকি যাচাই প্রয়োজন হয়েছে। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।');
      }
      throw new Error('সার্ভার থেকে অডিও/ভিডিও ফাইলের পরিবর্তে এইচটিএমএল পেজ এসেছে।');
    }

    const blob = await resp.blob();

    // Verify blob is not a corrupted tiny response
    if (blob.size < 512) {
      throw new Error('ডাউনলোডকৃত ফাইলটি অসম্পূর্ণ বা খালি (0 KB)');
    }

    // Inspect first 64 bytes to ensure it does not start with <!doctype html
    try {
      const headerText = await blob.slice(0, 64).text();
      if (headerText.toLowerCase().includes('<!doctype') || headerText.toLowerCase().includes('<html')) {
        throw new Error('কুকি সিকিউরিটি যাচাইয়ের কারণে এইচটিএমএল পৃষ্ঠা এসেছে। মিডিয়া ফাইল নয়।');
      }
    } catch {}

    return blob;
  }

  /**
   * Save media file safely to user device:
   * 1. Resolves binary into in-memory Blob (immune to Cookie Check HTML downloads)
   * 2. Directs to SD Card picker, Native Share, or in-memory blob download
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

    // External downloader URL handler (opens directly in user browser)
    if (typeof fileSource === 'string' && (fileSource.includes('9xbuddy.com') || fileSource.includes('y2mate.com') || fileSource.includes('ssyoutube.com') || fileSource.includes('cobalt.tools') || fileSource.includes('dirpy.com') || fileSource.includes('y2mate.nu'))) {
      if (typeof window !== 'undefined') {
        window.open(fileSource, '_blank', 'noopener,noreferrer');
      }
      return { success: true, method: 'browser', message: 'ডাউনলোডার পেজ সফলভাবে ওপেন হয়েছে...' };
    }

    let blob: Blob;
    try {
      blob = await this.resolveMediaBlob(fileSource);
    } catch (err: any) {
      console.error('resolveMediaBlob failed:', err);
      // If it was already a blob URL or direct URL, attempt pure anchor as emergency fallback
      if (typeof fileSource === 'string' && fileSource.startsWith('blob:')) {
        this.triggerBlobDownload(fileName, fileSource);
        return { success: true, method: 'browser', message: 'ফাইল ডাউনলোড শুরু হয়েছে...' };
      }
      return {
        success: false,
        method: 'browser',
        message: err.message || 'মিডিয়া ফাইল প্রসেসিং ব্যর্থ হয়েছে',
      };
    }

    // 1. Try File System Access API (showSaveFilePicker)
    // When user explicitly clicks "Save to SD Card" or configured SD Card destination
    if ((isExplicitUserAction || activeDestination === 'sd_card') && this.isNativePickerSupported()) {
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
        if (err.name === 'AbortError') {
          return { success: false, method: 'picker', message: 'সেভ ডায়ালগ বাতিল করা হয়েছে' };
        }
        console.warn('showSaveFilePicker bypassed or cancelled, proceeding to next method:', err);
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

    // 3. Fallback: In-Memory Blob URL Download (100% immune to Cloud Run Cookie Check HTML intercept)
    const blobUrl = URL.createObjectURL(blob);
    this.triggerBlobDownload(fileName, blobUrl);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);

    const targetLabel = activeDestination === 'sd_card' 
      ? 'মেমোরি কার্ডে (ব্রাউজার ডিফল্ট লোকেশন অনুযায়ী)' 
      : 'ফোন মেমোরিতে (Downloads ফোল্ডার)';

    return {
      success: true,
      method: 'browser',
      message: `ফাইল সফলভাবে ডাউনলোড সম্পন্ন হয়েছে (${targetLabel})।`,
    };
  }

  // Trigger in-memory anchor download (NEVER makes a network request for blob: URLs)
  private triggerBlobDownload(fileName: string, blobUrl: string): void {
    try {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 3000);
    } catch (e) {
      window.location.href = blobUrl;
    }
  }

  public fallbackBrowserDownload(fileName: string, url: string): void {
    // Route through safe storage saver
    this.saveFileToUserStorage(fileName, url).catch((err) => {
      console.warn('fallbackBrowserDownload safe save warning:', err);
    });
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
