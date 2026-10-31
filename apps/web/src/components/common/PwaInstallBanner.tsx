import React, { useState, useEffect } from 'react';
import { Download, X, WifiOff, Share2, PlusSquare } from 'lucide-react';
import { usePwa } from '../../context/PwaContext';
import { useApp } from '../../context/AppContext';

export const PwaInstallBanner: React.FC = () => {
  const { canInstall, isInstalled, isOnline, promptInstall, showInstallBanner, dismissInstallBanner } = usePwa();
  const { language } = useApp();
  const isHi = language === 'hi';

  const [isIos, setIsIos] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS device (Safari doesn't support beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const dismissedIos = localStorage.getItem('greenagro_ios_pwa_dismissed');
    if (isIosDevice && !isInstalled && !dismissedIos) {
      setShowIosPrompt(true);
    }
  }, [isInstalled]);

  const dismissIos = () => {
    setShowIosPrompt(false);
    localStorage.setItem('greenagro_ios_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* 1. Offline Indicator Bar */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>
            {isHi
              ? 'आप अभी ऑफलाइन हैं — कैश्ड डेटा व पिछले मौसम रिकॉर्ड प्रदर्शित किए जा रहे हैं।'
              : 'You are offline — viewing cached farm intelligence & last known telemetry.'}
          </span>
        </div>
      )}

      {/* 2. Chrome / Android / Desktop PWA Install Banner */}
      {canInstall && showInstallBanner && !isInstalled && (
        <div className="fixed bottom-18 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 bg-white/95 backdrop-blur-md border border-emerald-300 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-agri-800 p-1 shrink-0 shadow-xs">
              <img
                src="/pwa-192x192.png"
                alt="GreenAgro"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                GreenAgro
              </h4>
              <p className="text-[11px] text-gray-500 leading-tight">
                {isHi ? 'बिना इंटरनेट तेज गति हेतु ऐप इंस्टॉल करें' : 'Install app for fast offline access'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={promptInstall}
              className="px-3 py-1.5 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isHi ? 'इंस्टॉल' : 'Install'}</span>
            </button>
            <button
              onClick={dismissInstallBanner}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. iOS Safari Add to Home Screen Guidance */}
      {isIos && showIosPrompt && !isInstalled && (
        <div className="fixed bottom-18 left-3 right-3 z-40 bg-white/95 backdrop-blur-md border border-emerald-300 rounded-2xl p-4 shadow-2xl space-y-2 animate-in slide-in-from-top-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-agri-800 p-0.5 shrink-0 shadow-xs">
                <img src="/pwa-192x192.png" alt="GreenAgro" className="w-full h-full object-contain rounded" />
              </div>
              <span className="text-xs font-bold text-gray-900">
                {isHi ? 'आईफोन में ऐप इंस्टॉल करें' : 'Install on iPhone / iPad'}
              </span>
            </div>
            <button
              onClick={dismissIos}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            {isHi ? (
              <>
                नीचे सफारी में <Share2 className="inline w-3 h-3 text-agri-700" /> शेयर बटन दबाएं, फिर{' '}
                <span className="font-bold text-gray-900">&quot;Add to Home Screen <PlusSquare className="inline w-3 h-3 text-agri-700" />&quot;</span> चुनें।
              </>
            ) : (
              <>
                Tap the Safari share icon <Share2 className="inline w-3 h-3 text-agri-700" /> below and select{' '}
                <span className="font-bold text-gray-900">&quot;Add to Home Screen <PlusSquare className="inline w-3 h-3 text-agri-700" />&quot;</span>.
              </>
            )}
          </p>
        </div>
      )}
    </>
  );
};

export default PwaInstallBanner;
