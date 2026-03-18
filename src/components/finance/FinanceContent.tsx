import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LimitGate } from '@/components/LimitGate';
import { checkLimit, type LimitKey } from '@/lib/premiumLimits';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { SubscriptionPaywall } from '@/components/SubscriptionPaywall';
import { Crown } from 'lucide-react';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { CategoryIcon } from '@/components/ui/category-icon';

// Hooks
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses';
import { useRecurringIncomes } from '@/hooks/useRecurringIncomes';
import { useBudget } from '@/hooks/useBudget';
import { useGoals } from '@/hooks/useGoals';
import { useSharedWallets } from '@/hooks/useSharedWallets';
import { useNetWorth } from '@/hooks/useNetWorth';
import { useRecurringBills } from '@/hooks/useRecurringBills';

// Components
import { TransactionForm } from '@/components/family/TransactionForm';
import { TransactionList } from '@/components/family/TransactionList';
import { TransactionSummary } from '@/components/family/TransactionSummary';
import { AccountForm } from '@/components/family/AccountForm';
import { AccountList } from '@/components/family/AccountList';
import { SubscriptionForm } from '@/components/family/SubscriptionForm';
import { SubscriptionList } from '@/components/family/SubscriptionList';
import { RecurringExpenseForm } from '@/components/family/RecurringExpenseForm';
import { RecurringIncomeForm } from '@/components/family/RecurringIncomeForm';
import { RecurringExpenseList } from '@/components/family/RecurringExpenseList';
import { BudgetOverview } from '@/components/family/BudgetOverview';
import { SafeToSpend } from '@/components/family/SafeToSpend';
import { GoalCard } from '@/components/family/GoalCard';
import { GoalForm } from '@/components/family/GoalForm';
import { GoalContribution } from '@/components/family/GoalContribution';
import { SharedWalletForm } from '@/components/family/SharedWalletForm';
import { SharedWalletDetail } from '@/components/family/SharedWalletDetail';
import { NetWorthChart } from '@/components/family/NetWorthChart';
import { RecurringBillForm } from '@/components/family/RecurringBillForm';
import { RecurringBillList } from '@/components/family/RecurringBillList';

import {
  FamilyTransaction, Subscription, RecurringExpense, RecurringIncome,
  RecurringBill, Account, Goal, SharedWallet,
  PERSONAL_STORAGE_KEYS, FAMILY_STORAGE_KEYS,
  INCOME_CATEGORIES, INCOME_FREQUENCY_LABELS,
} from '@/types/familyFinance';

import type { Scope } from './ScopeToggle';

// ─── Types ──────────────────────────────────────────────────────

export type FinansSubTab = 'ozet' | 'gelir-gider' | 'duzenli-odemeler' | 'butce-hedefler' | 'hesaplar';

export const FINANS_TAB_IDS: FinansSubTab[] = ['ozet', 'gelir-gider', 'duzenli-odemeler', 'butce-hedefler', 'hesaplar'];

// ─── Component ──────────────────────────────────────────────────

interface FinanceContentProps {
  scope: Scope;
  activeSubTab: FinansSubTab;
  onActiveSubTabChange: (tab: FinansSubTab) => void;
  pendingAction?: string | null;
  onActionHandled?: () => void;
}

export function FinanceContent({ scope, activeSubTab, pendingAction, onActionHandled }: FinanceContentProps) {
  const { t } = useTranslation(['family', 'finance', 'common', 'subscription']);
  const { formatAmount } = usePrivacyMode();
  const { isPremium, isScreenshotMode } = useSubscriptionContext();
  const effectivePremium = isPremium || isScreenshotMode;

  // Select storage keys based on scope
  const keys = scope === 'personal' ? PERSONAL_STORAGE_KEYS : FAMILY_STORAGE_KEYS;

  // All 10 hooks — called with scope-specific storage keys + Firebase sync for family
  const txHook = useTransactions(keys.TRANSACTIONS, scope);
  const accountHook = useAccounts(keys.ACCOUNTS, scope);
  const subHook = useSubscriptions(keys.SUBSCRIPTIONS, scope);
  const recurHook = useRecurringExpenses(keys.RECURRING_EXPENSES, scope);
  const incomeHook = useRecurringIncomes(keys.RECURRING_INCOMES, scope);
  const budgetHook = useBudget(keys.BUDGETS, scope);
  const goalHook = useGoals(keys.GOALS, scope);
  const walletHook = useSharedWallets(keys.SHARED_WALLETS, scope);
  const netWorthHook = useNetWorth(keys.NETWORTH_HISTORY, scope);
  const billHook = useRecurringBills(keys.MONTHLY_BILLS, scope);

  // Modal states
  const [showTxForm, setShowTxForm] = useState(false);
  const [editingTx, setEditingTx] = useState<FamilyTransaction | undefined>();
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();
  const [showSubForm, setShowSubForm] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | undefined>();
  const [showRecurForm, setShowRecurForm] = useState(false);
  const [editingRecur, setEditingRecur] = useState<RecurringExpense | undefined>();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [showGoalContrib, setShowGoalContrib] = useState<string | null>(null);
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<RecurringIncome | undefined>();
  const [showBillForm, setShowBillForm] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | undefined>();
  const [showLimitPaywall, setShowLimitPaywall] = useState(false);
  const [limitPaywallInfo, setLimitPaywallInfo] = useState<{ key: LimitKey; current: number; limit: number } | null>(null);

  // Limit-gated callback for child components with internal add buttons
  const gatedAction = (key: LimitKey, currentCount: number, action: () => void) => {
    const result = checkLimit(key, currentCount, effectivePremium);
    if (result.allowed) {
      action();
    } else {
      setLimitPaywallInfo({ key, current: result.current, limit: result.limit });
      setShowLimitPaywall(true);
    }
  };

  const totalRecurring = billHook.bills.length + subHook.subscriptions.length + recurHook.expenses.length;

  // Handle pending FAB action
  useEffect(() => {
    if (pendingAction === 'expense' || pendingAction === 'income') {
      setEditingTx(undefined);
      setShowTxForm(true);
      onActionHandled?.();
    }
  }, [pendingAction, onActionHandled]);

  // Safe-to-spend calc
  const monthlyIncome = incomeHook.monthlyTotal > 0
    ? incomeHook.monthlyTotal
    : (budgetHook.currentBudget?.totalIncome || txHook.monthlyTotals.income);
  const totalBills = subHook.monthlyCost + recurHook.monthlyCost + billHook.monthlyCost;
  const totalBudgeted = budgetHook.currentBudget
    ? budgetHook.currentBudget.categories.reduce((s, c) => s + c.allocated, 0)
    : 0;
  const safeToSpend = monthlyIncome - totalBills - txHook.monthlyTotals.expense;

  const renderSubTab = () => {
    switch (activeSubTab) {
      case 'ozet':
        return (
          <div className="space-y-4">
            <SafeToSpend
              amount={safeToSpend}
              monthlyIncome={monthlyIncome}
              totalBills={totalBills}
              totalBudgeted={totalBudgeted}
            />
            <div className="grid grid-cols-2 gap-2">
              <LimitGate limitKey="MONTHLY_TRANSACTIONS" currentCount={txHook.getByMonth(new Date().getMonth(), new Date().getFullYear()).length} onAllowed={() => { setEditingTx(undefined); setShowTxForm(true); }}>
                <Button
                  variant="outline"
                  className="gap-2 bg-green-500/5 border-green-500/20"
                >
                  <ArrowUpCircle className="h-4 w-4 text-green-600" />
                  {t('transactions.income')} {t('common:actions.add')}
                </Button>
              </LimitGate>
              <LimitGate limitKey="MONTHLY_TRANSACTIONS" currentCount={txHook.getByMonth(new Date().getMonth(), new Date().getFullYear()).length} onAllowed={() => { setEditingTx(undefined); setShowTxForm(true); }}>
                <Button
                  variant="outline"
                  className="gap-2 bg-red-500/5 border-red-500/20"
                >
                  <ArrowDownCircle className="h-4 w-4 text-red-600" />
                  {t('transactions.expense')} {t('common:actions.add')}
                </Button>
              </LimitGate>
            </div>
            <TransactionSummary
              income={txHook.monthlyTotals.income}
              expense={txHook.monthlyTotals.expense}
              categoryBreakdown={txHook.categoryBreakdown}
            />
            <AccountList
              accounts={accountHook.accounts}
              onAdd={() => gatedAction('ACCOUNTS', accountHook.accounts.length, () => { setEditingAccount(undefined); setShowAccountForm(true); })}
              onEdit={(a) => { setEditingAccount(a); setShowAccountForm(true); }}
              onDelete={(id) => { accountHook.deleteAccount(id); toast({ title: t('accounts.deleted') }); }}
            />
            {goalHook.goals.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">{t('goals.title')}</h3>
                <div className="space-y-2">
                  {goalHook.goals.slice(0, 3).map((g) => (
                    <GoalCard key={g.id} goal={g} onEdit={(goal) => { setEditingGoal(goal); setShowGoalForm(true); }} onContribute={(id) => setShowGoalContrib(id)} />
                  ))}
                </div>
              </div>
            )}
            <NetWorthChart snapshots={netWorthHook.monthlySnapshots} latestSnapshot={netWorthHook.latestSnapshot} trend={netWorthHook.trend} />
          </div>
        );

      case 'gelir-gider':
        return (
          <div className="space-y-4">
            {/* Income Section */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('incomeSection.incomeSources')}</h2>
              <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700" onClick={() => { setEditingIncome(undefined); setShowIncomeForm(true); }}>
                <Plus className="h-4 w-4" />{t('incomeSection.addIncome')}
              </Button>
            </div>
            {incomeHook.incomes.length > 0 && (
              <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-4">
                <p className="text-xs text-muted-foreground">{t('incomeSection.monthlyTotal')}</p>
                <p className="text-2xl font-bold text-green-600">{formatAmount(incomeHook.monthlyTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('incomeSection.yearly')}: {formatAmount(incomeHook.yearlyTotal)}</p>
              </div>
            )}

            {/* Income Distribution Chart */}
            {incomeHook.incomes.filter((i) => i.isActive).length > 0 && (() => {
              const total = incomeHook.monthlyTotal;
              const entries = Object.entries(incomeHook.incomeByCategory)
                .filter(([, v]) => v > 0)
                .sort((a, b) => b[1] - a[1]);
              const colors = ['bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-lime-500'];
              return (
                <div className="rounded-2xl bg-card p-4 shadow-soft space-y-3">
                  <h3 className="text-sm font-semibold">{t('incomeSection.distribution')}</h3>
                  <div className="flex h-4 overflow-hidden rounded-full bg-secondary">
                    {entries.map(([cat, amount], idx) => (
                      <div
                        key={cat}
                        className={`${colors[idx % colors.length]} transition-all`}
                        style={{ width: `${total > 0 ? (amount / total) * 100 : 0}%` }}
                      />
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {entries.map(([cat, amount], idx) => {
                      const catInfo = INCOME_CATEGORIES.find((c) => c.id === cat);
                      const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : '0';
                      return (
                        <div key={cat} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${colors[idx % colors.length]}`} />
                            <span className="flex items-center gap-1"><CategoryIcon name={catInfo?.icon || 'package'} size={16} /> {catInfo?.label || cat}</span>
                          </div>
                          <span className="font-medium">{formatAmount(amount)} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* One-time incomes */}
            {incomeHook.incomes.filter((i) => i.frequency === 'one-time').length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">{t('incomeSection.oneTime')}</h3>
                <div className="space-y-2">
                  {incomeHook.incomes.filter((i) => i.frequency === 'one-time').map((inc) => (
                    <div key={inc.id} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-soft">
                      <CategoryIcon name={inc.icon} size={20} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{inc.name}</p>
                        <p className="text-xs text-muted-foreground">{INCOME_FREQUENCY_LABELS[inc.frequency]}</p>
                      </div>
                      <div className="text-right"><p className="text-sm font-semibold text-green-600">{formatAmount(inc.amount)}</p></div>
                      <button onClick={() => { setEditingIncome(inc); setShowIncomeForm(true); }} className="text-xs text-muted-foreground hover:text-foreground">{t('common:actions.edit')}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Systematic incomes */}
            <div>
              <h3 className="text-sm font-semibold mb-2">{t('incomeSection.systematic')}</h3>
              <div className="space-y-2">
                {incomeHook.incomes.filter((i) => i.frequency !== 'one-time').map((inc) => (
                  <div key={inc.id} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-soft">
                    <CategoryIcon name={inc.icon} size={20} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{inc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {INCOME_FREQUENCY_LABELS[inc.frequency]}
                        {inc.dayOfMonth && ` - ${t('incomeSection.monthDay')} ${inc.dayOfMonth}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{formatAmount(inc.amount)}</p>
                      {!inc.isActive && <p className="text-[10px] text-red-500">{t('common:status.inactive')}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => { setEditingIncome(inc); setShowIncomeForm(true); }} className="text-[10px] text-muted-foreground hover:text-foreground">{t('common:actions.edit')}</button>
                      <button onClick={() => incomeHook.toggleActive(inc.id)} className={`text-[10px] ${inc.isActive ? 'text-orange-500' : 'text-green-500'}`}>{inc.isActive ? t('incomeSection.pause') : t('incomeSection.activate')}</button>
                    </div>
                  </div>
                ))}
                {incomeHook.incomes.filter((i) => i.frequency !== 'one-time').length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">{t('incomeSection.noSystematic')}</p>
                )}
              </div>
            </div>

            <hr className="border-border" />

            {/* Transactions Section */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('incomeSection.incomeExpense')}</h2>
              <LimitGate limitKey="MONTHLY_TRANSACTIONS" currentCount={txHook.getByMonth(new Date().getMonth(), new Date().getFullYear()).length} onAllowed={() => { setEditingTx(undefined); setShowTxForm(true); }}>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />{t('common:actions.add')}
                </Button>
              </LimitGate>
            </div>
            <TransactionSummary income={txHook.monthlyTotals.income} expense={txHook.monthlyTotals.expense} categoryBreakdown={txHook.categoryBreakdown} />
            <TransactionList transactions={txHook.transactions} onDelete={(id) => { txHook.deleteTransaction(id); toast({ title: t('transactions.deleted') }); }} onEdit={(tx) => { setEditingTx(tx); setShowTxForm(true); }} />
          </div>
        );

      case 'duzenli-odemeler':
        return (
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-4 text-center">
              <p className="text-xs text-muted-foreground">{t('bills.totalMonthlyLoad')}</p>
              <p className="text-2xl font-bold text-indigo-600">
                {formatAmount(billHook.monthlyCost + subHook.monthlyCost + recurHook.monthlyCost)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">{t('bills.title')}</h3>
              <RecurringBillList
                bills={billHook.bills}
                monthlyCost={billHook.monthlyCost}
                onAdd={() => gatedAction('RECURRING_BILLS', totalRecurring, () => { setEditingBill(undefined); setShowBillForm(true); })}
                onEdit={(bill) => { setEditingBill(bill); setShowBillForm(true); }}
                onToggle={billHook.toggleActive}
                onPay={(id, amount) => {
                  billHook.recordPayment(id, amount);
                  toast({ title: t('bills.paid') });
                }}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">{t('bills.sectionSubscriptions')}</h3>
              <SubscriptionList
                subscriptions={subHook.subscriptions}
                monthlyCost={subHook.monthlyCost}
                yearlyCost={subHook.yearlyCost}
                onAdd={() => gatedAction('RECURRING_BILLS', totalRecurring, () => { setEditingSub(undefined); setShowSubForm(true); })}
                onEdit={(s) => { setEditingSub(s); setShowSubForm(true); }}
                onToggle={subHook.toggleActive}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">{t('bills.sectionDailyRecurring')}</h3>
              <RecurringExpenseList
                expenses={recurHook.expenses}
                dailyCost={recurHook.dailyCost}
                monthlyCost={recurHook.monthlyCost}
                onAdd={() => gatedAction('RECURRING_BILLS', totalRecurring, () => { setEditingRecur(undefined); setShowRecurForm(true); })}
                onEdit={(e) => { setEditingRecur(e); setShowRecurForm(true); }}
                onToggle={recurHook.toggleActive}
              />
            </div>
          </div>
        );

      case 'butce-hedefler':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">{t('budget.management')}</h2>
            <SafeToSpend amount={safeToSpend} monthlyIncome={monthlyIncome} totalBills={totalBills} totalBudgeted={totalBudgeted} />
            <BudgetOverview
              budget={budgetHook.currentBudget}
              safeToSpend={budgetHook.safeToSpend}
              unallocated={budgetHook.unallocated}
              overBudgetCategories={budgetHook.overBudgetCategories}
              onCreateBudget={(...args) => gatedAction('BUDGETS', budgetHook.currentBudget ? 1 : 0, () => budgetHook.createBudget(...args))}
              onUpdateAllocation={budgetHook.updateCategoryAllocation}
              onUpdateIncome={budgetHook.updateBudgetIncome}
              onAddCategory={(...args) => gatedAction('BUDGETS', budgetHook.currentBudget ? 1 : 0, () => budgetHook.addCategory(...args))}
              onRemoveCategory={budgetHook.removeCategory}
            />

            <hr className="border-border" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('goals.title')}</h2>
              <LimitGate limitKey="GOALS" currentCount={goalHook.goals.length} onAllowed={() => { setEditingGoal(undefined); setShowGoalForm(true); }}>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />{t('goals.addGoal')}
                </Button>
              </LimitGate>
            </div>
            {goalHook.goals.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('goals.totalSaved')}</p>
                  <p className="text-lg font-bold text-emerald-600">{formatAmount(goalHook.totalSaved)}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('goals.totalTarget')}</p>
                  <p className="text-lg font-bold text-primary">{formatAmount(goalHook.totalTarget)}</p>
                </div>
              </div>
            )}
            {goalHook.goals.map((g) => (
              <GoalCard key={g.id} goal={g} onEdit={(goal) => { setEditingGoal(goal); setShowGoalForm(true); }} onContribute={(id) => setShowGoalContrib(id)} />
            ))}
            {goalHook.goals.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">{t('goals.noGoals')}</div>
            )}
          </div>
        );

      case 'hesaplar':
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">{t('sharedWallets.title')}</h2>
                <Button size="sm" className="gap-2" onClick={() => setShowWalletForm(true)}>
                  <Plus className="h-4 w-4" />{t('sharedWallets.add')}
                </Button>
              </div>
              {selectedWallet ? (
                (() => {
                  const w = walletHook.wallets.find((w) => w.id === selectedWallet);
                  if (!w) return null;
                  return (
                    <SharedWalletDetail
                      wallet={w}
                      balances={walletHook.getBalances(w.id)}
                      totalSpent={walletHook.getTotalSpent(w.id)}
                      onAddTransaction={walletHook.addTransaction}
                      onDeleteTransaction={walletHook.deleteTransaction}
                      onBack={() => setSelectedWallet(null)}
                    />
                  );
                })()
              ) : (
                <div className="space-y-2">
                  {walletHook.wallets.map((w) => (
                    <button key={w.id} onClick={() => setSelectedWallet(w.id)} className="flex w-full items-center gap-3 rounded-xl bg-card p-3 text-left shadow-sm">
                      <CategoryIcon name={w.icon} size={24} />
                      <div className="flex-1"><p className="text-sm font-medium">{w.name}</p><p className="text-xs text-muted-foreground">{w.members.join(', ')}</p></div>
                      <span className="text-sm font-medium">{formatAmount(walletHook.getTotalSpent(w.id))}</span>
                    </button>
                  ))}
                  {walletHook.wallets.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">{t('sharedWallets.noWallets')}</p>}
                </div>
              )}
            </div>
            <div>
              <h2 className="mb-2 text-lg font-bold">{t('netWorth.title')}</h2>
              <NetWorthChart snapshots={netWorthHook.monthlySnapshots} latestSnapshot={netWorthHook.latestSnapshot} trend={netWorthHook.trend} />
            </div>
            <div>
              <h2 className="mb-2 text-lg font-bold">{t('accounts.title')}</h2>
              <AccountList
                accounts={accountHook.accounts}
                onAdd={() => gatedAction('ACCOUNTS', accountHook.accounts.length, () => { setEditingAccount(undefined); setShowAccountForm(true); })}
                onEdit={(a) => { setEditingAccount(a); setShowAccountForm(true); }}
                onDelete={(id) => { accountHook.deleteAccount(id); toast({ title: t('accounts.deleted') }); }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderSubTab()}

      {/* Transaction Form Drawer */}
      <Drawer open={showTxForm} onOpenChange={setShowTxForm}>
        <DrawerContent className="max-h-[85vh]" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden><DrawerTitle>{t('transactions.title')}</DrawerTitle></VisuallyHidden>
          <div className="overflow-y-auto">
            <TransactionForm
              editTransaction={editingTx}
              onSubmit={(data) => {
                if (editingTx) { txHook.updateTransaction(editingTx.id, data); toast({ title: t('transactions.updated') }); }
                else { txHook.addTransaction(data); toast({ title: data.type === 'income' ? t('transactions.incomeAdded') : t('transactions.expenseAdded') }); }
              }}
              onClose={() => { setShowTxForm(false); setEditingTx(undefined); }}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Account Form Modal */}
      <Dialog open={showAccountForm} onOpenChange={setShowAccountForm}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden><DialogTitle>{t('accounts.title')}</DialogTitle></VisuallyHidden>
          <AccountForm
            editAccount={editingAccount}
            onSubmit={(data) => {
              if (editingAccount) { accountHook.updateAccount(editingAccount.id, data); toast({ title: t('accounts.editAccount') }); }
              else { accountHook.addAccount(data); toast({ title: t('accounts.addAccount') }); }
            }}
            onClose={() => { setShowAccountForm(false); setEditingAccount(undefined); }}
          />
        </DialogContent>
      </Dialog>

      {/* Subscription Form Modal */}
      <Dialog open={showSubForm} onOpenChange={setShowSubForm}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden><DialogTitle>{t('subscriptions.title')}</DialogTitle></VisuallyHidden>
          <SubscriptionForm
            editSubscription={editingSub}
            onSubmit={(data) => {
              if (editingSub) { subHook.updateSubscription(editingSub.id, data); toast({ title: t('subscriptions.editSubscription') }); }
              else { subHook.addSubscription(data); toast({ title: t('subscriptions.addSubscription') }); }
            }}
            onClose={() => { setShowSubForm(false); setEditingSub(undefined); }}
          />
        </DialogContent>
      </Dialog>

      {/* Recurring Expense Form Modal */}
      <Dialog open={showRecurForm} onOpenChange={setShowRecurForm}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden><DialogTitle>{t('incomeSection.dailyRecurring')}</DialogTitle></VisuallyHidden>
          <RecurringExpenseForm
            editExpense={editingRecur}
            onSubmit={(data) => {
              if (editingRecur) { recurHook.updateExpense(editingRecur.id, data); toast({ title: t('incomeSection.incomeUpdated') }); }
              else { recurHook.addExpense(data); toast({ title: t('incomeSection.dailyExpenseAdded') }); }
            }}
            onClose={() => { setShowRecurForm(false); setEditingRecur(undefined); }}
          />
        </DialogContent>
      </Dialog>

      {/* Goal Form Modal */}
      <Dialog open={showGoalForm} onOpenChange={setShowGoalForm}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden><DialogTitle>{t('goals.title')}</DialogTitle></VisuallyHidden>
          <GoalForm
            editGoal={editingGoal}
            onSubmit={(data) => {
              if (editingGoal) { goalHook.updateGoal(editingGoal.id, data); toast({ title: t('goals.updated') }); }
              else { goalHook.addGoal(data); toast({ title: t('goals.created') }); }
            }}
            onDelete={(id) => { goalHook.deleteGoal(id); toast({ title: t('goals.deleted'), variant: 'destructive' }); }}
            onClose={() => { setShowGoalForm(false); setEditingGoal(undefined); }}
          />
        </DialogContent>
      </Dialog>

      {/* Goal Contribution Drawer */}
      <Drawer open={!!showGoalContrib} onOpenChange={() => setShowGoalContrib(null)}>
        <DrawerContent className="max-h-[85vh]" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden><DrawerTitle>{t('goals.addMoney')}</DrawerTitle></VisuallyHidden>
          <div className="overflow-y-auto">
            {showGoalContrib && (() => {
              const goal = goalHook.goals.find((g) => g.id === showGoalContrib);
              if (!goal) return null;
              return (
                <GoalContribution
                  goalName={goal.name}
                  currentAmount={goal.currentAmount}
                  targetAmount={goal.targetAmount}
                  onSubmit={(amount, note) => {
                    goalHook.addContribution(goal.id, amount, note);
                    toast({ title: t('goals.amountAdded', { amount: `${amount.toLocaleString('tr-TR')} ₺` }) });
                  }}
                  onClose={() => setShowGoalContrib(null)}
                />
              );
            })()}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Recurring Income Form Drawer */}
      <Drawer open={showIncomeForm} onOpenChange={setShowIncomeForm}>
        <DrawerContent className="max-h-[85vh]" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden><DrawerTitle>{t('incomeSection.title')}</DrawerTitle></VisuallyHidden>
          <div className="overflow-y-auto">
            <RecurringIncomeForm
              editIncome={editingIncome}
              onSubmit={(data) => {
                if (editingIncome) { incomeHook.updateIncome(editingIncome.id, data); toast({ title: t('incomeSection.incomeUpdated') }); }
                else { incomeHook.addIncome(data); toast({ title: t('incomeSection.incomeAdded') }); }
              }}
              onClose={() => { setShowIncomeForm(false); setEditingIncome(undefined); }}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Shared Wallet Form Modal */}
      <Dialog open={showWalletForm} onOpenChange={setShowWalletForm}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden><DialogTitle>{t('sharedWallets.title')}</DialogTitle></VisuallyHidden>
          <SharedWalletForm
            onSubmit={(data) => { walletHook.addWallet(data); toast({ title: t('sharedWallets.created') }); }}
            onClose={() => setShowWalletForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Recurring Bill Form Modal */}
      <Dialog open={showBillForm} onOpenChange={setShowBillForm}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden><DialogTitle>{editingBill ? t('bills.editBill') : t('bills.newBill')}</DialogTitle></VisuallyHidden>
          <RecurringBillForm
            editBill={editingBill}
            onSubmit={(data) => {
              if (editingBill) { billHook.updateBill(editingBill.id, data); toast({ title: t('bills.updated') }); }
              else { billHook.addBill(data); toast({ title: t('bills.added') }); }
            }}
            onClose={() => { setShowBillForm(false); setEditingBill(undefined); }}
          />
        </DialogContent>
      </Dialog>

      {/* Limit Paywall Dialog (for child component callbacks) */}
      <Dialog open={showLimitPaywall} onOpenChange={setShowLimitPaywall}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden><DialogTitle>{t('subscription:limits.reached')}</DialogTitle></VisuallyHidden>
          {limitPaywallInfo && (
            <div className="p-5 pb-0">
              <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-warning/20 to-amber-500/10 p-4 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20">
                  <Crown className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{t('subscription:limits.reached')}</p>
                  <p className="text-xs font-semibold text-warning mt-1">
                    {t('subscription:limits.current', { current: limitPaywallInfo.current, limit: limitPaywallInfo.limit })}
                  </p>
                </div>
              </div>
            </div>
          )}
          <SubscriptionPaywall onClose={() => setShowLimitPaywall(false)} showCloseButton={false} />
        </DialogContent>
      </Dialog>
    </>
  );
}
