
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
215
216
217
218
219
220
221
222
223
224
225
226
227
228
229
230
231
232
233
234
235
236
237
238
239
240
241
242
243
244
245
246
247
248
249
250
251
252
253
254
255
256
257
258
259
260
261
262
263
264
265
266
267
268
269
270
271
272
273
274
275
276
277
278
279
280
281
282
283
284
285
286
287
288
289
290
291
292
293
294
295
296
297
298
299
300
301
302
303
304
305
306
307
308
309
310
311
312
313
314
315
316
317
318
319
320
321
322
323
324
325
326
327
328
329
330
331
332
333
334
335
336
337
338
339
340
341
342
343
344
345
346
347
348
349
350
351
352
353
354
355
356
357
358
359
360
361
362
363
364
365
366
367
368
369
370
371
372
373
374
375
376
377
378
379
380
381
382
383
384
385
386
387
388
389
390
391
392
393
394
395
396
397
398
399
400
401
402
403
404
405 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useFamilySync } from '@/contexts/FamilySyncContext';
import { useNotificationInbox } from '@/hooks/useNotificationInbox';
import { FAMILY_STORAGE_KEYS, ALL_CATEGORIES } from '@/types/familyFinance';
import { playNotificationSound } from '@/lib/notificationSoundService';
import { toast } from '@/hooks/use-toast';
 
export const FAMILY_REMOTE_UPDATE_EVENT = 'family-remote-update';
 
// Sistem bildirimi gonder (native platformda — uygulama arka plandayken de gorunur)
let systemNotifIdCounter = 50000;
async function sendSystemNotification(title: string, body: string, sound: string = 'kredy_info.wav') {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const id = systemNotifIdCounter++;
    if (systemNotifIdCounter > 59999) systemNotifIdCounter = 50000;
    await LocalNotifications.schedule({
      notifications: [{
        id,
        title,
        body,
        schedule: { at: new Date(Date.now() + 500) },
        sound,
        actionTypeId: 'family-activity',
      }],
    });
  } catch { /* web — no Capacitor */ }
}
 
function getCategoryLabel(categoryId: string): string {
  return ALL_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
}
 
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
 
/**
 * Headless hook — listens for family data changes from other members
 * and creates inbox notifications + toasts + sounds.
 *
 * Covers:
 * - Transactions (expense/income)
 * - Goal contributions
 * - Budget updates
 * - Account updates
 * - Member join/leave
 */
const NOTIFICATION_SETTINGS_KEY = 'kredi-pusula-notification-settings';
 
function isFamilyActivityEnabled(): boolean {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!stored) return true; // Default on
    const settings = JSON.parse(stored);
    return settings.familyActivityNotification !== false && settings.enabled !== false;
  } catch {
    return true;
  }
}
 
export function useFamilyActivityNotifications() {
  const { isConnected, memberId, members } = useFamilySync();
  const { addNotification } = useNotificationInbox();
 
  // --- Refs for tracking state ---
  const knownTxIdsRef = useRef<Set<string>>(new Set());
  const knownGoalAmountsRef = useRef<Map<string, number>>(new Map());
  const initializedKeysRef = useRef<Set<string>>(new Set());
  const lastNotifiedKeyRef = useRef<Map<string, number>>(new Map());
  const knownMemberIdsRef = useRef<Set<string> | null>(null);
  const lastSoundTimeRef = useRef(0);
 
  // Initialize known IDs from localStorage on mount
  // Bu sayede uygulama acildiginda zaten var olan islemler icin bildirim gitmez,
  // sadece YENI eklenenler icin bildirim gider.
  useEffect(() => {
    try {
      const txStored = localStorage.getItem(FAMILY_STORAGE_KEYS.TRANSACTIONS);
      if (txStored) {
        const txs = JSON.parse(txStored);
        if (Array.isArray(txs)) {
          txs.forEach((tx: any) => {
            if (tx.id) knownTxIdsRef.current.add(tx.id);
          });
        }
      }
      // Transactions key'ini baslatilmis olarak isaretle — localStorage'dan okuduk
      initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.TRANSACTIONS);
    } catch { /* ignore */ }
 
    try {
      const goalStored = localStorage.getItem(FAMILY_STORAGE_KEYS.GOALS);
      if (goalStored) {
        const goals = JSON.parse(goalStored);
        if (Array.isArray(goals)) {
          goals.forEach((g: any) => {
            if (g.id) knownGoalAmountsRef.current.set(g.id, g.currentAmount || 0);
          });
        }
      }
      // Goals key'ini baslatilmis olarak isaretle
      initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.GOALS);
    } catch { /* ignore */ }
 
    // Diger key'leri de baslatilmis olarak isaretle — ilk event yutulmasin
    initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.BUDGETS);
    initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.ACCOUNTS);
    initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.SUBSCRIPTIONS);
    initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.RECURRING_EXPENSES);
    if (FAMILY_STORAGE_KEYS.MONTHLY_BILLS) {
      initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.MONTHLY_BILLS);
    }
  }, []);
 
  // --- Member join/leave tracking ---
  useEffect(() => {
    if (!isConnected || !memberId) return;
 
    const currentIds = new Set(Object.keys(members));
 
    // First render — initialize without notifying
    if (knownMemberIdsRef.current === null) {
      knownMemberIdsRef.current = currentIds;
      return;
    }
 
    if (!isFamilyActivityEnabled()) {
      knownMemberIdsRef.current = currentIds;
      return;
    }
 
    // Detect new members
    for (const id of currentIds) {
      if (!knownMemberIdsRef.current.has(id) && id !== memberId) {
        const member = members[id];
        if (member) {
          const t = `${member.name} aileye katıldı!`;
          const m = 'Yeni bir aile üyesi gruba katıldı';
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          toast({ title: t, description: m });
          sendSystemNotification(t, m, 'kredy_positive.wav');
          playNotificationSound('positive');
        }
      }
    }
 
    // Detect left members
    for (const id of knownMemberIdsRef.current) {
      if (!currentIds.has(id) && id !== memberId) {
        addNotification({
          title: 'Bir üye aileden ayrıldı',
          message: 'Bir aile üyesi gruptan ayrıldı',
          type: 'family',
          severity: 'info',
        });
      }
    }
 
    knownMemberIdsRef.current = currentIds;
  }, [isConnected, memberId, members, addNotification]);
 
  // --- Listen for remote data updates (transactions, goals, budgets, accounts) ---
  useEffect(() => {
    if (!isConnected || !memberId) return;
 
    const playSoundThrottled = (group: 'info' | 'positive') => {
      if (Date.now() - lastSoundTimeRef.current > 3000) {
        playNotificationSound(group);
        lastSoundTimeRef.current = Date.now();
      }
    };
 
    function handleRemoteUpdate(e: Event) {
      console.log('[FamilyNotif] EVENT RECEIVED:', (e as CustomEvent).detail?.key);
      if (!isFamilyActivityEnabled()) {
        console.log('[FamilyNotif] Bildirimler kapali, atlaniyor');
        return;
      }
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const { key, updatedBy, data } = detail;
      if (!key || !updatedBy || data == null) {
        console.log('[FamilyNotif] Eksik data, atlaniyor:', { key, updatedBy, hasData: data != null });
        return;
      }
      console.log('[FamilyNotif] PROCESSING: key=' + key + ', updatedBy=' + updatedBy + ', dataLength=' + (Array.isArray(data) ? data.length : 'N/A'));
 
      const memberName = members[updatedBy]?.name || 'Bir aile üyesi';
 
      // ==================== TRANSACTIONS ====================
      if (key === FAMILY_STORAGE_KEYS.TRANSACTIONS && Array.isArray(data)) {
        if (!initializedKeysRef.current.has(key)) {
          // Ilk event — mevcut ID'leri kaydet + key'i isaretle
          data.forEach((tx: any) => {
            if (tx.id) knownTxIdsRef.current.add(tx.id);
          });
          initializedKeysRef.current.add(key);
          // Mount'ta localStorage'dan okuyamadiysa buraya duser
          // Ama yine de devam et — belki yeni tx var
        }
 
        const newTxs = data.filter(
          (tx: any) => tx.id && !knownTxIdsRef.current.has(tx.id) && tx.createdBy !== memberId
        );
 
        // Update known IDs
        data.forEach((tx: any) => {
          if (tx.id) knownTxIdsRef.current.add(tx.id);
        });
 
        if (newTxs.length === 0) return;
 
        if (newTxs.length <= 3) {
          for (const tx of newTxs) {
            const txMember = tx.createdBy
              ? (members[tx.createdBy]?.name || memberName)
              : memberName;
            const cat = getCategoryLabel(tx.category);
            const amt = formatAmount(tx.amount);
 
            if (tx.type === 'expense') {
              const t = `${txMember} harcama yaptı`;
              const m = `${cat} için ${amt} TL harcadı`;
              addNotification({ title: t, message: m, type: 'family', severity: 'info' });
              toast({ title: t, description: `${cat} — ${amt} TL` });
              sendSystemNotification(t, m, 'kredy_info.wav');
            } else {
              const t = `${txMember} gelir ekledi`;
              const m = `${cat}: ${amt} TL`;
              addNotification({ title: t, message: m, type: 'family', severity: 'info' });
              toast({ title: t, description: `${cat} — ${amt} TL` });
              sendSystemNotification(t, m, 'kredy_positive.wav');
            }
          }
        } else {
          // Batch notification
          const total = newTxs.reduce((s: number, tx: any) => s + (tx.amount || 0), 0);
          const t = `${memberName} ${newTxs.length} işlem ekledi`;
          const m = `Toplam: ${formatAmount(total)} TL`;
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          toast({ title: t, description: m });
          sendSystemNotification(t, m, 'kredy_info.wav');
        }
 
        playSoundThrottled('info');
        return;
      }
 
      // ==================== GOALS ====================
      if (key === FAMILY_STORAGE_KEYS.GOALS && Array.isArray(data)) {
        if (!initializedKeysRef.current.has(key)) {
          data.forEach((g: any) => {
            if (g.id) knownGoalAmountsRef.current.set(g.id, g.currentAmount || 0);
          });
          initializedKeysRef.current.add(key);
          // Mount'ta okunamadiysa buraya duser, ama devam et
        }
 
        // Dedup: 30-second window
        const lastNotified = lastNotifiedKeyRef.current.get(key);
        if (lastNotified && Date.now() - lastNotified < 30000) {
          data.forEach((g: any) => {
            if (g.id) knownGoalAmountsRef.current.set(g.id, g.currentAmount || 0);
          });
          return;
        }
 
        let notified = false;
        for (const goal of data) {
          const prev = knownGoalAmountsRef.current.get(goal.id);
          if (prev !== undefined && goal.currentAmount > prev) {
            const diff = goal.currentAmount - prev;
            const t = `${memberName} hedefe katkı yaptı`;
            const m = `"${goal.name}" hedefine ${formatAmount(diff)} TL ekledi`;
            addNotification({ title: t, message: m, type: 'family', severity: 'info' });
            toast({ title: t, description: `"${goal.name}" — ${formatAmount(diff)} TL` });
            sendSystemNotification(t, m, 'kredy_positive.wav');
            notified = true;
          }
        }
 
        data.forEach((g: any) => {
          if (g.id) knownGoalAmountsRef.current.set(g.id, g.currentAmount || 0);
        });
 
        if (notified) {
          lastNotifiedKeyRef.current.set(key, Date.now());
          playSoundThrottled('positive');
        }
        return;
      }
 
      // ==================== BUDGETS ====================
      if (key === FAMILY_STORAGE_KEYS.BUDGETS) {
        if (!initializedKeysRef.current.has(key)) {
          initializedKeysRef.current.add(key);
        }
 
        const lastNotified = lastNotifiedKeyRef.current.get(key);
        if (lastNotified && Date.now() - lastNotified < 30000) return;
 
        {
          const t = `${memberName} bütçeyi güncelledi`;
          const m = 'Aile bütçesinde değişiklik yapıldı';
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          toast({ title: t, description: m });
          sendSystemNotification(t, m, 'kredy_info.wav');
        }
        lastNotifiedKeyRef.current.set(key, Date.now());
        playSoundThrottled('info');
        return;
      }
 
      // ==================== ACCOUNTS ====================
      if (key === FAMILY_STORAGE_KEYS.ACCOUNTS) {
        if (!initializedKeysRef.current.has(key)) {
          initializedKeysRef.current.add(key);
        }
 
        const lastNotified = lastNotifiedKeyRef.current.get(key);
        if (lastNotified && Date.now() - lastNotified < 30000) return;
 
        {
          const t = `${memberName} hesapları güncelledi`;
          const m = 'Aile hesap bilgilerinde değişiklik yapıldı';
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          sendSystemNotification(t, m, 'kredy_info.wav');
        }
        lastNotifiedKeyRef.current.set(key, Date.now());
        playSoundThrottled('info');
        return;
      }
 
      // ==================== SUBSCRIPTIONS ====================
      if (key === FAMILY_STORAGE_KEYS.SUBSCRIPTIONS) {
        if (!initializedKeysRef.current.has(key)) {
          initializedKeysRef.current.add(key);
        }
 
        const lastNotified = lastNotifiedKeyRef.current.get(key);
        if (lastNotified && Date.now() - lastNotified < 30000) return;
 
        {
          const t = `${memberName} abonelikleri güncelledi`;
          const m = 'Aile abonelik bilgilerinde değişiklik yapıldı';
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          sendSystemNotification(t, m, 'kredy_info.wav');
        }
        lastNotifiedKeyRef.current.set(key, Date.now());
        playSoundThrottled('info');
        return;
      }
 
      // ==================== RECURRING EXPENSES ====================
      if (key === FAMILY_STORAGE_KEYS.RECURRING_EXPENSES) {
        if (!initializedKeysRef.current.has(key)) {
          initializedKeysRef.current.add(key);
        }
 
        const lastNotified = lastNotifiedKeyRef.current.get(key);
        if (lastNotified && Date.now() - lastNotified < 30000) return;
 
        {
          const t = `${memberName} düzenli giderleri güncelledi`;
          const m = 'Aile düzenli gider bilgilerinde değişiklik yapıldı';
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          sendSystemNotification(t, m, 'kredy_info.wav');
        }
        lastNotifiedKeyRef.current.set(key, Date.now());
        playSoundThrottled('info');
        return;
      }
 
      // ==================== RECURRING BILLS ====================
      if (key === FAMILY_STORAGE_KEYS.MONTHLY_BILLS) {
        if (!initializedKeysRef.current.has(key)) {
          initializedKeysRef.current.add(key);
        }
 
        const lastNotified = lastNotifiedKeyRef.current.get(key);
        if (lastNotified && Date.now() - lastNotified < 30000) return;
 
        {
          const t = `${memberName} faturaları güncelledi`;
          const m = 'Aile fatura bilgilerinde değişiklik yapıldı';
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          sendSystemNotification(t, m, 'kredy_info.wav');
        }
        lastNotifiedKeyRef.current.set(key, Date.now());
        playSoundThrottled('info');
        return;
      }
    }
 
    window.addEventListener(FAMILY_REMOTE_UPDATE_EVENT, handleRemoteUpdate);
    return () => window.removeEventListener(FAMILY_REMOTE_UPDATE_EVENT, handleRemoteUpdate);
  }, [isConnected, memberId, members, addNotification]);
}
 