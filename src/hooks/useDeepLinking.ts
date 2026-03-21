
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
 