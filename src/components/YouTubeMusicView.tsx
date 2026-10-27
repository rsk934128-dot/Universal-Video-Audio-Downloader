import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Music, 
  Film, 
  Play, 
  Disc, 
  Sparkles, 
  Radio, 
  TrendingUp, 
  ExternalLink, 
  Check, 
  Copy, 
  Loader2, 
  ShieldCheck, 
  Headphones,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  ListPlus
} from 'lucide-react';
import { YouTubeSongTrack, Language } from '../types';

interface Props {
  language: Language;
  onPlaySong: (track: YouTubeSongTrack, playlist?: YouTubeSongTrack[]) => void;
  onDownloadAudio: (track: YouTubeSongTrack) => void;
  onDownloadVideo: (track: YouTubeSongTrack) => void;
  onSendToDownloader: (url: string) => void;
  onAddToBatch?: (url: string) => void;
}

const QUICK_CATEGORIES = [
  { label: '🔥 ট্রেন্ডিং গান', query: 'bangla new songs 2024' },
  { label: '🎶 অরিজিৎ সিং', query: 'arijit singh romantic hits' },
  { label: '📻 কোক স্টুডিও বাংলা', query: 'coke studio bangla' },
  { label: '⭐ লতা মঙ্গেশকর', query: 'lata mangeshkar bengali classic songs' },
  { label: '🕌 নাশিদ ও গজল', query: 'islamic nasheed bangla' },
  { label: '🎸 বাংলা ব্যান্ড হিটস', query: 'bangla rock band songs artcell warfaze' },
  { label: '🌍 গ্লোবাল টপ ৫০', query: 'global top hits music 2024' },
  { label: '💿 ফুল অ্যালবাম কালেকশন', query: 'bangla all time hits album jukebox' },
];

export const YouTubeMusicView: React.FC<Props> = ({
  language,
  onPlaySong,
  onDownloadAudio,
  onDownloadVideo,
  onSendToDownloader,
  onAddToBatch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(QUICK_CATEGORIES[0].query);
  const [tracks, setTracks] = useState<YouTubeSongTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'song' | 'album'>('all');

  // Search API fetcher
  const fetchTracks = async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    try {
      const resp = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.tracks && Array.isArray(data.tracks)) {
          setTracks(data.tracks);
        }
      }
    } catch (err) {
      console.error('Failed to search YouTube songs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTracks(activeCategory);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchTracks(searchQuery);
    }
  };

  const handleSelectCategory = (query: string) => {
    setActiveCategory(query);
    setSearchQuery(query);
    fetchTracks(query);
  };

  const handleCopyLink = (track: YouTubeSongTrack) => {
    navigator.clipboard.writeText(track.url);
    setCopiedId(track.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTracks = tracks.filter((t) => {
    if (selectedFilter === 'all') return true;
    return t.type === selectedFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full px-2 sm:px-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-indigo-950/60 border border-slate-800/80 p-5 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>ইউটিউব মিউজিক ও অ্যালবাম সার্চ ইঞ্জিন</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            গান ও অ্যালবাম খুঁজুন, শুনুন এবং সরাসরি ডাউনলোড করুন
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            ইউটিউবের যেকোনো গান, শিল্পী বা মিউজিক অ্যালবাম নাম দিয়ে খুঁজুন। হাই-রেজোলিউশন অ্যালবাম আর্ট সহ গান শুনুন এবং এক ক্লিকে হাই-কোয়ালিটি অডিও (MP3) ও ভিডিও (MP4) ডাউনলোড করে নিন।
          </p>

          {/* Screen Lock Guarantee Notice */}
          <div className="inline-flex items-center gap-2 pt-1 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3.5 py-1.5 rounded-xl font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>🔒 ব্যাকগ্রাউন্ড ও স্ক্রিন লক প্রোটেকশন: মোবাইল স্ক্রিন লক করে রাখলেও ডাউনলোড চালু থাকবে!</span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative mt-6 max-w-2xl">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-400">
              <Search className="w-5 h-5 text-rose-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="গানের নাম, শিল্পী, ব্যান্ড বা অ্যালবামের নাম লিখুন (যেমন: Arijit Singh, Coke Studio, লতা মঙ্গেশকর)..."
              className="w-full pl-12 pr-28 py-3.5 bg-slate-950/90 text-sm text-white placeholder-slate-400 border border-slate-700/80 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-inner"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-rose-950/40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>খোঁজা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>খুঁজুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Category Chips */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {QUICK_CATEGORIES.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectCategory(cat.query)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition shrink-0 ${
                activeCategory === cat.query
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar & Result Count */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 px-4 py-3 rounded-xl">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
          <Headphones className="w-4 h-4 text-rose-400" />
          <span>মোট <strong className="text-white font-mono">{filteredTracks.length}</strong> টি গান ও অ্যালবাম পাওয়া গেছে</span>
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-2.5 py-1 text-xs rounded-lg transition font-medium ${
              selectedFilter === 'all'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            সবগুলো ({tracks.length})
          </button>
          <button
            onClick={() => setSelectedFilter('song')}
            className={`px-2.5 py-1 text-xs rounded-lg transition font-medium ${
              selectedFilter === 'song'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            একক গান ({tracks.filter(t => t.type === 'song').length})
          </button>
          <button
            onClick={() => setSelectedFilter('album')}
            className={`px-2.5 py-1 text-xs rounded-lg transition font-medium ${
              selectedFilter === 'album'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            অ্যালবাম ও জুকবক্স ({tracks.filter(t => t.type === 'album').length})
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
            <Disc className="w-5 h-5 text-rose-400 absolute inset-0 m-auto" />
          </div>
          <p className="text-sm text-slate-300 font-medium">ইউটিউব থেকে গান ও অ্যালবাম আনা হচ্ছে...</p>
          <p className="text-xs text-slate-500">হাই-কোয়ালিটি অডিও ও অ্যালবাম কভার যাচাই করা হচ্ছে</p>
        </div>
      )}

      {/* Results Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-rose-950/20"
            >
              <div>
                {/* Album Cover & Duration */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-3 shadow-inner">
                  <img
                    src={track.albumArt || track.thumbnail}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Play Button Overlay on Hover */}
                  <button
                    onClick={() => onPlaySong(track, tracks)}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/50 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition duration-200"
                    title="গানটি প্লে করুন"
                  >
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </button>

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                      track.type === 'album'
                        ? 'bg-amber-500/90 text-slate-950'
                        : 'bg-rose-500/90 text-white'
                    }`}>
                      {track.type === 'album' ? 'অ্যালবাম' : 'গান'}
                    </span>
                    {track.isOfficial && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/90 text-white text-[9px] font-semibold">
                        অফিসিয়াল
                      </span>
                    )}
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 bg-slate-950/90 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono text-slate-200 border border-slate-700/60">
                    {track.duration}
                  </div>
                </div>

                {/* Song Details */}
                <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-rose-400 transition" title={track.title}>
                  {track.title}
                </h3>
                <p className="text-xs text-rose-300/90 font-medium mt-1 truncate">
                  {track.artist}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                  {track.views && <span>{track.views}</span>}
                  {track.views && track.published && <span>•</span>}
                  {track.published && <span>{track.published}</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800/80 mt-3 space-y-2">
                {/* 1-Click Audio & Video Downloads */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onDownloadAudio(track)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition hover:scale-[1.02]"
                    title="MP3 320kbps অডিও ডাউনলোড"
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>MP3 অডিও</span>
                  </button>

                  <button
                    onClick={() => onDownloadVideo(track)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition hover:scale-[1.02]"
                    title="HD 1080p/720p ভিডিও ডাউনলোড"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>HD ভিডিও</span>
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
                  <button
                    onClick={() => onPlaySong(track, tracks)}
                    className="flex items-center gap-1 hover:text-white transition font-medium"
                  >
                    <Play className="w-3.5 h-3.5 text-rose-400" />
                    <span>অ্যালবামে শুনুন</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLink(track)}
                      className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="ইউটিউব লিঙ্ক কপি করুন"
                    >
                      {copiedId === track.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => onSendToDownloader(track.url)}
                      className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="ফুল ডাউনলোডার ফরম্যাট অপশনে নিন"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    </button>

                    {onAddToBatch && (
                      <button
                        onClick={() => onAddToBatch(track.url)}
                        className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition"
                        title="ব্যাচ কিউতে যোগ করুন"
                      >
                        <ListPlus className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTracks.length === 0 && (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
          <Disc className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">কোনো গান পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            অন্য কোনো গানের নাম, শিল্পী বা ব্যান্ডের নাম দিয়ে পুনরায় সার্চ করুন।
          </p>
        </div>
      )}
    </div>
  );
};
