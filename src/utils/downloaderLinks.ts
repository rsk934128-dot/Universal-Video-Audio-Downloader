// Unrestricted Multi-Service Web Downloader Links
// Avoids SaveFrom (ssyoutube) copyright restriction ("This file can not be downloaded via our service")

export function getUnrestrictedDownloadUrl(ytId: string, fullUrl?: string): string {
  const cleanId = (ytId || '').replace(/^yt-/, '').trim();
  const watchUrl = fullUrl || `https://www.youtube.com/watch?v=${cleanId}`;
  // 9xBuddy does not block music videos or copyrighted songs
  return `https://9xbuddy.com/process?url=${encodeURIComponent(watchUrl)}`;
}

export function getY2MateUrl(ytId: string): string {
  const cleanId = (ytId || '').replace(/^yt-/, '').trim();
  return `https://www.y2mate.com/youtube/${cleanId}`;
}

export function getDirpyUrl(ytId: string, fullUrl?: string): string {
  const cleanId = (ytId || '').replace(/^yt-/, '').trim();
  const watchUrl = fullUrl || `https://www.youtube.com/watch?v=${cleanId}`;
  return `https://dirpy.com/studio?url=${encodeURIComponent(watchUrl)}`;
}
