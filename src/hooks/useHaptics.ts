
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
52
53
54
55 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useCallback } from 'react';
 
type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';
 
let hapticsModule: typeof import('@capacitor/haptics') | null = null;
 
async function getHaptics() {
  if (hapticsModule) return hapticsModule;
  try {
    hapticsModule = await import('@capacitor/haptics');
    return hapticsModule;
  } catch {
    return null;
  }
}
 
export function useHaptics() {
  const trigger = useCallback(async (style: HapticStyle = 'light') => {
    try {
      const mod = await getHaptics();
      if (!mod) return;
 
      const { Haptics, ImpactStyle, NotificationType } = mod;
 
      switch (style) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
        case 'selection':
          await Haptics.selectionStart();
          break;
      }
    } catch {
      // Haptics not available (web or unsupported device)
    }
  }, []);
 
  return { trigger };
}
 