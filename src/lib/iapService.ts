/**
 * Native In-App Purchase Service
 * @capgo/native-purchases — StoreKit 2 (iOS) + Google Play Billing (Android)
 * Web'de graceful fallback
 */

const PRODUCT_IDS = {
  monthly: 'com.finansatlas.app.pro.monthly',
  yearly: 'com.finansatlas.app.pro.yearly',
};

// Android base plan identifiers (Google Play Console)
const ANDROID_PLANS = {
  monthly: 'monthly-base',
  yearly: 'yearly-base',
};

export interface IAPProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
  period: 'monthly' | 'yearly';
}

export interface ActiveSubscription {
  productId: string;
  plan: 'monthly' | 'yearly';
  expiresAt: Date | null;
  isActive: boolean;
  isTrialPeriod?: boolean;
}

const DEFAULT_PRODUCTS: IAPProduct[] = [
  {
    id: PRODUCT_IDS.monthly,
    title: 'Aylık Pro',
    description: 'Aylık abonelik',
    price: '$1,99',
    priceAmount: 1.99,
    currency: 'USD',
    period: 'monthly',
  },
  {
    id: PRODUCT_IDS.yearly,
    title: 'Yıllık Pro',
    description: 'Yıllık abonelik',
    price: '$19,99',
    priceAmount: 19.99,
    currency: 'USD',
    period: 'yearly',
  },
];

let pluginInstance: any = null;
let storeKitPlugin: any = null;
let initialized = false;
let pluginAvailable = false;
let cachedProducts: IAPProduct[] | null = null;

const isNativePlatform = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (window as any).Capacitor?.isNativePlatform?.() === true;
};

const getPlatform = (): 'ios' | 'android' | 'web' => {
  if (typeof window === 'undefined') return 'web';
  return (window as any).Capacitor?.getPlatform?.() || 'web';
};

const loadPlugin = async (): Promise<any> => {
  if (pluginInstance) return pluginInstance;
  try {
    const { NativePurchases } = await import('@capgo/native-purchases');
    pluginInstance = NativePurchases;
    return pluginInstance;
  } catch {
    return null;
  }
};

let playBillingPlugin: any = null;

const loadStoreKitPlugin = async (): Promise<any> => {
  if (storeKitPlugin) return storeKitPlugin;
  if (getPlatform() !== 'ios') return null;
  try {
    const { registerPlugin } = await import('@capacitor/core');
    storeKitPlugin = registerPlugin('StoreKit');
    return storeKitPlugin;
  } catch {
    return null;
  }
};

const loadPlayBillingPlugin = async (): Promise<any> => {
  if (playBillingPlugin) return playBillingPlugin;
  if (getPlatform() !== 'android') return null;
  try {
    const { registerPlugin } = await import('@capacitor/core');
    playBillingPlugin = registerPlugin('PlayBilling');
    return playBillingPlugin;
  } catch {
    return null;
  }
};

class IAPService {
  isNativeAvailable(): boolean {
    return isNativePlatform();
  }

  isPluginReady(): boolean {
    return pluginAvailable;
  }

  async initialize(): Promise<void> {
    if (initialized || !this.isNativeAvailable()) return;

    try {
      const plugin = await loadPlugin();
      if (!plugin) {
        pluginAvailable = false;
        return;
      }

      const { isBillingSupported } = await plugin.isBillingSupported();
      if (!isBillingSupported) {
        pluginAvailable = false;
        return;
      }

      // Listen for transaction updates (iOS)
      plugin.addListener('transactionUpdated', (tx: any) => {
        if (tx?.productIdentifier) {
          this.processTransaction(tx);
        }
      });

      pluginAvailable = true;
      initialized = true;
    } catch {
      pluginAvailable = false;
    }
  }

  async getProducts(): Promise<IAPProduct[]> {
    if (cachedProducts) return cachedProducts;

    if (!pluginAvailable) {
      cachedProducts = DEFAULT_PRODUCTS;
      return DEFAULT_PRODUCTS;
    }

    try {
      const plugin = await loadPlugin();
      if (!plugin) return DEFAULT_PRODUCTS;

      const { products } = await plugin.getProducts({
        productIdentifiers: [PRODUCT_IDS.monthly, PRODUCT_IDS.yearly],
        productType: 'subs',
      });

      if (!products || products.length === 0) {
        cachedProducts = DEFAULT_PRODUCTS;
        return DEFAULT_PRODUCTS;
      }

      cachedProducts = products.map((p: any) => ({
        id: p.identifier,
        title: p.title || '',
        description: p.description || '',
        price: p.priceString || `${p.currencySymbol || ''}${p.price}`,
        priceAmount: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
        currency: p.currencyCode || 'TRY',
        period: p.identifier === PRODUCT_IDS.yearly ? 'yearly' as const : 'monthly' as const,
      }));

      return cachedProducts;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  }

  async purchaseMonthly(): Promise<boolean> {
    return this.purchase(PRODUCT_IDS.monthly, ANDROID_PLANS.monthly);
  }

  async purchaseYearly(): Promise<boolean> {
    return this.purchase(PRODUCT_IDS.yearly, ANDROID_PLANS.yearly);
  }

  private async purchase(productId: string, androidPlanId: string): Promise<boolean> {
    if (!pluginAvailable) return false;

    try {
      const plugin = await loadPlugin();
      if (!plugin) return false;

      const platform = getPlatform();
      const options: any = {
        productIdentifier: productId,
        productType: 'subs',
        quantity: 1,
      };

      // Android requires planIdentifier for subscriptions
      if (platform === 'android') {
        options.planIdentifier = androidPlanId;
      }

      const tx = await plugin.purchaseProduct(options);

      if (tx?.transactionId || tx?.purchaseToken) {
        this.processTransaction(tx);
        return true;
      }

      return false;
    } catch (err: any) {
      // User cancelled
      if (
        err?.code === 'USER_CANCELLED' ||
        err?.code === 'userCancelled' ||
        err?.message?.includes('cancel')
      ) {
        return false;
      }
      throw err;
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (!pluginAvailable) return false;

    try {
      const plugin = await loadPlugin();
      if (!plugin) return false;

      // restorePurchases() returns void — then check getPurchases()
      await plugin.restorePurchases();

      const { purchases } = await plugin.getPurchases({ productType: 'subs' });

      if (purchases && purchases.length > 0) {
        const active = this.findActiveSubscription(purchases);
        if (active) {
          this.processTransaction(active);
          return true;
        }
      }

      this.clearLocalSubscription();
      return false;
    } catch {
      return false;
    }
  }

  async getActiveSubscription(): Promise<ActiveSubscription | null> {
    // Check localStorage cache first
    const localSub = this.getLocalSubscription();
    if (localSub && localSub.isActive) return localSub;

    if (!pluginAvailable) return null;

    try {
      const plugin = await loadPlugin();
      if (!plugin) return null;

      const { purchases } = await plugin.getPurchases({ productType: 'subs' });

      if (!purchases || purchases.length === 0) {
        this.clearLocalSubscription();
        return null;
      }

      const activeTx = this.findActiveSubscription(purchases);

      if (activeTx) {
        const plan = activeTx.productIdentifier === PRODUCT_IDS.yearly ? 'yearly' as const : 'monthly' as const;
        const expiresAt = activeTx.expirationDate ? new Date(activeTx.expirationDate) : null;
        const isActive = expiresAt ? expiresAt > new Date() : true;

        if (isActive) {
          this.saveSubscriptionLocally(plan, expiresAt, activeTx.isTrialPeriod);
          return {
            productId: activeTx.productIdentifier,
            plan,
            expiresAt,
            isActive: true,
            isTrialPeriod: activeTx.isTrialPeriod || false,
          };
        }
      }

      this.clearLocalSubscription();
      return null;
    } catch {
      return this.getLocalSubscription();
    }
  }

  async manageSubscriptions(): Promise<void> {
    if (!pluginAvailable) return;
    try {
      const plugin = await loadPlugin();
      if (plugin) await plugin.manageSubscriptions();
    } catch {
      // Silently fail
    }
  }

  async redeemOfferCode(): Promise<boolean> {
    const platform = getPlatform();

    if (platform === 'ios') {
      // iOS: Native StoreKit Offer Code Redeem Sheet
      try {
        const sk = await loadStoreKitPlugin();
        if (!sk) return false;

        const result = await sk.presentOfferCodeRedeemSheet();

        // After redemption, check for active subscription
        if (result?.purchases?.length > 0) {
          const active = this.findActiveSubscription(result.purchases);
          if (active) {
            this.processTransaction(active);
            return true;
          }
        }

        // Also check via main plugin (transaction listener may have fired)
        await new Promise(r => setTimeout(r, 2000));
        const sub = await this.getActiveSubscription();
        return sub?.isActive === true;
      } catch (err: any) {
        if (err?.message?.includes('cancel')) return false;
        throw err;
      }
    }

    if (platform === 'android') {
      // Android: Native Play Store promo code redemption via PlayBillingPlugin
      try {
        const pb = await loadPlayBillingPlugin();
        if (pb) {
          await pb.redeemPromoCode({});
          // Wait for Play Store to process, then check subscription
          await new Promise(r => setTimeout(r, 3000));
          const restored = await this.restorePurchases();
          return restored;
        }
      } catch {
        // Fallback: open Play Store redeem page in browser
      }
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: 'https://play.google.com/redeem' });
        return true;
      } catch {
        window.open('https://play.google.com/redeem', '_blank');
        return true;
      }
    }

    return false;
  }

  // --- private helpers ---

  private findActiveSubscription(purchases: any[]): any {
    return purchases.find((p: any) =>
      (p.productIdentifier === PRODUCT_IDS.monthly || p.productIdentifier === PRODUCT_IDS.yearly) &&
      (p.isActive === true || p.purchaseState === '1' || p.subscriptionState === 'subscribed' || p.subscriptionState === 'inGracePeriod')
    ) || null;
  }

  private processTransaction(tx: any) {
    if (!tx?.productIdentifier) return;
    if (tx.productIdentifier !== PRODUCT_IDS.monthly && tx.productIdentifier !== PRODUCT_IDS.yearly) return;

    const plan = tx.productIdentifier === PRODUCT_IDS.yearly ? 'yearly' as const : 'monthly' as const;
    const expiresAt = tx.expirationDate ? new Date(tx.expirationDate) : null;
    this.saveSubscriptionLocally(plan, expiresAt, tx.isTrialPeriod);
  }

  // --- localStorage helpers ---

  private saveSubscriptionLocally(plan: 'monthly' | 'yearly', expiresAt?: Date | null, isTrialPeriod?: boolean) {
    const data = {
      plan,
      activatedAt: new Date().toISOString(),
      expiresAt: expiresAt?.toISOString() || null,
      isTrialPeriod: isTrialPeriod || false,
    };
    localStorage.setItem('kredi-pusula-iap-subscription', JSON.stringify(data));
  }

  private getLocalSubscription(): ActiveSubscription | null {
    try {
      const raw = localStorage.getItem('kredi-pusula-iap-subscription');
      if (!raw) return null;
      const data = JSON.parse(raw);

      const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
      const isActive = expiresAt ? expiresAt > new Date() : true;

      if (!isActive) return null;

      return {
        productId: data.plan === 'yearly' ? PRODUCT_IDS.yearly : PRODUCT_IDS.monthly,
        plan: data.plan,
        expiresAt,
        isActive: true,
        isTrialPeriod: data.isTrialPeriod || false,
      };
    } catch {
      return null;
    }
  }

  private clearLocalSubscription() {
    localStorage.removeItem('kredi-pusula-iap-subscription');
  }
}

export const iapService = new IAPService();
