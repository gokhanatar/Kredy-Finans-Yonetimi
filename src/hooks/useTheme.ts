import { useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import type { UserProfile } from '@/types/user';

const ALL_THEME_CLASSES = ['dark', 'sepia', 'elderly', 'girls', 'high-contrast', 'corporate'];

export function useTheme() {
  const { profile, updateProfile } = useUserProfile();
  const theme = profile.theme;

  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove(...ALL_THEME_CLASSES);

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      }
    } else if (theme !== 'light') {
      root.classList.add(theme);
    }
    // 'light' = no class needed (default)
  }, [theme]);

  // Listen for system theme changes when 'system' is selected
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove(...ALL_THEME_CLASSES);
      if (e.matches) {
        root.classList.add('dark');
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (newTheme: UserProfile['theme']) => {
    updateProfile({ theme: newTheme });
  };

  return { theme, setTheme };
}
