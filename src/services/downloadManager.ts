import confetti from 'canvas-confetti';
import { DownloadTask, MediaFormat, VideoMetadata } from '../types';
import { notificationManager } from './notificationManager';
import { storagePreferenceManager } from './storagePreferenceManager';

const STORAGE_KEY = 'video_downloader_history_v1';

// Load history from localStorage
export function loadDownloadHistory(): DownloadTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Save history to localStorage
export function saveDownloadHistory(history: DownloadTask[]): void {
  try {
    // Keep last 30 items
    const trimmed = history.slice(0, 30).map(item => ({
      ...item,
      // Do not persist huge memory blob URLs across reloads
      fileBlobUrl: undefined,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save download history', e);
  }
}

// Trigger real browser download or save directly to SD Card / Phone memory
export function triggerBrowserDownload(fileName: string, targetUrl: string): void {
  try {
    const config = storagePreferenceManager.getConfig();
    if (config.destination === 'sd_card' || config.destination === 'ask_each_time') {
      storagePreferenceManager.saveFileToUserStorage(fileName, targetUrl).catch((err) => {
        console.warn('Direct storage save notice:', err);
      });
      return;
    }
  } catch (e) {
    console.warn('Storage preference check notice, proceeding with direct download:', e);
  }

  // Standard browser download
  storagePreferenceManager.fallbackBrowserDownload(fileName, targetUrl);
}

// Sanitize filename for safe OS saving
export function sanitizeFilename(name: string, ext: string): string {
  const clean = name.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 80);
  return `${clean || 'download'}.${ext}`;
}

// Map internal format to upstream API format parameter
export function getApiFormat(format: MediaFormat): string {
  if (format.id && format.id.startsWith('tiktok-')) {
    return format.id;
  }
  if (format.type === 'audio') {
    if (format.ext === 'm4a') return 'm4a';
    if (format.ext === 'webm') return 'webm';
    return 'mp3';
  }
  const label = (format.label + ' ' + (format.resolution || '')).toLowerCase();
  if (label.includes('1080')) return '1080';
  if (label.includes('720')) return '720';
  if (label.includes('480')) return '480';
  if (label.includes('360')) return '360';
  if (label.includes('4k') || label.includes('2160')) return '4k';
  if (label.includes('1440')) return '1440';
  return '720';
}

// Download execution engine: performs real server-assisted conversion for the user's TARGET URL
export function startDownloadSimulation(
  video: VideoMetadata,
  format: MediaFormat,
  onProgress: (task: DownloadTask) => void,
  onComplete: (task: DownloadTask) => void,
  onError: (taskId: string, error: string) => void
): { cancel: () => void; taskId: string } {
  const taskId = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const cleanTitle = video.title.replace(/[\\/:*?"<>|]/g, ' ').trim();
  const fileName = sanitizeFilename(cleanTitle, format.ext);

  // Parse estimated size
  const sizeMatch = format.estimatedSize.match(/([\d.]+)/);
  const totalMb = sizeMatch ? parseFloat(sizeMatch[1]) : 12.0;
  const totalBytes = Math.round(totalMb * 1024 * 1024);

  let isCancelled = false;
  let pollingInterval: any = null;
  let simulatedTimer: any = null;

  const task: DownloadTask = {
    id: taskId,
    videoId: video.id,
    originalUrl: video.originalUrl,
    title: video.title,
    platform: video.platform,
    thumbnail: video.thumbnail,
    format,
    progress: 0,
    speed: 'Connecting...',
    downloadedBytes: 0,
    totalBytes,
    downloadedSize: '0 MB',
    totalSize: format.estimatedSize,
    eta: 'Connecting...',
    status: 'extracting',
    createdAt: Date.now(),
    fileName,
  };

  onProgress({ ...task });

  // Execution flow for the TARGET link:
  // 1. If format already contains directDownloadUrl, stream and download directly!
  // 2. Otherwise send target URL to backend /api/convert/start
  // 3. Poll /api/convert/progress until stream is ready
  // 4. Trigger download with the real stream proxy
  const runConversionFlow = async () => {
    try {
      // Direct stream proxy shortcut
      if (format.directDownloadUrl) {
        notificationManager.notifyDownloadStarted(fileName);
        task.engine = task.platform === 'tiktok' 
          ? 'TikTok No-Watermark Direct Bypass'
          : (task.platform === 'direct' ? 'Direct Media Stream Bypass' : 'High-Speed Stream Proxy');
        task.status = 'downloading';
        task.progress = 60;
        task.speed = '7.8 MB/s';
        task.eta = '1s';
        onProgress({ ...task });

        setTimeout(() => {
          if (isCancelled) return;
          task.status = 'completed';
          task.progress = 100;
          task.speed = 'Finished';
          task.eta = '0s';
          task.downloadedBytes = totalBytes;
          task.downloadedSize = task.totalSize;
          task.fileBlobUrl = format.directDownloadUrl;
          task.directUrl = format.directDownloadUrl;

          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.8 },
            });
          } catch {}

          triggerBrowserDownload(fileName, format.directDownloadUrl!);
          notificationManager.notifyDownloadComplete(fileName, format.quality);
          onComplete({ ...task });
        }, 750);
        return;
      }

      notificationManager.notifyDownloadStarted(fileName);
      task.status = 'extracting';
      task.progress = 12;
      task.eta = 'Connecting to media stream...';
      task.speed = 'Initiating...';
      onProgress({ ...task });

      // Progressive extraction updates to prevent any frozen progress perception
      let currentExtractProgress = 12;
      const extractionMessages = [
        'Connecting to streaming nodes...',
        'Resolving media stream headers...',
        'Bypassing upstream rate-limits...',
        'Preparing direct high-speed pipeline...',
      ];
      let msgIdx = 0;

      const extractInterval = setInterval(() => {
        if (isCancelled || task.status !== 'extracting') {
          clearInterval(extractInterval);
          return;
        }
        currentExtractProgress = Math.min(48, currentExtractProgress + 4);
        msgIdx = (msgIdx + 1) % extractionMessages.length;
        task.progress = currentExtractProgress;
        task.eta = extractionMessages[msgIdx];
        task.speed = 'Active';
        onProgress({ ...task });
      }, 700);

      const apiFmt = getApiFormat(format);
      let startResp: globalThis.Response;
      try {
        startResp = await fetch('/api/convert/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: video.originalUrl, format: apiFmt }),
          signal: AbortSignal.timeout(35000),
        });
      } finally {
        clearInterval(extractInterval);
      }

      if (!startResp.ok) {
        throw new Error(`Server returned HTTP ${startResp.status}`);
      }

      const startData = await startResp.json();
      if (!startData.success) {
        throw new Error(startData.error || 'Could not process target link');
      }

      task.engine = startData.engine || 'Native Stream Bypass';

      // Direct media file or native yt-dlp direct stream (Instant & Reliable)
      if (startData.isDirect && startData.downloadUrl) {
        task.status = 'downloading';
        task.progress = 60;
        task.speed = '8.4 MB/s';
        task.eta = '1s';
        task.fileBlobUrl = startData.downloadUrl;
        task.directUrl = startData.directUrl || video.originalUrl;
        task.downloadedBytes = Math.round(totalBytes * 0.6);
        task.downloadedSize = `${(task.downloadedBytes / (1024 * 1024)).toFixed(1)} MB`;
        onProgress({ ...task });

        setTimeout(() => {
          if (isCancelled) return;
          task.progress = 85;
          task.eta = 'Finalizing...';
          task.downloadedBytes = Math.round(totalBytes * 0.85);
          task.downloadedSize = `${(task.downloadedBytes / (1024 * 1024)).toFixed(1)} MB`;
          onProgress({ ...task });

          setTimeout(() => {
            if (isCancelled) return;
            task.status = 'completed';
            task.progress = 100;
            task.speed = 'Finished';
            task.eta = '0s';
            task.downloadedBytes = totalBytes;
            task.downloadedSize = task.totalSize;

            try {
              confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.8 },
              });
            } catch {}

            triggerBrowserDownload(fileName, startData.downloadUrl);
            notificationManager.notifyDownloadComplete(fileName, format.quality);
            onComplete({ ...task });
          }, 350);
        }, 350);
        return;
      }

      const convertId = startData.id;
      const progressUrl = startData.progressUrl;

      if (!convertId) {
        throw new Error('No conversion ID returned for target stream');
      }

      task.status = 'converting';
      task.progress = 30;
      task.eta = 'Encoding target media stream...';
      task.speed = '4.5 MB/s';
      onProgress({ ...task });

      let attempts = 0;
      const maxAttempts = 50; // Up to 75 seconds polling

      pollingInterval = setInterval(async () => {
        if (isCancelled) {
          clearInterval(pollingInterval);
          return;
        }

        attempts++;
        try {
          const pollResp = await fetch(
            `/api/convert/progress?id=${encodeURIComponent(convertId)}&progressUrl=${encodeURIComponent(progressUrl || '')}`,
            { signal: AbortSignal.timeout(8000) }
          );

          if (pollResp.ok) {
            const pData = await pollResp.json();

            // Completed target stream!
            if (pData.success && pData.downloadUrl) {
              clearInterval(pollingInterval);
              task.status = 'completed';
              task.progress = 100;
              task.speed = 'Finished';
              task.eta = '0s';
              task.downloadedBytes = totalBytes;
              task.downloadedSize = task.totalSize;

              const realDownloadUrl = `/api/proxy-download?url=${encodeURIComponent(pData.downloadUrl)}&filename=${encodeURIComponent(fileName)}&type=${format.type}&stream=true`;
              task.fileBlobUrl = realDownloadUrl;
              task.directUrl = pData.downloadUrl;

              // Confetti celebration
              try {
                confetti({
                  particleCount: 80,
                  spread: 60,
                  origin: { y: 0.8 },
                });
              } catch {}

              // Trigger download of TARGET media file
              triggerBrowserDownload(fileName, realDownloadUrl);
              notificationManager.notifyDownloadComplete(fileName, format.quality);
              onComplete({ ...task });
              return;
            } else {
              // In progress for target video
              const rawProgress = pData.progress || 0;
              // Map progress smoothly: 30% -> 96%, factoring in elapsed attempts so it never freezes
              const mapped = Math.min(96, Math.max(30, Math.round(30 + (rawProgress / 1000) * 60 + Math.min(20, attempts * 0.8))));
              task.progress = Math.max(task.progress, mapped);
              task.status = 'downloading';
              task.speed = `${(3.8 + Math.random() * 2.5).toFixed(1)} MB/s`;
              task.eta = `${Math.max(2, Math.round((maxAttempts - attempts) * 1.5))}s`;
              task.downloadedBytes = Math.round(totalBytes * (task.progress / 100));
              task.downloadedSize = `${(task.downloadedBytes / (1024 * 1024)).toFixed(1)} MB`;
              onProgress({ ...task });
            }
          }
        } catch (pollErr) {
          console.warn('Progress poll check:', pollErr);
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollingInterval);
          task.status = 'failed';
          task.error = 'টার্গেট লিঙ্ক প্রসেস হতে অতিরিক্ত সময় লেগেছে। পুনরায় চেষ্টা করুন বা সরাসরি বাইপাস ফরম্যাট বেছে নিন।';
          task.eta = 'Timed out';
          onProgress({ ...task });
          onError(taskId, task.error);
        }
      }, 1500);
    } catch (startErr: any) {
      console.error('Target conversion error:', startErr.message);
      task.status = 'failed';
      task.error = startErr.message || 'টার্গেট ভিডিও ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে লিঙ্ক চেক করে আবার চেষ্টা করুন।';
      task.eta = 'Failed';
      onProgress({ ...task });
      onError(taskId, task.error);
    }
  };

  // Start conversion for target URL
  runConversionFlow();

  return {
    taskId,
    cancel: () => {
      isCancelled = true;
      if (pollingInterval) clearInterval(pollingInterval);
      if (simulatedTimer) clearInterval(simulatedTimer);
      task.status = 'failed';
      task.error = 'Cancelled by user';
      onError(taskId, 'Cancelled');
    },
  };
}
