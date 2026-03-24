import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Crown, ChevronRight, Landmark, Brain, Briefcase,
  Bell, Settings, HelpCircle, Maximize2,
  Wallet, Banknote, CreditCard, ShoppingCart,
  Calculator, TrendingUp, Target, Repeat, Puzzle,
  RefreshCcw, ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { InstallmentCalculator } from '@/components/InstallmentCalculator';
import { DebtRollingSimulator } from '@/components/DebtRollingSimulator';
import { RestructuringSimulator } from '@/components/RestructuringSimulator';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useSimpleMode } from '@/contexts/SimpleModeContext';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { useFamilySyncedStorage } from '@/hooks/useFamilySyncedStorage';
import { CreditCard as CreditCardType } from '@/types/finance';
import { formatCurrency } from '@/lib/financeUtils';
import { containerVariants, itemVariants } from '@/lib/simpleAnimations';

const TYPE_ICONS: Record<string, LucideIcon> = {
  income: Wallet,
  expense: Banknote,
  card_payment: CreditCard,
  purchase: ShoppingCart,
  simulator: Calculator,
  investment: TrendingUp,
  goal: Target,
  transfer: Repeat,
};

const TYPE_COLORS: Record<string, string> = {
  income: 'bg-green-500/10 text-green-500',
  expense: 'bg-red-500/10 text-red-500',
  card_payment: 'bg-blue-500/10 text-blue-500',
  purchase: 'bg-orange-500/10 text-orange-500',
  simulator: 'bg-indigo-500/10 text-indigo-500',
  investment: 'bg-violet-500/10 text-violet-500',
  goal: 'bg-emerald-500/10 text-emerald-500',
  transfer: 'bg-cyan-500/10 text-cyan-500',
};

function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'bugün';
  if (diffDays === 1) return 'dün';
  if (diffDays < 7) return `${diffDays} gün`;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

interface MenuLink {
  icon: LucideIcon;
  label: string;
  path?: string;
  color: string;
  action?: () => void;
  isPro?: boolean;
}

const SimpleMenu = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { isPremium, isTrialActive, trialDaysLeft, isScreenshotMode } = useSubscriptionContext();
  const { setSimpleMode } = useSimpleMode();
  const { history } = useTransactionHistory();
  const { isPrivate } = usePrivacyMode();
  const [showInstallment, setShowInstallment] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showRestructuring, setShowRestructuring] = useState(false);

  const [cards] = useFamilySyncedStorage<CreditCardType[]>('kredi-pusula-cards', []);

  const recentHistory = history.slice(0, 8);

  const switchToDetailMode = () => {
    setSimpleMode(false);
    navigate('/');
  };

  const TOOLS: MenuLink[] = [
    { icon: Landmark,      label: 'Kredi Simülatörü',     path: '/loans',                color: 'bg-indigo-500/10 text-indigo-500' },
    { icon: RefreshCcw,    label: 'Borç Yuvarlatma',       color: 'bg-teal-500/10 text-teal-500', isPro: true,
      action: () => setShowSimulator(true) },
    { icon: ClipboardList, label: 'Yeniden Yapılandırma',  color: 'bg-rose-500/10 text-rose-500', isPro: true,
      action: () => setShowRestructuring(true) },
    { icon: Calculator,    label: 'Taksit Hesaplama',      color: 'bg-cyan-500/10 text-cyan-500', isPro: true,
      action: () => setShowInstallment(true) },
    { icon: Brain,         label: 'AI İçgörüler',          path: '/ai-insights',          color: 'bg-violet-500/10 text-violet-500', isPro: true },
    { icon: Briefcase,     label: 'Ticari Analitik',       path: '/commercial-analytics', color: 'bg-amber-500/10 text-amber-500', isPro: true },
    { icon: Puzzle,        label: 'Widget Galerisi',       path: '/widgets',              color: 'bg-pink-500/10 text-pink-500', isPro: true },
  ];

  const APP: MenuLink[] = [
    { icon: Bell,        label: 'Bildirim Ayarları', path: '/notifications', color: 'bg-blue-500/10 text-blue-500' },
    { icon: Settings,    label: 'Hesap Ayarları',    path: '/settings',      color: 'bg-gray-500/10 text-gray-500' },
    { icon: HelpCircle,  label: 'Yardım',            path: '/help',          color: 'bg-green-500/10 text-green-500' },
    { icon: Maximize2,   label: 'Detaylı Moda Geç',  color: 'bg-primary/10 text-primary', action: switchToDetailMode },
  ];

  const renderMenuGroup = (title: string, items: MenuLink[]) => (
    <motion.div variants={itemVariants} className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{title}</p>
      <div className="rounded-2xl bg-card shadow-soft overflow-hidden divide-y divide-border">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => item.action ? item.action() : item.path && navigate(item.path)}
              className="flex w-full items-center gap-3 p-3.5 transition-colors hover:bg-muted/50 active:bg-muted"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
              {item.isPro && !isPremium && !isScreenshotMode && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-warning to-warning/80 px-1.5 py-0.5 text-[8px] font-bold text-white">
                  <Crown className="h-2 w-2" />PRO
                </span>
              )}
              {item.label === 'Detaylı Moda Geç' ? (
                <span className="text-[11px] text-muted-foreground">Tüm sekmeleri aç</span>
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-gradient-to-r from-primary/8 via-background/90 to-primary/5 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl">
          <div className="flex h-14 items-center gap-4 px-4">
            <h1 className="text-lg font-bold">Menü</h1>
          </div>
        </div>
      </div>

      <motion.main
        className="mx-auto max-w-2xl px-5 py-4 pb-safe-nav space-y-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* User Card */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
          <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">
              {(profile.name || 'K').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold truncate">{profile.name || 'Kullanıcı'}</h2>
            <p className="text-xs text-muted-foreground truncate">{profile.email || ''}</p>
          </div>
          {isPremium && !isTrialActive && !isScreenshotMode && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-warning to-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-glow-warning">
              <Crown className="h-3 w-3" /> PRO
            </span>
          )}
          {isTrialActive && !isScreenshotMode && (
            <span className="shrink-0 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {trialDaysLeft} gün
            </span>
          )}
        </motion.div>

        {/* PRO banner */}
        {(!isPremium || isTrialActive) && !isScreenshotMode && (
          <motion.button
            variants={itemVariants}
            onClick={() => navigate('/subscription')}
            className="w-full rounded-2xl bg-gradient-to-r from-warning via-amber-500 to-orange-500 p-4 shadow-lg transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-white text-sm">PRO'ya Geç</p>
                <p className="text-xs text-white/80">Tüm özelliklerin kilidini aç</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/80" />
            </div>
          </motion.button>
        )}

        {/* Recent Transactions */}
        {recentHistory.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-muted-foreground">Son İşlemler</h3>
              <button
                onClick={() => navigate('/wallet?tab=hesaplar')}
                className="text-xs text-primary font-medium flex items-center gap-0.5"
              >
                Tümü <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="rounded-2xl bg-card shadow-soft divide-y divide-border overflow-hidden">
              {recentHistory.map((entry) => {
                const Icon = TYPE_ICONS[entry.type] || Wallet;
                const colorClass = TYPE_COLORS[entry.type] || 'bg-gray-500/10 text-gray-500';
                return (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.title}</p>
                      <p className="text-[11px] text-muted-foreground">{getRelativeDate(entry.date)}</p>
                    </div>
                    {entry.amount != null && (
                      <span className={`text-sm font-semibold tabular-nums ${entry.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                        {isPrivate ? '••••' : `${entry.type === 'income' ? '+' : '-'}${formatCurrency(entry.amount)}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Tools */}
        {renderMenuGroup('Araçlar', TOOLS)}

        {/* App Settings */}
        {renderMenuGroup('Uygulama', APP)}

        <div className="h-4" />
      </motion.main>

      <MobileNav activeTab="menu" />

      {/* Debt Rolling Simulator Modal */}
      <Dialog open={showSimulator} onOpenChange={setShowSimulator}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>Borç Yuvarlatma</DialogTitle>
          </VisuallyHidden>
          <PremiumLockOverlay showFloatingButton={false}>
            <DebtRollingSimulator cards={cards} onClose={() => setShowSimulator(false)} />
          </PremiumLockOverlay>
        </DialogContent>
      </Dialog>

      {/* Restructuring Simulator Modal */}
      <Dialog open={showRestructuring} onOpenChange={setShowRestructuring}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>Yeniden Yapılandırma</DialogTitle>
          </VisuallyHidden>
          <PremiumLockOverlay showFloatingButton={false}>
            <RestructuringSimulator onClose={() => setShowRestructuring(false)} />
          </PremiumLockOverlay>
        </DialogContent>
      </Dialog>

      {/* Installment Calculator Modal */}
      <Dialog open={showInstallment} onOpenChange={setShowInstallment}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>Taksit Hesaplama</DialogTitle>
          </VisuallyHidden>
          <PremiumLockOverlay showFloatingButton={false}>
            <InstallmentCalculator onClose={() => setShowInstallment(false)} />
          </PremiumLockOverlay>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimpleMenu;
