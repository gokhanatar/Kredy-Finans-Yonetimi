import { useNavigate } from 'react-router-dom';
import { FamilyTransaction } from '@/types/familyFinance';
import { formatCurrency } from '@/lib/financeUtils';
import { usePrivacyModeContext } from '@/contexts/PrivacyModeContext';
import {
  ChevronRight, History, ShoppingCart, Home, Zap, Bus, Heart,
  BookOpen, Film, Shirt, UtensilsCrossed, Baby, PawPrint,
  Sparkles, Gift, Fuel, Shield, Package,
  Wallet, Banknote, TrendingUp, Gem, type LucideIcon,
} from 'lucide-react';

interface CategoryConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
}

const CATEGORY_ICONS: Record<string, CategoryConfig> = {
  market:        { icon: ShoppingCart,      color: 'text-orange-500', bg: 'bg-orange-500/10' },
  kira:          { icon: Home,              color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  fatura:        { icon: Zap,               color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ulasim:        { icon: Bus,               color: 'text-cyan-500',   bg: 'bg-cyan-500/10' },
  saglik:        { icon: Heart,             color: 'text-red-500',    bg: 'bg-red-500/10' },
  egitim:        { icon: BookOpen,          color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  eglence:       { icon: Film,              color: 'text-pink-500',   bg: 'bg-pink-500/10' },
  giyim:         { icon: Shirt,             color: 'text-purple-500', bg: 'bg-purple-500/10' },
  yemek:         { icon: UtensilsCrossed,   color: 'text-amber-500',  bg: 'bg-amber-500/10' },
  ev:            { icon: Home,              color: 'text-teal-500',   bg: 'bg-teal-500/10' },
  cocuk:         { icon: Baby,              color: 'text-sky-500',    bg: 'bg-sky-500/10' },
  evcil:         { icon: PawPrint,          color: 'text-lime-600',   bg: 'bg-lime-500/10' },
  bakim:         { icon: Sparkles,          color: 'text-fuchsia-500',bg: 'bg-fuchsia-500/10' },
  hediye:        { icon: Gift,              color: 'text-rose-500',   bg: 'bg-rose-500/10' },
  tasit:         { icon: Fuel,              color: 'text-stone-600',  bg: 'bg-stone-500/10' },
  sigorta:       { icon: Shield,            color: 'text-emerald-500',bg: 'bg-emerald-500/10' },
  'diger-gider': { icon: Package,           color: 'text-gray-500',   bg: 'bg-gray-500/10' },
  maas:          { icon: Wallet,            color: 'text-green-500',  bg: 'bg-green-500/10' },
  'ek-gelir':    { icon: Banknote,          color: 'text-emerald-500',bg: 'bg-emerald-500/10' },
  'kira-gelir':  { icon: Home,              color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  'yatirim-gelir': { icon: TrendingUp,      color: 'text-violet-500', bg: 'bg-violet-500/10' },
  'diger-gelir': { icon: Gem,               color: 'text-cyan-500',   bg: 'bg-cyan-500/10' },
};

const DEFAULT_CATEGORY: CategoryConfig = { icon: Package, color: 'text-gray-500', bg: 'bg-gray-500/10' };

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

interface SimpleRecentTransactionsProps {
  transactions: FamilyTransaction[];
  limit?: number;
  scope?: 'personal' | 'family';
}

export function SimpleRecentTransactions({ transactions, limit = 5, scope = 'personal' }: SimpleRecentTransactionsProps) {
  const navigate = useNavigate();
  const { isPrivate } = usePrivacyModeContext();

  const sorted = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  const linkTo = scope === 'family' ? '/family' : '/wallet?tab=hesaplar';

  // Empty state
  if (sorted.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            <History className="h-4 w-4" /> Son İşlemler
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card shadow-soft p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <History className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Henüz işlem yok</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
          <History className="h-4 w-4" /> Son İşlemler
        </h3>
        <button
          onClick={() => navigate(linkTo)}
          className="text-xs text-primary font-medium flex items-center gap-0.5"
        >
          Tümü <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="rounded-2xl bg-card shadow-soft divide-y divide-border overflow-hidden">
        {sorted.map((tx) => {
          const cat = CATEGORY_ICONS[tx.category] || DEFAULT_CATEGORY;
          const Icon = cat.icon;

          return (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${cat.bg}`}>
                <Icon className={`h-4.5 w-4.5 ${cat.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{getRelativeDate(tx.date)}</p>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                {isPrivate ? '••••' : `${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
