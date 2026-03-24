import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ROUTE_MAP: Record<string, string> = {
  'transaction/add': '/wallet',
  'wallet': '/wallet',
  'analytics': '/analytics',
  'family': '/family',
  'family/invite': '/family',
  'menu': '/menu',
  'settings': '/settings',
  'loans': '/loans',
  'investments': '/investments',
  'notifications': '/notification-inbox',
};

export function useDeepLinking() {
  const navigate = useNavigate();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');

        const listener = await App.addListener('appUrlOpen', (event) => {
          const url = event.url;
          // Handle kredy:// scheme
          const path = url.replace(/^kredy:\/\//, '');
          const route = ROUTE_MAP[path];
          if (route) {
            navigate(route);
          }
        });

        cleanup = () => listener.remove();
      } catch {
        // Not on native platform
      }
    })();

    return () => cleanup?.();
  }, [navigate]);
}
