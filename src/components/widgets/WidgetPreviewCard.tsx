import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  type WidgetDef,
  BAROMETER_LEVELS,
} from '@/data/widgetData';
import { CategoryIcon } from '@/components/ui/category-icon';

interface WidgetPreviewCardProps {
  widget: WidgetDef;
}

// ─── Real Data Hook ──────────────────────────────────────────────
function useRealData() {
  return useMemo(() => {
    try {
      const cardsRaw = localStorage.getItem('kredi-pusula-cards');
      const cards: any[] = cardsRaw ? JSON.parse(cardsRaw) : [];
      const totalDebt = cards.reduce((s, c) => s + (c.currentDebt || 0), 0);
      const totalLimit = cards.reduce((s, c) => s + (c.cardLimit || 0), 0);
      const usagePercent = totalLimit > 0 ? Math.round((totalDebt / totalLimit) * 100) : 45;

      // Next payment card
      const day = new Date().getDate();
      let nextCard: any = null;
      let minDays = Infinity;
      for (const c of cards) {
        let d = (c.dueDate || 15) - day;
        if (d <= 0) d += 30;
        if (d < minDays) { minDays = d; nextCard = c; }
      }

      // Budget
      const now = new Date();
      const bRaw = localStorage.getItem('personal-budgets');
      const budgets: any[] = bRaw ? JSON.parse(bRaw) : [];
      const cb = budgets.find((b) => b.month === now.getMonth() && b.year === now.getFullYear());
      const bSpent = cb?.categories?.reduce((s: number, c: any) => s + (c.spent || 0), 0) || 0;
      const bTotal = cb?.categories?.reduce((s: number, c: any) => s + (c.allocated || 0), 0) || 0;

      // Goals
      const gRaw = localStorage.getItem('personal-goals');
      const goals: any[] = gRaw ? JSON.parse(gRaw) : [];
      const topGoal = goals[0];

      // Bank accounts
      const aRaw = localStorage.getItem('personal-accounts');
      const accounts: any[] = aRaw ? JSON.parse(aRaw) : [];
      const bankAcc = accounts.find((a) => a.type === 'bank' || a.type === 'checking');

      return {
        totalDebt, totalLimit, usagePercent,
        nextCard, daysUntil: minDays === Infinity ? 5 : minDays,
        bSpent, bTotal,
        topGoal, bankAcc,
        hasData: cards.length > 0,
      };
    } catch {
      return {
        totalDebt: 12450, totalLimit: 50000, usagePercent: 45,
        nextCard: null, daysUntil: 5,
        bSpent: 6200, bTotal: 10000,
        topGoal: null, bankAcc: null, hasData: false,
      };
    }
  }, []);
}

function fmt(n: number): string {
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
}

// ─── Glassmorphism wrapper for icons ─────────────────────────────
function GlassIcon({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
      <CategoryIcon name={name} size={size} className={className} />
    </div>
  );
}

// ─── Animated number ─────────────────────────────────────────────
function AnimValue({ children, className, delay = 0.1 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.p
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.p>
  );
}

// ─── Preview Components ──────────────────────────────────────────

function DebtPreview() {
  const { t } = useTranslation(['widgets']);
  const { totalDebt, hasData } = useRealData();
  const amount = hasData ? totalDebt : 12450;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2.5">
      <GlassIcon name="credit-card" className="text-red-400" />
      <p className="text-[11px] text-foreground/60 font-medium tracking-wide uppercase">{t('preview.totalDebt')}</p>
      <AnimValue className="text-xl font-bold bg-gradient-to-r from-red-500 to-rose-400 bg-clip-text text-transparent">
        ₺{fmt(amount)}
      </AnimValue>
    </div>
  );
}

function PaymentPreview() {
  const { t } = useTranslation(['widgets']);
  const { nextCard, daysUntil, hasData } = useRealData();
  const bankName = hasData && nextCard ? nextCard.bankName : 'Yap\u0131 Kredi';
  const debt = hasData && nextCard ? nextCard.currentDebt : 3200;
  const days = hasData ? daysUntil : 5;

  return (
    <div className="flex items-center justify-between h-full px-5">
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] text-foreground/60 font-medium tracking-wide uppercase">{t('preview.nextPayment')}</p>
        <AnimValue className="text-base font-bold" delay={0.05}>{bankName}</AnimValue>
        <AnimValue className="text-sm text-foreground/70" delay={0.15}>₺{fmt(debt)}</AnimValue>
      </div>
      <motion.div
        className="flex flex-col items-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3, type: 'spring', stiffness: 200 }}
      >
        <span className="text-3xl font-bold bg-gradient-to-b from-primary to-primary/70 bg-clip-text text-transparent">{days}</span>
        <p className="text-[10px] text-primary font-medium">{t('preview.days')}</p>
      </motion.div>
    </div>
  );
}

function GoldenPreview() {
  const { t } = useTranslation(['widgets']);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2.5">
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <GlassIcon name="sparkles" className="text-amber-400" />
      </motion.div>
      <p className="text-[11px] text-foreground/60 font-medium tracking-wide uppercase">{t('preview.goldenWindow')}</p>
      <AnimValue className="text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">
        {t('preview.active')}
      </AnimValue>
    </div>
  );
}

function BudgetPreview() {
  const { t } = useTranslation(['widgets']);
  const { bSpent, bTotal, hasData } = useRealData();
  const spent = hasData && bTotal > 0 ? bSpent : 6200;
  const total = hasData && bTotal > 0 ? bTotal : 10000;
  const pct = total > 0 ? Math.round((spent / total) * 100) : 62;
  const isGood = pct < 75;

  return (
    <div className="flex flex-col justify-center h-full px-5 gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-foreground/60 font-medium tracking-wide uppercase">{t('preview.monthlyBudget')}</p>
        <motion.span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-sm border',
            isGood
              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20'
              : 'bg-orange-500/15 text-orange-500 border-orange-500/20'
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          %{pct}
        </motion.span>
      </div>
      <div className="h-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            isGood
              ? 'bg-gradient-to-r from-emerald-500 to-green-400'
              : 'bg-gradient-to-r from-orange-500 to-amber-400'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-foreground/50">
        <span>₺{fmt(spent)} {t('preview.spent')}</span>
        <span>₺{fmt(total)}</span>
      </div>
    </div>
  );
}

function BarometerPreview() {
  const { t } = useTranslation(['widgets']);
  const { usagePercent } = useRealData();
  const levelIdx = BAROMETER_LEVELS.findIndex((l) => usagePercent >= l.min && usagePercent < l.max);
  const level = BAROMETER_LEVELS[levelIdx >= 0 ? levelIdx : 2];

  const barColors = [
    'from-emerald-400 to-green-400',
    'from-green-400 to-lime-400',
    'from-yellow-400 to-orange-400',
    'from-orange-400 to-red-400',
    'from-red-500 to-rose-500',
  ];
  const barColor = barColors[levelIdx >= 0 ? levelIdx : 2];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CategoryIcon name={level.emoji} size={40} />
      </motion.div>
      <p className="text-xs font-semibold">{t(level.labelKey)}</p>
      <div className="w-20 h-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${usagePercent}%` }}
          transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[10px] text-foreground/50">%{usagePercent} {t('preview.usage')}</p>
    </div>
  );
}

function SalaryPreview() {
  const { t } = useTranslation(['widgets']);
  // Estimate days until salary (assume 1st of month)
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate() + 1;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <GlassIcon name="coins" className="text-pink-400" />
      <motion.p
        className="text-3xl font-bold bg-gradient-to-b from-primary to-primary/60 bg-clip-text text-transparent"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
      >
        {daysLeft}
      </motion.p>
      <p className="text-[11px] text-foreground/60 font-medium">{t('preview.daysLeft')}</p>
    </div>
  );
}

function QuotesPreview() {
  const { t } = useTranslation(['widgets']);
  const quote = t('quotes.0', { defaultValue: '' });
  return (
    <div className="flex items-center h-full px-5">
      <div className="flex items-start gap-3">
        <motion.div
          className="shrink-0 mt-0.5"
          initial={{ rotate: -10, opacity: 0 }}
          animate={{ rotate: 0, opacity: 0.8 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <CategoryIcon name="message-square" size={28} />
        </motion.div>
        <AnimValue className="text-sm italic leading-relaxed text-foreground/70 line-clamp-3" delay={0.15}>
          &ldquo;{quote}&rdquo;
        </AnimValue>
      </div>
    </div>
  );
}

function SavingsPreview() {
  const { t } = useTranslation(['widgets']);
  const { topGoal } = useRealData();
  const name = topGoal?.name || t('preview.vacationFund');
  const current = topGoal?.currentAmount || 7000;
  const target = topGoal?.targetAmount || 20000;
  const pct = target > 0 ? Math.round((current / target) * 100) : 35;

  return (
    <div className="flex flex-col justify-center h-full px-5 gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CategoryIcon name="target" size={20} className="text-teal-400" />
          <p className="text-sm font-semibold truncate max-w-[120px]">{name}</p>
        </div>
        <motion.span
          className="rounded-full bg-teal-500/15 backdrop-blur-sm border border-teal-500/20 px-2.5 py-0.5 text-[11px] font-bold text-teal-500"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          %{pct}
        </motion.span>
      </div>
      <div className="h-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[10px] text-foreground/50">₺{fmt(current)} / ₺{fmt(target)}</p>
    </div>
  );
}

function TipPreview() {
  const { t } = useTranslation(['widgets']);
  return (
    <div className="flex flex-col justify-center h-full px-5 py-4 gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
          <CategoryIcon name="lightbulb" size={20} className="text-sky-400" />
        </div>
        <AnimValue className="text-sm font-bold" delay={0.05}>{t('tips.1.title')}</AnimValue>
      </div>
      <AnimValue className="text-xs leading-relaxed text-foreground/70 line-clamp-4" delay={0.15}>
        {t('tips.1.text')}
      </AnimValue>
      <p className="text-[10px] text-foreground/40 mt-auto font-medium">{t('preview.newTipDaily')}</p>
    </div>
  );
}

function FindeksPreview() {
  const { t } = useTranslation(['widgets']);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <GlassIcon name="trending-up" className="text-lime-400" />
      <motion.p
        className="text-2xl font-bold bg-gradient-to-r from-lime-500 to-emerald-400 bg-clip-text text-transparent"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
      >
        1450
      </motion.p>
      <p className="text-[10px] text-foreground/60 font-medium">{t('preview.estimatedScore')}</p>
    </div>
  );
}

function BankAccountPreview() {
  const { t } = useTranslation(['widgets']);
  const { bankAcc } = useRealData();
  const balance = bankAcc?.balance ?? 15340;
  const name = bankAcc?.name || t('widgets:widgets.bank-account.name', 'Banka Hesab\u0131');
  const isNegative = balance < 0;

  return (
    <div className="flex flex-col justify-center h-full px-5 gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
          <CategoryIcon name="building-2" size={20} className="text-slate-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-foreground/60 font-medium truncate">{name}</p>
          <AnimValue
            className={cn(
              'text-lg font-bold',
              isNegative
                ? 'text-red-400'
                : 'bg-gradient-to-r from-slate-200 to-white bg-clip-text text-transparent'
            )}
            delay={0.1}
          >
            ₺{fmt(Math.abs(balance))}
          </AnimValue>
        </div>
      </div>
      {isNegative && bankAcc?.kmhEnabled && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 backdrop-blur-sm border border-red-500/20 px-3 py-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          <p className="text-[10px] font-medium text-red-400">KMH Aktif</p>
        </div>
      )}
    </div>
  );
}

// ─── Preview Map ─────────────────────────────────────────────────

const PREVIEW_MAP: Record<string, React.FC> = {
  debt: DebtPreview,
  payment: PaymentPreview,
  golden: GoldenPreview,
  budget: BudgetPreview,
  barometer: BarometerPreview,
  salary: SalaryPreview,
  quotes: QuotesPreview,
  savings: SavingsPreview,
  tip: TipPreview,
  findeks: FindeksPreview,
  'bank-account': BankAccountPreview,
};

const SIZE_CLASSES: Record<string, string> = {
  '1x1': 'col-span-1 aspect-square',
  '2x1': 'col-span-2 aspect-[2/1]',
  '2x2': 'col-span-2 aspect-square',
};

// ─── Main Card ───────────────────────────────────────────────────

export function WidgetPreviewCard({ widget }: WidgetPreviewCardProps) {
  const { t } = useTranslation(['widgets']);
  const PreviewComponent = PREVIEW_MAP[widget.preview.type];

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br shadow-soft transition-all active:scale-[0.97]',
        'backdrop-blur-xl',
        widget.gradient,
        SIZE_CLASSES[widget.size]
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
    >
      {/* Glassmorphism decorative elements */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/[0.06] blur-2xl" />
      <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-white/[0.04] blur-xl" />
      <div className="absolute right-4 bottom-8 h-12 w-12 rounded-full bg-white/[0.03] blur-lg" />

      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 min-h-0">
          {PreviewComponent && <PreviewComponent />}
        </div>
        <div className="px-3.5 pb-3">
          <p className="text-[11px] font-semibold truncate text-foreground/80">{t(widget.nameKey)}</p>
        </div>
      </div>
    </motion.div>
  );
}
