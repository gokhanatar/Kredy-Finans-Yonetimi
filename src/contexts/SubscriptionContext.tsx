import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { iapService } from '@/lib/iapService';
import { isScreenshotMode, migratePromoToScreenshotMode, getTrialInfo } from '@/lib/purchases';

type PlanType = 'monthly' | 'yearly' | 'trial' | null;

interface SubscriptionContextType {
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  subscriptionPlan: PlanType;
  subscriptionExpiresAt: Date | null;
  isNativeIAP: boolean;
  isScreenshotMode: boolean;
  checkPremiumAccess: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

migratePromoToScreenshotMode();

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [subscriptionPlan, setSubscriptionPlan] = useState<PlanType>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<Date | null>(null);
  const [isNativeIAP, setIsNativeIAP] = useState(false);
  const [screenshotMode] = useState(() => isScreenshotMode());

  const checkPremiumAccess = useCallback(async (): Promise<boolean> => {
    // 1. Screenshot mode
    if (isScreenshotMode()) {
      setIsPremium(true);
      setSubscriptionPlan(null);
      setIsTrialActive(false);
      setTrialDaysLeft(0);
      return true;
    }

    // 2. Local trial check
    const trial = getTrialInfo();
    if (trial.isActive) {
      setIsPremium(true);
      setIsTrialActive(true);
      setTrialDaysLeft(trial.daysLeft);
      setSubscriptionPlan('trial');
      setSubscriptionExpiresAt(trial.endDate);
      return true;
    }

    // 3. IAP subscription (5s timeout)
    try {
      const iapPromise = iapService.getActiveSubscription();
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
      const activeSub = await Promise.race([iapPromise, timeoutPromise]);

      if (activeSub && activeSub.isActive) {
        setIsPremium(true);
        setSubscriptionPlan(activeSub.plan);
        setSubscriptionExpiresAt(activeSub.expiresAt);
        setIsTrialActive(activeSub.isTrialPeriod || false);
        if (activeSub.isTrialPeriod && activeSub.expiresAt) {
          const diff = activeSub.expiresAt.getTime() - Date.now();
          setTrialDaysLeft(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
        } else {
          setTrialDaysLeft(0);
        }
        return true;
      }
    } catch {
      // IAP error
    }

    // Not premium
    setIsPremium(false);
    setSubscriptionPlan(null);
    setSubscriptionExpiresAt(null);
    setIsTrialActive(false);
    setTrialDaysLeft(0);
    return false;
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const restored = await iapService.restorePurchases();
      if (restored) {
        await checkPremiumAccess();
      }
      return restored;
    } catch {
      return false;
    }
  }, [checkPremiumAccess]);

  useEffect(() => {
    const init = async () => {
      await checkPremiumAccess();

      if (iapService.isNativeAvailable()) {
        try {
          const initTimeout = new Promise<void>((resolve) => setTimeout(resolve, 5000));
          await Promise.race([iapService.initialize(), initTimeout]);
          setIsNativeIAP(iapService.isPluginReady());
          await checkPremiumAccess();
        } catch {
          setIsNativeIAP(false);
        }
      } else {
        setIsNativeIAP(false);
      }
    };
    init();

    let appListener: { remove: () => void } | null = null;
    const loadAppPlugin = async () => {
      try {
        const { App } = await import('@capacitor/app');
        appListener = await App.addListener('appStateChange', (state) => {
          if (state.isActive) checkPremiumAccess();
        });
      } catch {
        // Web
      }
    };

    if (iapService.isNativeAvailable()) {
      loadAppPlugin();
    }

    return () => { appListener?.remove(); };
  }, [checkPremiumAccess]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isTrialActive,
        trialDaysLeft,
        subscriptionPlan,
        subscriptionExpiresAt,
        isNativeIAP,
        isScreenshotMode: screenshotMode,
        checkPremiumAccess,
        restorePurchases,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}
