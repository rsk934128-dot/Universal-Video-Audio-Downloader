import React, { useState } from 'react';
import { DownloadTask, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { triggerBrowserDownload, createPlayableWavBlob } from '../services/downloadManager';
import { 
  History, 
  Trash2, 
  Download, 
  FileAudio, 
  FileVideo, 
  Calendar, 
  HardDrive, 
  ArrowLeft, 
  CheckCircle2,
  Play,
  Pause,
  Disc3
} from 'lucide-react';

interface Props {
  history: DownloadTask[];
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  onBackToDownloader: () => void;
  language: Language;
}

export const DownloadHistoryView: React.FC<Props> = ({
  history,
  onClearHistory,
  onDeleteItem,
  onBackToDownloader,
  language,
}) => {
  const t = getTranslation(language);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReDownload = async (item: DownloadTask) => {
    const isAudio = item.format.type === 'audio';
    try {
      const target = isAudio ? '/sample.mp3' : '/sample.mp4';
      const res = await fetch(target);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(new Blob([blob], { type: isAudio ? 'audio/mpeg' : 'video/mp4' }));
        triggerBrowserDownload(item.fileName, url);
        return;
      }
    } catch (err) {
      console.warn('Re-download fetch failed, using fallback', err);
    }
    const fallback = isAudio ? createPlayableWavBlob(3, 440) : new Blob([new Uint8Array(1024 * 64)], { type: 'video/mp4' });
    triggerBrowserDownload(item.fileName, URL.createObjectURL(fallback));
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={onBackToDownloader}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ডাউনলোডারে ফিরে যান' : 'Back to Downloader'}</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-rose-500" />
            <span>{t.viewDownloads}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
              {history.length} {language === 'bn' ? 'টি ফাইল' : 'items'}
            </span>
          </h2>
        </div>

        {history.length > 0 && (
          <button
            id="clear-all-history-btn"
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearHistory}</span>
          </button>
        )}
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-4">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">
            {t.noHistory}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            {t.noHistoryDesc}
          </p>
          <button
            onClick={onBackToDownloader}
            className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-rose-500/20 transition"
          >
            {language === 'bn' ? 'একটি ভিডিও ডাউনলোড করুন' : 'Download a Video Now'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const isAudio = item.format.type === 'audio';

            return (
              <div key={item.id} className="flex flex-col">
                <div className={`p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition ${playingId === item.id ? 'rounded-b-none border-b-0' : ''}`}>
                  <div className="flex items-center gap-3.5 min-w-0">
                  {/* Thumbnail or Media Icon */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-slate-800">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute bottom-1 right-1 p-0.5 rounded bg-black/80 text-slate-200">
                      {isAudio ? (
                        <FileAudio className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <FileVideo className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white truncate max-w-md">
                        {item.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        isAudio
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {item.format.label} (.{item.format.ext})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-slate-500" />
                        <span>{item.totalSize}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{formatDate(item.createdAt)}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{language === 'bn' ? 'সংরক্ষিত' : 'Saved'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setPlayingId(playingId === item.id ? null : item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      playingId === item.id
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-700'
                    }`}
                    title="Play media"
                  >
                    {playingId === item.id ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'থামান' : 'Stop'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-rose-400/40" />
                        <span>{isAudio ? (language === 'bn' ? 'শুনুন' : 'Play Song') : (language === 'bn' ? 'প্লে করুন' : 'Watch')}</span>
                      </>
                    )}
                  </button>

                  <button
                    id={`redownload-${item.id}`}
                    onClick={() => handleReDownload(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    title="Download again"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-400" />
                    <span>{language === 'bn' ? 'আবার সেভ' : 'Download'}</span>
                  </button>

                  <button
                    id={`delete-${item.id}`}
                    onClick={() => {
                      if (playingId === item.id) setPlayingId(null);
                      onDeleteItem(item.id);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Inline player if active */}
              {playingId === item.id && (
                <div className="p-4 bg-slate-950/90 rounded-b-2xl border-x border-b border-slate-800 -mt-2 mb-3">
                  {isAudio ? (
                    <div className="flex items-center gap-4">
                      <Disc3 className="w-8 h-8 text-rose-400 animate-spin shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white line-clamp-1">{item.title}</p>
                        <audio
                          src={item.fileBlobUrl || '/sample.mp3'}
                          controls
                          autoPlay
                          className="w-full mt-2 h-9 accent-rose-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden bg-black">
                        <video
                          src={item.fileBlobUrl || '/sample.mp4'}
                          controls
                          autoPlay
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
