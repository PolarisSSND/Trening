'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share, X, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Overenie či je aplikácia už spustená ako PWA (standalone)
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isInStandaloneMode);

    if (isInStandaloneMode) return;

    // Detekcia iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Overenie či používateľ už banner nezavrel počas tejto relácie
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) return;

    // Pre Android / Desktop Chrome zachytenie beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Na iOS zobrazíme inštalačný banner po 3 sekundách, ak ešte nie je nainštalované
    if (isIosDevice && !isInStandaloneMode) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto animate-fade-in-up">
      <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-4 shadow-xl shadow-black/40 text-slate-100 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20">
          <Download className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">Nainštalovať aplikáciu</h4>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              aria-label="Zatvoriť"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isIOS ? (
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Pre inštaláciu na iPhone klepnite na ikonu{' '}
              <Share className="inline w-3.5 h-3.5 text-sky-400 mx-0.5" /> v Safari a vyberte{' '}
              <strong className="text-white">„Pridať na plochu“</strong>{' '}
              <PlusSquare className="inline w-3.5 h-3.5 text-emerald-400 mx-0.5" />.
            </p>
          ) : (
            <div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Pridajte si aplikáciu na plochu pre okamžitý prístup k tréningom a dochádzke.
              </p>
              <button
                onClick={handleInstallClick}
                className="mt-2.5 w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-emerald-500/30"
              >
                <Download className="w-3.5 h-3.5" />
                Inštalovať na plochu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
