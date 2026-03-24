import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  ArrowRightLeft,
  CreditCard,
  FileText,
  Crown,
  Landmark,
  Building2,
  TrendingUp,
  PlusCircle,
  MinusCircle,
  LayoutGrid,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { SubscriptionPaywall } from "@/components/SubscriptionPaywall";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTranslation } from 'react-i18next';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  premium?: boolean;
  onClick?: () => void;
}

interface QuickActionsProps {
  onSimulatorClick?: () => void;
  onInstallmentClick?: () => void;
  onCardsClick?: () => void;
  onFindeksClick?: () => void;
  onRestructuringClick?: () => void;
  onAddIncomeClick?: () => void;
  onAddExpenseClick?: () => void;
  onPayDebtClick?: () => void;
}

export function QuickActions({
  onSimulatorClick,
  onInstallmentClick,
  onCardsClick,
  onRestructuringClick,
  onAddIncomeClick,
  onAddExpenseClick,
  onPayDebtClick,
}: QuickActionsProps) {
  const { isPremium, isScreenshotMode } = useSubscriptionContext();
  const [showPaywall, setShowPaywall] = useState(false);
  const { t } = useTranslation(['cards']);
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: "addIncome",
      icon: PlusCircle,
      label: t('quickActions.addIncome', { defaultValue: 'Gelir Ekle' }),
      description: t('quickActions.addIncomeDesc', { defaultValue: 'Hızlı gelir girişi' }),
      color: "from-green-500 to-emerald-600",
      onClick: onAddIncomeClick || (() => navigate('/wallet')),
    },
    {
      id: "addExpense",
      icon: MinusCircle,
      label: t('quickActions.addExpense', { defaultValue: 'Gider Ekle' }),
      description: t('quickActions.addExpenseDesc', { defaultValue: 'Hızlı gider girişi' }),
      color: "from-red-500 to-rose-600",
      onClick: onAddExpenseClick || (() => navigate('/wallet')),
    },
    {
      id: "payDebt",
      icon: Banknote,
      label: t('quickActions.payDebt', { defaultValue: 'Borç Öde' }),
      description: t('quickActions.payDebtDesc', { defaultValue: 'Kart borcu ödeme' }),
      color: "from-teal-500 to-cyan-600",
      onClick: onPayDebtClick || (() => navigate('/wallet?tab=kartlar')),
    },
    {
      id: "simulator",
      icon: ArrowRightLeft,
      label: t('quickActions.debtRolling'),
      description: t('quickActions.debtRollingDesc'),
      color: "from-violet-500 to-purple-600",
      premium: true,
      onClick: onSimulatorClick,
    },
    {
      id: "installment",
      icon: Calculator,
      label: t('quickActions.installment'),
      description: t('quickActions.installmentDesc'),
      color: "from-emerald-500 to-teal-600",
      onClick: onInstallmentClick,
    },
    {
      id: "restructuring",
      icon: FileText,
      label: t('quickActions.restructuring'),
      description: t('quickActions.restructuringDesc'),
      color: "from-amber-500 to-orange-600",
      premium: true,
      onClick: onRestructuringClick,
    },
    {
      id: "cards",
      icon: CreditCard,
      label: t('quickActions.myCards'),
      description: t('quickActions.myCardsDesc'),
      color: "from-blue-500 to-indigo-600",
      onClick: onCardsClick,
    },
    {
      id: "loanSimulator",
      icon: Landmark,
      label: t('quickActions.loanSimulator', { defaultValue: 'Kredi Simülatörü' }),
      description: t('quickActions.loanSimulatorDesc', { defaultValue: 'Kredi hesaplama' }),
      color: "from-cyan-500 to-blue-600",
      onClick: () => navigate('/loans'),
    },
    {
      id: "assetManagement",
      icon: Building2,
      label: t('quickActions.assetManagement', { defaultValue: 'Varlık Yönetimi' }),
      description: t('quickActions.assetManagementDesc', { defaultValue: 'Mülk & araç takibi' }),
      color: "from-green-500 to-emerald-600",
      premium: true,
      onClick: () => navigate('/assets'),
    },
    {
      id: "investments",
      icon: TrendingUp,
      label: t('quickActions.investments', { defaultValue: 'Yatırım Portföyü' }),
      description: t('quickActions.investmentsDesc', { defaultValue: 'Altın, döviz, hisse' }),
      color: "from-amber-500 to-yellow-600",
      premium: true,
      onClick: () => navigate('/investments'),
    },
    {
      id: "widgetGallery",
      icon: LayoutGrid,
      label: t('quickActions.widgetGallery', { defaultValue: 'Widget Galerisi' }),
      description: t('quickActions.widgetGalleryDesc', { defaultValue: 'Ana ekran widgetları' }),
      color: "from-violet-500 to-purple-600",
      premium: true,
      onClick: () => navigate('/widgets'),
    },
  ];

  const handleActionClick = (action: QuickAction) => {
    if (action.premium && !isPremium) {
      setShowPaywall(true);
      return;
    }
    action.onClick?.();
  };

  return (
    <>
      <div className="rounded-2xl bg-card p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-bold text-card-foreground">
          {t('quickActions.title')}
        </h2>

        <div className="grid grid-cols-3 gap-2.5">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className="group relative flex flex-col items-center rounded-xl bg-secondary/50 p-4 text-center transition-all hover:bg-secondary hover:shadow-md"
              >
                {/* Premium Badge */}
                {action.premium && !isPremium && !isScreenshotMode && (
                  <span className="absolute -right-1 -top-1 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-warning to-warning/80 px-1.5 py-0.5 text-[8px] font-bold text-white">
                    <Crown className="h-2 w-2" />
                    PRO
                  </span>
                )}
                <div
                  className={cn(
                    "mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br transition-transform group-hover:scale-110",
                    action.color
                  )}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-card-foreground leading-tight">
                  {action.label}
                </span>
                <span className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                  {action.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paywall Dialog */}
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>{t('subscription:title')}</DialogTitle>
          </VisuallyHidden>
          <SubscriptionPaywall
            onClose={() => setShowPaywall(false)}
            showCloseButton={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
