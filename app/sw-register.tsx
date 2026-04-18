'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerRegistrar() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Check for waiting worker on page load
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setUpdateAvailable(true);
      }

      // Listen for new service worker installing
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });
    }).catch(() => {});

    // Reload when new SW takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  function handleUpdate() {
    waitingWorker?.postMessage('SKIP_WAITING');
  }

  function handleDismiss() {
    setUpdateAvailable(false);
  }

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 bg-bg-elevated border border-accent-blue/30 rounded-xl shadow-2xl p-3 flex items-center gap-3 animate-in">
      <div className="flex-1">
        <div className="text-xs font-semibold text-text-foreground">Update Available</div>
        <div className="text-[10px] text-text-muted">A new version is ready. Reload to get the latest features.</div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleDismiss}
          className="h-7 px-2 text-[10px] text-text-muted hover:text-text-foreground rounded transition-colors"
        >
          Later
        </button>
        <button
          type="button"
          onClick={handleUpdate}
          className="h-7 px-3 text-[10px] font-medium bg-accent-blue text-white rounded hover:bg-accent-blue/90 transition-colors"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
