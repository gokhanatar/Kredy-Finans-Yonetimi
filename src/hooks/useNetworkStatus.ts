
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
 