import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  X, 
  HelpCircle, 
  Sliders, 
  FolderCheck, 
  FolderPlus, 
  ArrowRight, 
  Download, 
  ShieldCheck, 
  ExternalLink,
  Info
} from 'lucide-react';
import { storagePreferenceManager } from '../services/storagePreferenceManager';
import { StorageConfig, StorageDestination, Language } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const StorageLocationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [config, setConfig] = useState<StorageConfig>(storagePreferenceManager.getConfig());
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const unsub = storagePreferenceManager.subscribe((c) => {
      setConfig(c);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleSelectDestination = (dest: StorageDestination) => {
    storagePreferenceManager.setDestination(dest);
  };

  const handleTogglePicker = (enabled: boolean) => {
    storagePreferenceManager.setConfig({ useNativePicker: enabled });
  };

  const handleRunPickerTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const testContent = new Blob(
        ['Pro Downloader Storage Test - Successfully configured SD Card / Phone Memory location.'],
        { type: 'text/plain' }
      );
      const res = await storagePreferenceManager.saveFileToUserStorage(
        'downloader_storage_test.txt',
        testContent,
        { forcePicker: true }
      );
      if (res.success) {
        setTestResult(res.message);
      } else {
        setTestResult(res.message || 'ডায়ালগ বাতিল করা হয়েছে');
      }
    } catch (e: any) {
      setTestResult('টেস্ট সম্পন্ন করা যায়নি: ' + e.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div 
      id="storage-location-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-5 sm:p-7 text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>{language === 'bn' ? 'মেমোরি কার্ড ও ফোন স্টোরেজ সেটিংস' : 'Storage & SD Card Destination'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {language === 'bn' ? 'সরাসরি সেভ' : 'Direct Save'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {language === 'bn' 
                ? 'ডাউনলোড করা ভিডিও সরাসরি আপনার মেমোরি কার্ড (SD Card) বা ফোন মেমোরিতে সংরক্ষণ করুন।' 
                : 'Configure where downloaded files are saved: External SD Card or Internal Phone Storage.'}
            </p>
          </div>
        </div>

        {/* Storage Destination Cards */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            {language === 'bn' ? 'প্রাথমিক সেভ লোকেশন নির্বাচন করুন' : 'Select Primary Destination'}
          </label>

          {/* 1. SD Card Option */}
          <div
            onClick={() => handleSelectDestination('sd_card')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all flex items-start justify-between gap-3.5 ${
              config.destination === 'sd_card'
                ? 'bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                : 'bg-slate-950/60 hover:bg-slate-800/40 border-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                config.destination === 'sd_card' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {language === 'bn' ? 'মেমোরি কার্ড (SD Card / External Storage)' : 'MicroSD Card / External Storage'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {language === 'bn' ? 'প্রস্তাবিত (ফোন মেমোরি ফ্রি)' : 'Recommended'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {language === 'bn' 
                    ? 'সব ভিডিও ও অডিও সরাসরি আপনার এক্সটার্নাল মেমোরি কার্ডে সেভ হবে। ফলে ফোনের ইন্টারনাল মেমোরি সবসময় খালি ও দ্রুত থাকবে।' 
                    : 'Downloads go directly to your removable SD Card, keeping internal device storage free.'}
                </p>
                <div className="mt-2 text-[11px] font-mono text-emerald-400/90 flex items-center gap-1.5">
                  <FolderCheck className="w-3.5 h-3.5" />
                  <span>SD Card / Movies / Downloader</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 mt-1">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                config.destination === 'sd_card'
                  ? 'border-emerald-400 bg-emerald-500 text-white'
                  : 'border-slate-600'
              }`}>
                {config.destination === 'sd_card' && <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>
          </div>

          {/* 2. Phone Internal Memory */}
          <div
            onClick={() => handleSelectDestination('phone_memory')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all flex items-start justify-between gap-3.5 ${
              config.destination === 'phone_memory'
                ? 'bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-900 border-blue-500/60 shadow-lg shadow-blue-950/40 ring-1 ring-blue-500/30'
                : 'bg-slate-950/60 hover:bg-slate-800/40 border-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                config.destination === 'phone_memory' 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {language === 'bn' ? 'ফোন মেমোরি (Phone Internal Storage)' : 'Phone Internal Memory'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {language === 'bn'
                    ? 'ফাইলগুলো আপনার ফোনের মূল মেমোরিতে (Downloads বা ডিসিআইএম ফোল্ডারে) সংরক্ষিত হবে।'
                    : 'Files are saved to phone internal storage default Downloads folder.'}
                </p>
                <div className="mt-2 text-[11px] font-mono text-blue-400/90 flex items-center gap-1.5">
                  <FolderCheck className="w-3.5 h-3.5" />
                  <span>Internal Storage / Downloads</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 mt-1">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                config.destination === 'phone_memory'
                  ? 'border-blue-400 bg-blue-500 text-white'
                  : 'border-slate-600'
              }`}>
                {config.destination === 'phone_memory' && <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>
          </div>

          {/* 3. Ask Each Time */}
          <div
            onClick={() => handleSelectDestination('ask_each_time')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all flex items-start justify-between gap-3.5 ${
              config.destination === 'ask_each_time'
                ? 'bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-900 border-purple-500/60 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/30'
                : 'bg-slate-950/60 hover:bg-slate-800/40 border-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                config.destination === 'ask_each_time' 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {language === 'bn' ? 'প্রতিবার জিজ্ঞেস করুন (Ask Destination Every Time)' : 'Ask Location Every Time'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {language === 'bn'
                    ? 'প্রতিটি ফাইল ডাউনলোড করার সময় সিস্টেম ডায়ালগ খুলে মেমোরি কার্ড বা ফোন মেমোরির নির্দিষ্ট ফোল্ডার বেছে নিতে পারবেন।'
                    : 'Prompts system folder/drive dialog to pick SD Card or Phone folder on every download.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 mt-1">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                config.destination === 'ask_each_time'
                  ? 'border-purple-400 bg-purple-500 text-white'
                  : 'border-slate-600'
              }`}>
                {config.destination === 'ask_each_time' && <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </div>

        {/* Browser SD Card Setting Guide (Crucial for Mobile Chrome) */}
        <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {language === 'bn' ? 'মোবাইল ব্রাউজারে মেমোরি কার্ড ডিফল্ট করার সহজ নিয়ম' : 'How to set SD Card in Mobile Chrome'}
            </h4>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">১</span>
              <span>মোবাইলে Chrome ব্রাউজারের উপরে ডানদিকের <strong>৩-ডট (⋮) মেনুতে</strong> চাপ দিয়ে <strong>Settings (সেটিংস)</strong> এ যান।</span>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">২</span>
              <span>নিচে স্ক্রোল করে <strong>Downloads (ডাউনলোড)</strong> অপশনে ট্যাপ করুন।</span>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">৩</span>
              <span><strong>Download location (ডাউনলোড লোকেশন)</strong> এ গিয়ে <strong>SD Card (মেমোরি কার্ড)</strong> সিলেক্ট করুন এবং <strong>"Ask where to save files"</strong> চালু রাখুন।</span>
            </div>
          </div>
        </div>

        {/* Interactive Test & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            id="test-sd-card-picker-btn"
            onClick={handleRunPickerTest}
            disabled={isTesting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 transition shadow-sm active:scale-95"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{isTesting ? 'ডায়ালগ ওপেন হচ্ছে...' : 'মেমোরি কার্ড সেভ ডায়ালগ টেস্ট করুন'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition shadow-lg shadow-emerald-950/40 active:scale-95"
          >
            {language === 'bn' ? 'সেভ ও সম্পন্ন করুন' : 'Save & Done'}
          </button>
        </div>

        {testResult && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{testResult}</span>
          </div>
        )}
      </div>
    </div>
  );
};
