
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { NOTIFICATION_INBOX_ADD, markReactReady } from '@/lib/notificationBridge';
import type { NotificationInboxPayload } from '@/lib/notificationBridge';
 
export type NotificationType = 'payment' | 'golden' | 'tax' | 'inspection' | 'rent' | 'budget' | 'goal' | 'subscription' | 'overdue' | 'bill' | 'family';
export type NotificationSeverity = 'info' | 'warning' | 'danger';
 
export interface InboxNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  isRead: boolean;
  isDone: boolean;
  severity: NotificationSeverity;
  relatedAssetId?: string;
  assetType?: 'card' | 'loan' | 'bill';
  assetId?: string;
}
 
const STORAGE_KEY = 'kredi-pusula-notification-inbox';
const DEDUP_WINDOW_MS = 60_000; // 60s — received + actionPerformed icin dedup
 
export function useNotificationInbox() {
  const [notifications, setNotifications] = useLocalStorage<InboxNotification[]>(STORAGE_KEY, []);
 
  // Deduplication: son eklenen notificationId + timestamp
  const recentIds = useRef<Map<number, number>>(new Map());
 
  const addNotification = useCallback((data: Omit<InboxNotification, 'id' | 'createdAt' | 'isRead' | 'isDone'>) => {
    const notification: InboxNotification = {
      ...data,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
      isRead: false,
      isDone: false,
    };
    setNotifications(prev => [notification, ...prev].slice(0, 100)); // max 100
  }, [setNotifications]);
 
  // CustomEvent listener — Capacitor bridge'den gelen bildirimler
  useEffect(() => {
    function handleInboxAdd(e: Event) {
      const detail = (e as CustomEvent<NotificationInboxPayload>).detail;
      if (!detail) return;
 
      // Dedup: ayni notificationId 60s icinde tekrar geldiyse atla
      const now = Date.now();
      const lastSeen = recentIds.current.get(detail.notificationId);
      if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) return;
      recentIds.current.set(detail.notificationId, now);
 
      // Eski entry'leri temizle
      for (const [id, ts] of recentIds.current) {
        if (now - ts > DEDUP_WINDOW_MS) recentIds.current.delete(id);
      }
 
      addNotification({
        title: detail.title,
        message: detail.message,
        type: detail.type,
        severity: detail.severity,
        ...(detail.assetType && { assetType: detail.assetType }),
        ...(detail.assetId && { assetId: detail.assetId }),
      });
    }
 
    window.addEventListener(NOTIFICATION_INBOX_ADD, handleInboxAdd);
 
    // Buffered event'leri flush et
    markReactReady();
 
    return () => {
      window.removeEventListener(NOTIFICATION_INBOX_ADD, handleInboxAdd);
    };
  }, [addNotification]);
 
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };
 
  const markAsDone = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isDone: true, isRead: true } : n));
  };
 
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
 
  const clearAll = () => setNotifications([]);
 
  const unreadCount = notifications.filter(n => !n.isRead).length;
 
  return { notifications, addNotification, markAsRead, markAsDone, deleteNotification, clearAll, unreadCount };
}
 