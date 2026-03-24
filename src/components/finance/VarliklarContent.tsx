import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CreditCard as CreditCardIcon, Building2, Car } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';

import { CreditCard } from '@/types/finance';
import { CreditCardWidget } from '@/components/CreditCardWidget';
import { CardForm } from '@/components/CardForm';
import { PaymentCalendar } from '@/components/PaymentCalendar';
import { MonthlyCalendar } from '@/components/MonthlyCalendar';
import { PaymentActionDrawer } from '@/components/PaymentActionDrawer';
import { CardStatementDrawer } from '@/components/installments';
import { useCardInstallments } from '@/hooks/useCardInstallments';
import { calculateGoldenWindow, formatCurrency } from '@/lib/financeUtils';
import { useFamilySyncedStorage } from '@/hooks/useFamilySyncedStorage';
import { InvestmentPricesProvider, useInvestmentPricesContext } from '@/contexts/InvestmentPricesContext';
import { InvestmentForm } from '@/components/investment/InvestmentForm';
import { InvestmentList } from '@/components/investment/InvestmentList';
import { PortfolioSummary } from '@/components/investment/PortfolioSummary';
import { PortfolioPieChart } from '@/components/investment/PortfolioPieChart';
import { PriceRefreshButton } from '@/components/investment/PriceRefreshButton';
import { useFamilyInvestments } from '@/hooks/useInvestments';
import { useFamilyAssets } from '@/hooks/useAssets';
import { PropertyForm } from '@/components/PropertyForm';
import { VehicleForm } from '@/components/VehicleForm';
import { PROPERTY_TYPE_LABELS, LOCATION_LABELS, VEHICLE_TYPE_LABELS } from '@/types/assetTypes';
import { Investment, InvestmentCategory, INVESTMENT_CATEGORY_LABEL_KEYS, INVESTMENT_CATEGORY_EMOJIS } from '@/types/investment';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// ─── Types ──────────────────────────────────────────────────────
export type VarliklarSubTab = 'kartlar' | 'yatirimlar' | 'emlak' | 'takvim';

export const VARLIKLAR_TAB_IDS: VarliklarSubTab[] = ['kartlar', 'yatirimlar', 'emlak', 'takvim'];

// Investment sub-tabs
type InvestmentSubTab = 'portfoy' | 'altin' | 'doviz' | 'hisse' | 'kripto';

const INV_TAB_IDS: InvestmentSubTab[] = ['portfoy', 'altin', 'doviz', 'hisse', 'kripto'];
const INV_TAB_KEYS: Record<InvestmentSubTab, string> = {
  portfoy: 'tabs.portfolio',
  altin: 'tabs.gold',
  doviz: 'tabs.currency',
  hisse: 'tabs.stocks',
  kripto: 'tabs.crypto',
};
const INV_TAB_CATEGORIES: Record<InvestmentSubTab, InvestmentCategory[]> = {
  portfoy: [],
  altin: ['altin', 'gumus'],
  doviz: ['doviz'],
  hisse: ['hisse'],
  kripto: ['kripto'],
};

// ─── Investment tab inner component (needs InvestmentPricesProvider context) ──

function FamilyInvestmentContent({
  investments,
  investmentsByCategory,
  addInvestment,
  updateInvestment,
  deleteInvestment,
}: {
  investments: Investment[];
  investmentsByCategory: Record<InvestmentCategory, Investment[]>;
  addInvestment: (data: Omit<Investment, 'id' | 'createdAt'>) => Investment;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
}) {
  const { t } = useTranslation(['investments', 'family', 'common']);
  const { refreshPrices, isRefreshing, lastFetchedText } = useInvestmentPricesContext();

  const [investmentTab, setInvestmentTab] = useState<InvestmentSubTab>('portfoy');
  const [showInvForm, setShowInvForm] = useState(false);
  const [invFormCategory, setInvFormCategory] = useState<InvestmentCategory | undefined>();
  const [editingInvestment, setEditingInvestment] = useState<Investment | undefined>();

  const openAddForm = (category?: InvestmentCategory) => {
    setInvFormCategory(category);
    setEditingInvestment(undefined);
    setShowInvForm(true);
  };

  const openEditForm = (investment: Investment) => {
    setEditingInvestment(investment);
    setInvFormCategory(investment.category);
    setShowInvForm(true);
  };

  const handleSubmit = (data: Omit<Investment, 'id' | 'createdAt'>) => {
    if (editingInvestment) {
      updateInvestment(editingInvestment.id, data);
      toast({ title: t('investments:updated') });
    } else {
      addInvestment(data);
      toast({ title: t('investments:added') });
    }
    setShowInvForm(false);
    setEditingInvestment(undefined);
  };

  const handleDelete = (id: string) => {
    deleteInvestment(id);
    toast({ title: t('investments:deleted'), variant: 'destructive' });
  };

  const getTabInvestments = (tab: InvestmentSubTab): Investment[] => {
    const categories = INV_TAB_CATEGORIES[tab];
    if (categories.length === 0) return investments;
    return investments.filter((inv) => categories.includes(inv.category));
  };

  const renderInvTabContent = () => {
    if (investmentTab === 'portfoy') {
      return (
        <div className="space-y-4">
          <PriceRefreshButton
            onRefresh={refreshPrices}
            isRefreshing={isRefreshing}
            lastFetchedText={lastFetchedText}
          />
          <PortfolioSummary investments={investments} />
          {investments.length > 0 && <PortfolioPieChart investments={investments} />}

          {investments.length > 0 && (
            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <h3 className="font-semibold text-sm mb-3">{t('investments:quickAdd')}</h3>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(INVESTMENT_CATEGORY_LABEL_KEYS) as InvestmentCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => openAddForm(cat)}
                    className="flex flex-col items-center gap-1 rounded-xl bg-secondary/50 p-3 text-center transition-all hover:bg-secondary"
                  >
                    <span className="text-xl">{INVESTMENT_CATEGORY_EMOJIS[cat]}</span>
                    <span className="text-[10px] font-medium">{t(INVESTMENT_CATEGORY_LABEL_KEYS[cat])}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {investments.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="grid grid-cols-3 gap-3 w-full">
                {(Object.keys(INVESTMENT_CATEGORY_LABEL_KEYS) as InvestmentCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => openAddForm(cat)}
                    className="flex flex-col items-center gap-2 rounded-xl bg-secondary/50 p-4 text-center transition-all hover:bg-secondary hover:shadow-md"
                  >
                    <span className="text-2xl">{INVESTMENT_CATEGORY_EMOJIS[cat]}</span>
                    <span className="text-xs font-medium">{t(INVESTMENT_CATEGORY_LABEL_KEYS[cat])}</span>
                  </button>
                ))}
              </div>
              <Button onClick={() => openAddForm()} className="w-full gap-2" size="lg">
                <Plus className="h-4 w-4" />
                {t('investments:addFirst')}
              </Button>
            </div>
          )}
        </div>
      );
    }

    const tabInvestments = getTabInvestments(investmentTab);
    const categories = INV_TAB_CATEGORIES[investmentTab];
    const primaryCategory = categories[0] as InvestmentCategory | undefined;

    return (
      <div className="space-y-4">
        <PriceRefreshButton
          onRefresh={refreshPrices}
          isRefreshing={isRefreshing}
          lastFetchedText={lastFetchedText}
        />

        {categories.length > 1 ? (
          categories.map((cat) => {
            const catInvestments = investmentsByCategory[cat] || [];
            return (
              <div key={cat}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  {INVESTMENT_CATEGORY_EMOJIS[cat]} {t(INVESTMENT_CATEGORY_LABEL_KEYS[cat])}
                </h3>
                <InvestmentList
                  investments={catInvestments}
                  category={cat}
                  onAdd={() => openAddForm(cat)}
                  onEdit={openEditForm}
                  onDelete={handleDelete}
                />
              </div>
            );
          })
        ) : primaryCategory ? (
          <InvestmentList
            investments={tabInvestments}
            category={primaryCategory}
            onAdd={() => openAddForm(primaryCategory)}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
        ) : null}
      </div>
    );
  };

  return (
    <>
      {/* Investment sub-tabs */}
      <div className="flex gap-1 overflow-x-auto pb-3 no-scrollbar">
        {INV_TAB_IDS.map((tabId) => (
          <button
            key={tabId}
            onClick={() => setInvestmentTab(tabId)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              investmentTab === tabId
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(`investments:${INV_TAB_KEYS[tabId]}`)}
            {tabId !== 'portfoy' && getTabInvestments(tabId).length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">
                {getTabInvestments(tabId).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {renderInvTabContent()}

      {/* Investment Form Modal */}
      <Dialog
        open={showInvForm}
        onOpenChange={(open) => {
          setShowInvForm(open);
          if (!open) {
            setEditingInvestment(undefined);
            setInvFormCategory(undefined);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden>
            <DialogTitle>{editingInvestment ? t('investments:editInvestment') : t('investments:addInvestment')}</DialogTitle>
          </VisuallyHidden>
          <InvestmentForm
            preselectedCategory={invFormCategory}
            editingInvestment={editingInvestment}
            onSubmit={handleSubmit}
            onClose={() => {
              setShowInvForm(false);
              setEditingInvestment(undefined);
              setInvFormCategory(undefined);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main VarliklarContent ──────────────────────────────────────

interface VarliklarContentProps {
  activeSubTab: VarliklarSubTab;
}

export function VarliklarContent({ activeSubTab }: VarliklarContentProps) {
  const { t } = useTranslation(['family', 'common', 'investments', 'assets', 'cards']);

  // Hooks
  const [familyCards, setFamilyCards] = useFamilySyncedStorage<CreditCard[]>('kredi-pusula-family-cards', []);
  const invHook = useFamilyInvestments();
  const assetHook = useFamilyAssets();

  // Card modal states
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>();
  const [statementCard, setStatementCard] = useState<CreditCard | null>(null);
  const [payingCardId, setPayingCardId] = useState<string | null>(null);
  const { deleteInstallmentsByCard } = useCardInstallments('kredi-pusula-family-cards');

  const goldenWindowData = calculateGoldenWindow(familyCards);

  const handleCardSubmit = (card: CreditCard) => {
    if (editingCard) {
      setFamilyCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
      toast({ title: t('cards:form.updated') });
    } else {
      setFamilyCards((prev) => [...prev, { ...card, id: crypto.randomUUID() }]);
      toast({ title: t('cards:form.added') });
    }
    setShowCardForm(false);
    setEditingCard(undefined);
  };

  const handleCardDelete = (cardId: string) => {
    setFamilyCards((prev) => prev.filter((c) => c.id !== cardId));
    deleteInstallmentsByCard(cardId);
    toast({ title: t('cards:form.deleted'), variant: 'destructive' });
    setShowCardForm(false);
    setEditingCard(undefined);
    setStatementCard(null);
  };

  const renderSubTab = () => {
    switch (activeSubTab) {
      case 'kartlar':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('tabs.cards')}</h2>
              <Button size="sm" className="gap-2" onClick={() => { setEditingCard(undefined); setShowCardForm(true); }}>
                <Plus className="h-4 w-4" />
                {t('common:actions.add')}
              </Button>
            </div>

            {familyCards.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <CreditCardIcon className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{t('common:noData')}</p>
                <Button onClick={() => { setEditingCard(undefined); setShowCardForm(true); }} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('common:actions.add')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {goldenWindowData.map((gw) => (
                  <div key={gw.card.id} className="relative">
                    <CreditCardWidget
                      card={gw.card}
                      isGoldenWindow={gw.isGoldenWindow}
                      goldenRating={gw.goldenRating}
                      goldenDaysRemaining={gw.goldenDaysRemaining}
                      recommendation={gw.recommendation}
                      onClick={() => setStatementCard(gw.card)}
                      onPayClick={() => setPayingCardId(gw.card.id)}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="absolute top-3 right-3 z-10 rounded-full bg-black/30 p-1.5 text-white/80 hover:text-white hover:bg-black/50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('common:actions.delete')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {gw.card.bankName} - {gw.card.cardName}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCardDelete(gw.card.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t('common:actions.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'yatirimlar':
        return (
          <PremiumLockOverlay>
            <InvestmentPricesProvider>
              <div className="space-y-4">
                <h2 className="text-lg font-bold">{t('tabs.investments')}</h2>
                <FamilyInvestmentContent
                  investments={invHook.investments}
                  investmentsByCategory={invHook.investmentsByCategory}
                  addInvestment={invHook.addInvestment}
                  updateInvestment={invHook.updateInvestment}
                  deleteInvestment={invHook.deleteInvestment}
                />
              </div>
            </InvestmentPricesProvider>
          </PremiumLockOverlay>
        );

      case 'emlak':
        return (
          <PremiumLockOverlay showFloatingButton={false}>
            <div className="space-y-6">
              {/* Properties Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {t('assets:tabs.property')}
                  </h2>
                  <PropertyForm
                    onSubmit={(data) => {
                      assetHook.addProperty(data);
                      toast({ title: t('assets:property.added') });
                    }}
                  />
                </div>

                {assetHook.properties.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Building2 className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">{t('assets:property.notAdded')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assetHook.properties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-soft"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{property.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {PROPERTY_TYPE_LABELS[property.type]} - {LOCATION_LABELS[property.location]}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(property.currentValue)}</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-muted-foreground hover:text-destructive transition-colors p-1">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('common:actions.delete')}</AlertDialogTitle>
                              <AlertDialogDescription>{property.name}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  assetHook.deleteProperty(property.id);
                                  toast({ title: t('assets:property.deleted'), variant: 'destructive' });
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t('common:actions.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicles Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    {t('assets:tabs.vehicles')}
                  </h2>
                  <VehicleForm
                    onSubmit={(data) => {
                      assetHook.addVehicle(data);
                      toast({ title: t('assets:vehicle.added') });
                    }}
                  />
                </div>

                {assetHook.vehicles.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Car className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">{t('assets:vehicle.notAdded')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assetHook.vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-soft"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Car className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{vehicle.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.plate} - {VEHICLE_TYPE_LABELS[vehicle.vehicleType]}
                          </p>
                        </div>
                        {vehicle.purchaseValue && (
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatCurrency(vehicle.purchaseValue)}</p>
                          </div>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-muted-foreground hover:text-destructive transition-colors p-1">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('common:actions.delete')}</AlertDialogTitle>
                              <AlertDialogDescription>{vehicle.name} ({vehicle.plate})</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  assetHook.deleteVehicle(vehicle.id);
                                  toast({ title: t('assets:vehicle.deleted'), variant: 'destructive' });
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t('common:actions.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PremiumLockOverlay>
        );

      case 'takvim':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">{t('tabs.calendar')}</h2>
            <PaymentCalendar cards={familyCards} />
            <MonthlyCalendar cards={familyCards} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderSubTab()}

      {/* Card Form Modal */}
      <Dialog open={showCardForm} onOpenChange={(open) => { setShowCardForm(open); if (!open) setEditingCard(undefined); }}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden><DialogTitle>{editingCard ? t('cards:form.editCard') : t('cards:form.addCard')}</DialogTitle></VisuallyHidden>
          <CardForm
            card={editingCard}
            onSubmit={handleCardSubmit}
            onDelete={editingCard ? handleCardDelete : undefined}
            onClose={() => { setShowCardForm(false); setEditingCard(undefined); }}
            isFamilyContext={true}
          />
        </DialogContent>
      </Dialog>

      {/* Card Statement Drawer (family) */}
      {statementCard && (
        <CardStatementDrawer
          open={!!statementCard}
          onOpenChange={(open) => { if (!open) setStatementCard(null); }}
          card={statementCard}
          onEditCard={() => {
            setEditingCard(statementCard);
            setStatementCard(null);
            setShowCardForm(true);
          }}
          onPayClick={() => {
            setPayingCardId(statementCard.id);
            setStatementCard(null);
          }}
          storageKey="kredi-pusula-family-cards"
        />
      )}

      {/* Payment Action Drawer (family) */}
      <PaymentActionDrawer
        open={payingCardId !== null}
        onOpenChange={(open) => { if (!open) setPayingCardId(null); }}
        assetType="card"
        assetId={payingCardId}
        storageKey="kredi-pusula-family-cards"
        onPaymentComplete={() => {
          setPayingCardId(null);
          try {
            const stored = window.localStorage.getItem('kredi-pusula-family-cards');
            if (stored) setFamilyCards(JSON.parse(stored));
          } catch { /* ignore */ }
        }}
      />
    </>
  );
}
