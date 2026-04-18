'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'str-install-dismissed';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed in the last 7 days
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 86400_000) return;

    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    function handlePrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  }, []);

  if (!visible) return null;

  return (
    <div className="lg:hidden fixed bottom-20 left-4 right-4 bg-bg-elevated border border-border-light rounded-xl shadow-2xl z-40 p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-accent-blue flex items-center justify-center shrink-0">
        <span className="text-white text-lg font-bold">S</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-text-foreground">Install STR Analyzer</div>
        <div className="text-[10px] text-text-muted">Add to home screen for quick access</div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleDismiss}
          className="h-8 px-2.5 text-[11px] text-text-muted hover:text-text-foreground rounded-md transition-colors"
        >
          Later
        </button>
        <button
          type="button"
          onClick={handleInstall}
          className="h-8 px-3 text-[11px] font-medium bg-accent-blue text-white rounded-md hover:bg-accent-blue/90 transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
}
