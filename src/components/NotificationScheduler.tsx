import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useLoans } from '@/hooks/useLoans';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useFamilyActivityNotifications } from '@/hooks/useFamilyActivityNotifications';
import { useWebNotifications } from '@/hooks/useWebNotifications';
import { useFCMRegistration } from '@/hooks/useFCMRegistration';
import { CreditCard } from '@/types/finance';

/**
 * Headless component — renders nothing.
 * Mounted in AppContent so notifications are scheduled on every app launch,
 * not only when the user visits the NotificationSettings page.
 */
export function NotificationScheduler() {
  const [cards] = useLocalStorage<CreditCard[]>('kredi-pusula-cards', [] as CreditCard[]);
  const { loans } = useLoans();

  // Hook internally: requests permission on mount, schedules all 15 notification types,
  // and re-schedules on appStateChange (foreground resume).
  usePushNotifications(cards, loans);

  // Web platformda in-app bildirim uretimi (push calismadigi icin)
  useWebNotifications(cards, loans);

  // Family activity notifications — real-time inbox + toast + sound
  // when another family member adds transactions, updates budgets, etc.
  useFamilyActivityNotifications();

  // FCM token kaydı — aile aktifken push notification almak icin
  useFCMRegistration();

  return null;
}
