import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MobileNav } from '@/components/MobileNav';
import { SimpleCardCarousel } from '@/components/SimpleCardCarousel';
import { SimpleQuickAdd } from '@/components/SimpleQuickAdd';
import { useFamilySync } from '@/contexts/FamilySyncContext';
import { useFamilySyncedStorage } from '@/hooks/useFamilySyncedStorage';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { CreditCard } from '@/types/finance';
import { FamilySyncSetup } from '@/components/FamilySyncSetup';
import {
  Crown, Plus, Minus, AlertCircle,
  Wallet, BarChart3, CreditCard as CreditCardIcon,
  Target, Repeat, Calendar, TrendingUp, Building2,
  type LucideIcon,
} from 'lucide-react';
import { containerVariants, itemVariants, scaleInVariants } from '@/lib/simpleAnimations';

interface QuickNavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  gradient: string;
  isPro?: boolean;
}

const FAMILY_NAV_ITEMS: QuickNavItem[] = [
  { icon: Wallet,       label: 'Gelir / Gider',      path: '/wallet?tab=hesaplar',  gradient: 'from-orange-500 to-amber-500' },
  { icon: BarChart3,    label: 'Analitik',            path: '/analytics',            gradient: 'from-blue-500 to-cyan-500' },
  { icon: CreditCardIcon, label: 'Kartlarım',        path: '/wallet?tab=kartlar',   gradient: 'from-sky-500 to-blue-600' },
  { icon: Target,       label: 'Bütçe & Hedefler',   path: '/wallet?tab=butce',     gradient: 'from-emerald-500 to-green-600' },
  { icon: Repeat,       label: 'Düzenli Ödemeler',    path: '/wallet?tab=borclar',   gradient: 'from-pink-500 to-rose-500' },
  { icon: Calendar,     label: 'Takvim',              path: '/analytics?tab=takvim', gradient: 'from-cyan-500 to-sky-600' },
  { icon: TrendingUp,   label: 'Yatırım Portföyü',   path: '/investments',          gradient: 'from-violet-500 to-purple-600', isPro: true },
  { icon: Building2,    label: 'Emlak & Araçlar',     path: '/assets',               gradient: 'from-teal-500 to-emerald-600', isPro: true },
];

function getRelativeTime(lastSeen: number): string {
  const diffMs = Date.now() - lastSeen;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'şimdi';
  if (diffMin < 60) return `${diffMin} dk`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} sa`;
  return `${Math.floor(diffHr / 24)} gün`;
}

const SimpleFamily = () => {
  const navigate = useNavigate();
  const { familyId, memberId, members, isInGracePeriod, gracePeriodDaysLeft } = useFamilySync();
  const { isPremium, isScreenshotMode } = useSubscriptionContext();
  const { profile } = useUserProfile();
  const [quickAddType, setQuickAddType] = useState<'income' | 'expense' | null>(null);

  const hidePersonal = !!familyId && !!profile.hidePersonalFinance;

  const [cards] = useFamilySyncedStorage<CreditCard[]>('kredi-pusula-cards', []);

  const memberList = Object.entries(members).map(([id, member]) => ({
    id,
    name: member.name,
    isMe: id === memberId,
    lastSeen: member.lastSeen,
    isOnline: Date.now() - member.lastSeen < 5 * 60 * 1000,
  })).sort((a, b) => (a.isMe ? -1 : b.isMe ? 1 : 0));

  // If not in a family, show setup
  if (!familyId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 border-b bg-gradient-to-r from-primary/8 via-background/90 to-primary/5 backdrop-blur-xl">
          <div className="mx-auto max-w-2xl">
            <div className="flex h-14 items-center gap-4 px-4">
              <h1 className="text-lg font-bold">Aile Finansı</h1>
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-2xl px-5 py-6">
          <FamilySyncSetup />
        </main>
        <MobileNav activeTab="family" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header — gradient glass */}
      <div className="sticky top-0 z-50 border-b bg-gradient-to-r from-primary/8 via-background/90 to-primary/5 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl">
          <div className="flex h-14 items-center px-4">
            <h1 className="text-lg font-bold">Aile Finansı</h1>
          </div>
        </div>
      </div>

      <motion.main
        className="mx-auto max-w-2xl px-5 py-4 pb-safe-nav space-y-6"
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

        {/* Grace Period Warning */}
        {isInGracePeriod && gracePeriodDaysLeft !== null && (
          <motion.div variants={itemVariants} className="rounded-2xl bg-warning/10 border border-warning/20 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-warning">Aile Grubu Süresi Doluyor</p>
                <p className="text-xs text-muted-foreground">
                  Premium üyeliğiniz sona erdi. {gracePeriodDaysLeft} gün içinde aile grubunuz otomatik olarak dağılacak.
                </p>
                <button
                  onClick={() => navigate('/subscription')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-warning text-white px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.97]"
                >
                  <Crown className="h-3 w-3" /> PRO'ya Geç
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Members — horizontal avatars with stagger animation */}
        <motion.div variants={itemVariants} className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {memberList.map((member, index) => (
            <motion.div
              key={member.id}
              variants={scaleInVariants}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div className="relative">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  member.isOnline
                    ? 'bg-gradient-to-br from-success to-emerald-600'
                    : 'bg-gradient-to-br from-muted-foreground/60 to-muted-foreground/40'
                }`}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                  member.isOnline ? 'bg-success animate-pulse' : 'bg-muted-foreground/40'
                }`} />
              </div>
              <span className="text-[11px] font-medium text-center truncate w-14">
                {member.isMe ? 'Sen' : member.name.split(' ')[0]}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Cards */}
        <motion.div variants={itemVariants}>
          <SimpleCardCarousel cards={cards} />
        </motion.div>

        {/* Quick Navigation — big rounded colorful buttons with Lucide icons */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          {FAMILY_NAV_ITEMS.filter((item) => !hidePersonal || !item.path.startsWith('/wallet')).map((item) => {
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

      <MobileNav activeTab={hidePersonal ? "home" : "family"} />

      <SimpleQuickAdd
        open={quickAddType !== null}
        onClose={() => setQuickAddType(null)}
        scope="family"
        defaultType={quickAddType || 'expense'}
      />
    </div>
  );
};

export default SimpleFamily;
