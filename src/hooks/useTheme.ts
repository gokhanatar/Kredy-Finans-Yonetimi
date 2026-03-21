
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
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
 