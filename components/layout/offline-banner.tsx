'use client';

import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    function handleOnline() { setOffline(false); }
    function handleOffline() { setOffline(true); }

    setOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="bg-accent-amber text-black text-[11px] font-medium text-center py-1.5 px-4 z-50">
      You&apos;re offline — calculations work, but AI analysis is unavailable
    </div>
  );
}
