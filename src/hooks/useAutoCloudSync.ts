
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
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121
122
123
124
125
126
127
128
129
130
131
132
133
134
135
136
137
138
139
140
141
142
143
144
145
146
147
148
149
150
151
152
153
154
155
156
157
158
159
160
161
162
163
164
165
166
167
168
169
170
171
172
173
174
175
176
177
178
179
180
181
182
183
184
185
186
187
188
189
190
191
192
193
194
195
196
197
198
199
200
201
202
203
204
205
206
207
208
209
210
211
212
213
214 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
 
const CLOUD_DIRTY = 'cloud-dirty';
const DEBOUNCE_MS = 30_000;
 
interface AutoCloudSyncUser {
  uid: string;
}
 
interface UseAutoCloudSyncOptions {
  user: AutoCloudSyncUser | null;
  enabled: boolean;
  onSyncStart?: () => void;
  onSyncEnd?: (lastBackup: string | null) => void;
  onSyncError?: (error: string) => void;
  onRestoreComplete?: () => void;
}
 
export function useAutoCloudSync({
  user,
  enabled,
  onSyncStart,
  onSyncEnd,
  onSyncError,
  onRestoreComplete,
}: UseAutoCloudSyncOptions) {
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInProgressRef = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
 
  const flushBackup = useCallback(async () => {
    if (!userRef.current || !dirtyRef.current || syncInProgressRef.current || !enabledRef.current) return;
 
    syncInProgressRef.current = true;
    dirtyRef.current = false;
    onSyncStart?.();
 
    try {
      const { saveToCloud, setLocalTimestamp } = await import('@/lib/cloudBackup');
      await saveToCloud(userRef.current.uid);
      const ts = new Date().toISOString();
      setLocalTimestamp(ts);
      onSyncEnd?.(ts);
    } catch (err) {
      dirtyRef.current = true;
      const message = err instanceof Error ? err.message : 'Otomatik yedekleme başarısız';
      onSyncError?.(message);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [onSyncStart, onSyncEnd, onSyncError]);
 
  const checkAndRestore = useCallback(async () => {
    if (!userRef.current || syncInProgressRef.current || !enabledRef.current) return;
 
    syncInProgressRef.current = true;
    onSyncStart?.();
 
    try {
      const {
        getBackupTimestamp,
        loadFromCloud,
        restoreLocalData,
        getLocalTimestamp,
        setLocalTimestamp,
        saveToCloud,
        collectLocalData,
      } = await import('@/lib/cloudBackup');
 
      const cloudTs = await getBackupTimestamp(userRef.current.uid);
      const localTs = getLocalTimestamp();
 
      const localData = collectLocalData();
      const hasLocalData = Object.values(localData.data).some(v => v !== null);
 
      if (!cloudTs && hasLocalData) {
        // No cloud backup, local has data → backup
        await saveToCloud(userRef.current.uid);
        const ts = new Date().toISOString();
        setLocalTimestamp(ts);
        onSyncEnd?.(ts);
      } else if (cloudTs && !hasLocalData) {
        // Cloud exists, no local data (fresh install) → restore
        const backup = await loadFromCloud(userRef.current.uid);
        if (backup) {
          restoreLocalData(backup);
          onSyncEnd?.(backup.timestamp);
          onRestoreComplete?.();
        } else {
          onSyncEnd?.(null);
        }
      } else if (cloudTs && localTs) {
        const cloudDate = new Date(cloudTs).getTime();
        const localDate = new Date(localTs).getTime();
 
        if (cloudDate > localDate) {
          // Cloud newer → restore
          const backup = await loadFromCloud(userRef.current.uid);
          if (backup) {
            restoreLocalData(backup);
            onSyncEnd?.(backup.timestamp);
            onRestoreComplete?.();
          } else {
            onSyncEnd?.(cloudTs);
          }
        } else if (localDate > cloudDate) {
          // Local newer → backup
          await saveToCloud(userRef.current.uid);
          const ts = new Date().toISOString();
          setLocalTimestamp(ts);
          onSyncEnd?.(ts);
        } else {
          // Same → no-op
          onSyncEnd?.(cloudTs);
        }
      } else if (cloudTs && !localTs) {
        // Cloud exists but no local timestamp (first auto-sync for existing user) → backup local
        await saveToCloud(userRef.current.uid);
        const ts = new Date().toISOString();
        setLocalTimestamp(ts);
        onSyncEnd?.(ts);
      } else {
        onSyncEnd?.(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Otomatik senkronizasyon başarısız';
      onSyncError?.(message);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [onSyncStart, onSyncEnd, onSyncError, onRestoreComplete]);
 
  // Listen for cloud-dirty events with debounce
  useEffect(() => {
    if (!user || !enabled) return;
 
    let allKeys: string[] | null = null;
 
    const handleDirty = async (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail;
 
      if (!allKeys) {
        const mod = await import('@/lib/cloudBackup');
        allKeys = mod.ALL_STORAGE_KEYS;
      }
      if (!allKeys.includes(key)) return;
 
      dirtyRef.current = true;
 
      const { setLocalTimestamp } = await import('@/lib/cloudBackup');
      setLocalTimestamp();
 
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flushBackup, DEBOUNCE_MS);
    };
 
    window.addEventListener(CLOUD_DIRTY, handleDirty);
    return () => {
      window.removeEventListener(CLOUD_DIRTY, handleDirty);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, enabled, flushBackup]);
 
  // App lifecycle (Capacitor)
  useEffect(() => {
    if (!user || !enabled) return;
    if (!Capacitor.isNativePlatform()) return;
 
    let listener: { remove: () => void } | null = null;
 
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const l = await App.addListener('appStateChange', async ({ isActive }) => {
          if (!isActive) {
            if (dirtyRef.current && userRef.current) {
              if (timerRef.current) clearTimeout(timerRef.current);
              await flushBackup();
            }
          }
        });
        listener = l;
      } catch { /* web — no Capacitor */ }
    })();
 
    return () => { listener?.remove(); };
  }, [user, enabled, flushBackup]);
 
  // Initial sync on login / app launch
  const hasRunInitialSync = useRef(false);
 
  useEffect(() => {
    if (!user || !enabled) {
      hasRunInitialSync.current = false;
      return;
    }
    if (hasRunInitialSync.current) return;
    hasRunInitialSync.current = true;
 
    const timer = setTimeout(() => {
      checkAndRestore();
    }, 1500);
 
    return () => clearTimeout(timer);
  }, [user, enabled, checkAndRestore]);
 
  return { flushBackup, checkAndRestore };
}
 