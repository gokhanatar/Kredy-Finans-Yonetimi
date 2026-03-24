import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Eye, EyeOff, Crown, Plus, Minus,
  CreditCard, BarChart3, Wallet, Target,
  Repeat, Landmark, TrendingUp, Building2,
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { MobileNav } from '@/components/MobileNav';
import { HomeSafeToSpend } from '@/components/HomeSafeToSpend';
import { SimpleCardCarousel } from '@/components/SimpleCardCarousel';
import { SimpleUpcomingPayments } from '@/components/SimpleUpcomingPayments';
import { SimpleRecentTransactions } from '@/components/SimpleRecentTransactions';
import { SimpleQuickAdd } from '@/components/SimpleQuickAdd';
import { useFamilySyncedStorage } from '@/hooks/useFamilySyncedStorage';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useTransactions } from '@/hooks/useTransactions';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useFamilySync } from '@/contexts/FamilySyncContext';
import { CreditCard as CreditCardType } from '@/types/finance';
import { PERSONAL_STORAGE_KEYS } from '@/types/familyFinance';
import { containerVariants, itemVariants } from '@/lib/simpleAnimations';
import type { LucideIcon } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Günaydın';
  if (hour >= 12 && hour < 18) return 'İyi günler';
  if (hour >= 18 && hour < 22) return 'İyi akşamlar';
  return 'İyi geceler';
}

interface QuickNavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  gradient: string;
  isPro?: boolean;
}

const PERSONAL_NAV_ITEMS: QuickNavItem[] = [
  { icon: CreditCard,  label: 'Kartlarım',         path: '/wallet?tab=kartlar',   gradient: 'from-sky-500 to-blue-600' },
  { icon: BarChart3,    label: 'Analitik',           path: '/analytics',            gradient: 'from-blue-500 to-cyan-500' },
  { icon: Wallet,       label: 'Gelir / Gider',      path: '/wallet?tab=hesaplar',  gradient: 'from-orange-500 to-amber-500' },
  { icon: Target,       label: 'Bütçe & Hedefler',   path: '/wallet?tab=butce',     gradient: 'from-emerald-500 to-green-600' },
  { icon: Repeat,       label: 'Düzenli Ödemeler',    path: '/wallet?tab=borclar',   gradient: 'from-pink-500 to-rose-500' },
  { icon: Landmark,     label: 'Kredi Simülatörü',    path: '/loans',                gradient: 'from-indigo-500 to-blue-700' },
  { icon: TrendingUp,   label: 'Yatırım Portföyü',   path: '/investments',          gradient: 'from-violet-500 to-purple-600', isPro: true },
  { icon: Building2,    label: 'Emlak & Araçlar',     path: '/assets',               gradient: 'from-teal-500 to-emerald-600', isPro: true },
];

const SimpleSummary = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { familyId } = useFamilySync();
  const { isPrivate, toggle: togglePrivacy } = usePrivacyMode();
  const { isPremium, isTrialActive, trialDaysLeft, isScreenshotMode } = useSubscriptionContext();
  const [quickAddType, setQuickAddType] = useState<'income' | 'expense' | null>(null);

  // Data — same sources as the real app
  const [cards] = useFamilySyncedStorage<CreditCardType[]>('kredi-pusula-cards', []);
  const billHook = useRecurringBills(PERSONAL_STORAGE_KEYS.MONTHLY_BILLS);
  const subHook = useSubscriptions(PERSONAL_STORAGE_KEYS.SUBSCRIPTIONS);
  const { transactions } = useTransactions(PERSONAL_STORAGE_KEYS.TRANSACTIONS, 'personal');

  // Kişisel finans kapalıysa → aile sayfasına yönlendir (hook'lardan SONRA)
  if (familyId && profile.hidePersonalFinance) {
    return <Navigate to="/simple-family" replace />;
  }

  const firstName = profile.name?.split(' ')[0] || 'Kullanıcı';

  return (
    <div className="min-h-screen bg-background">
      {/* Header — gradient glass */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/8 via-background/90 to-primary/5 backdrop-blur-xl safe-area-top border-b border-border/40">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-5 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{getGreeting()}</p>
            <p className="text-lg font-bold truncate">{firstName}</p>
          </div>
          <div className="flex items-center gap-1">
            {isPremium && !isTrialActive && !isScreenshotMode && (
              <button
                onClick={() => navigate('/subscription')}
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-warning to-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-glow-warning"
              >
                <Crown className="h-3 w-3" /> PRO
              </button>
            )}
            {isTrialActive && !isScreenshotMode && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {trialDaysLeft} gün
              </span>
            )}
            <button onClick={togglePrivacy} className="p-2.5 rounded-xl hover:bg-muted transition-colors">
              {isPrivate ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
            </button>
            <button onClick={() => navigate('/notification-inbox')} className="p-2.5 rounded-xl hover:bg-muted transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <motion.main
        className="mx-auto max-w-2xl px-5 py-3 pb-safe-nav space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Quick Add Buttons */}
        <motion.div variants={itemVariants} className="flex gap-3">
          <button
            onClick={() => setQuickAddType('income')}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-success to-emerald-600 text-white font-bold text-sm shadow-lg shadow-success/25 transition-all active:scale-[0.97]"
          >
            <Plus className="h-4.5 w-4.5" /> Gelir Ekle
          </button>
          <button
            onClick={() => setQuickAddType('expense')}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-destructive to-red-600 text-white font-bold text-sm shadow-lg shadow-destructive/25 transition-all active:scale-[0.97]"
          >
            <Minus className="h-4.5 w-4.5" /> Gider Ekle
          </button>
        </motion.div>

        {/* 1. SafeToSpend — reuse the REAL component */}
        <motion.div variants={itemVariants}>
          <HomeSafeToSpend />
        </motion.div>

        {/* 2. Upcoming Payments */}
        <motion.div variants={itemVariants}>
          <SimpleUpcomingPayments
            cards={cards}
            bills={billHook.bills}
            subscriptions={subHook.subscriptions}
            daysAhead={5}
          />
        </motion.div>

        {/* 3. Recent Transactions */}
        <motion.div variants={itemVariants}>
          <SimpleRecentTransactions transactions={transactions} scope="personal" />
        </motion.div>

        {/* 4. Card Carousel */}
        <motion.div variants={itemVariants}>
          <SimpleCardCarousel cards={cards} />
        </motion.div>

        {/* 5. Quick Navigation — big rounded colorful buttons with Lucide icons */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          {PERSONAL_NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.path + item.label}
                onClick={() => {
                  navigate(item.path);
                }}
                whileTap={{ scale: 0.96 }}
                className={`relative flex flex-col items-start gap-2.5 rounded-2xl bg-gradient-to-br ${item.gradient} p-4 shadow-lg overflow-hidden min-h-[96px]`}
              >
                {/* Glass icon circle */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-white leading-tight">{item.label}</span>

                {/* Decorative circle */}
                <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-full bg-white/10" />

                {item.isPro && !isPremium && !isScreenshotMode && (
                  <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-0.5 rounded-full bg-black/20 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    <Crown className="h-2.5 w-2.5" /> PRO
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        <div className="pb-4" />
      </motion.main>

      <MobileNav activeTab="home" />

      <SimpleQuickAdd
        open={quickAddType !== null}
        onClose={() => setQuickAddType(null)}
        scope="personal"
        defaultType={quickAddType || 'expense'}
      />
    </div>
  );
};

export default SimpleSummary;
