import React, { useState } from 'react';
import { AppTab, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { usePWA } from '../hooks/usePWA';
import { 
  Download, 
  History, 
  Code, 
  Smartphone, 
  Languages, 
  Share2, 
  Check, 
  HelpCircle,
  Layers
} from 'lucide-react';

interface Props {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  historyCount: number;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  historyCount,
}) => {
  const t = getTranslation(language);
  const { isInstallable, isInstalled, isIOS, install } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.appTitle,
          text: t.appSubtitle,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('downloader')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-sky-500 p-0.5 shadow-lg shadow-rose-500/20 group-hover:shadow-rose-500/40 transition">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Download className="w-5 h-5 text-rose-400 group-hover:scale-110 transition duration-200" />
            </div>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>{language === 'bn' ? 'ডাউনলোডার প্রো' : 'Downloader Pro'}</span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                MP3 & HD
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {language === 'bn' ? 'সব প্ল্যাটফর্মের ভিডিও ও অডিও এক্সট্র্যাক্টর' : 'Universal Media & Stream Extractor'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            id="nav-tab-downloader"
            onClick={() => setActiveTab('downloader')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
              activeTab === 'downloader'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{language === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
          </button>

          <button
            id="nav-tab-batch"
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
              activeTab === 'batch'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-rose-400" />
            <span>{language === 'bn' ? 'ব্যাচ কিউ' : 'Batch Queue'}</span>
          </button>

          <button
            id="nav-tab-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition relative ${
              activeTab === 'history'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{language === 'bn' ? 'হিস্টোরি' : 'History'}</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {historyCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-pwa-guide"
            onClick={() => setActiveTab('pwa-guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
              activeTab === 'pwa-guide'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Share2 className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">{language === 'bn' ? 'PWA শেয়ার গাইড' : 'PWA Share Guide'}</span>
            <span className="sm:hidden">{language === 'bn' ? 'গাইড' : 'Guide'}</span>
          </button>

          <button
            id="nav-tab-blueprint"
            onClick={() => setActiveTab('blueprint')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
              activeTab === 'blueprint'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'bn' ? 'কোড ও আর্কিটেকচার' : 'Code Blueprint'}</span>
            <span className="sm:hidden">{language === 'bn' ? 'কোড' : 'Code'}</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            id="lang-toggle-btn"
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5 text-sky-400" />
            <span>{language === 'bn' ? 'EN' : 'বাং'}</span>
          </button>

          {/* Share Button */}
          <button
            id="share-app-btn"
            onClick={handleShare}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Share App Link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedLink ? 'Copied!' : (language === 'bn' ? 'শেয়ার' : 'Share')}</span>
          </button>

          {/* PWA Install Button */}
          {isInstallable && (
            <button
              id="pwa-install-btn"
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow hover:brightness-110 transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t.installPWA}</span>
            </button>
          )}

          {isIOS && !isInstalled && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iOS</span>
            </button>
          )}
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-rose-400" />
              <span>{language === 'bn' ? 'আইফোনে ইনস্টল করুন' : 'Install on iPhone / iPad'}</span>
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {language === 'bn' ? (
                <>
                  ১. Safari ব্রাউজারের নিচে থাকা <strong>Share (শেয়ার)</strong> আইকনে চাপ দিন।<br />
                  ২. একটু নিচে স্ক্রল করে <strong>&quot;Add to Home Screen&quot;</strong> সিলেক্ট করুন।
                </>
              ) : (
                <>
                  1. Tap the <strong>Share</strong> button in Safari toolbar.<br />
                  2. Scroll down and choose <strong>&quot;Add to Home Screen&quot;</strong>.
                </>
              )}
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white transition"
            >
              {language === 'bn' ? 'ঠিক আছে' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
