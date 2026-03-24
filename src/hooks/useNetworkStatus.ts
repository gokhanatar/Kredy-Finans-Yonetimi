import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    // Try Capacitor Network plugin first
    (async () => {
      try {
        const { Network } = await import('@capacitor/network');
        const status = await Network.getStatus();
        setIsOnline(status.connected);

        const listener = await Network.addListener('networkStatusChange', (s) => {
          setIsOnline(s.connected);
        });
        cleanup = () => listener.remove();
      } catch {
        // Fallback to browser API
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        cleanup = () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
    })();

    return () => cleanup?.();
  }, []);

  return { isOnline };
}
