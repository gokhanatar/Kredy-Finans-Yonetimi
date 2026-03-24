import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Plus, Save, Coins, Gem, Banknote,
  BarChart3, Bitcoin, Search,
} from 'lucide-react';
import {
  InvestmentCategory,
  CurrencyType,
  StockExchange,
  Investment,
  INVESTMENT_CATEGORY_LABEL_KEYS,
  GOLD_ITEMS,
  GOLD_GROUP_LABELS,
  GOLD_GROUP_ICONS,
  METAL_ITEMS,
  CURRENCY_TYPE_LABELS,
  CURRENCY_FLAGS,
  BIST_STOCKS,
  US_STOCKS,
  POPULAR_CRYPTOS,
  CRYPTO_INFO,
  getInvestmentLabel,
  getGoldItem,
  type GoldGroup,
} from '@/types/investment';
import { useInvestmentPricesContext } from '@/contexts/InvestmentPricesContext';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';
import { cn } from '@/lib/utils';

interface InvestmentFormProps {
  preselectedCategory?: InvestmentCategory;
  editingInvestment?: Investment;
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<InvestmentCategory, { icon: typeof Coins; gradient: string; descKey: string }> = {
  altin: { icon: Coins, gradient: 'from-amber-500 to-yellow-400', descKey: 'investments:categories.goldDesc' },
  gumus: { icon: Gem, gradient: 'from-slate-400 to-gray-300', descKey: 'investments:categories.silverDesc' },
  doviz: { icon: Banknote, gradient: 'from-emerald-500 to-green-400', descKey: 'investments:categories.currencyDesc' },
  hisse: { icon: BarChart3, gradient: 'from-blue-500 to-cyan-400', descKey: 'investments:categories.stockDesc' },
  kripto: { icon: Bitcoin, gradient: 'from-purple-500 to-violet-400', descKey: 'investments:categories.cryptoDesc' },
};

export function InvestmentForm({ preselectedCategory, editingInvestment, onSubmit, onClose }: InvestmentFormProps) {
  const { t } = useTranslation(['investments', 'common']);
  const isEditing = !!editingInvestment;
  const initialCategory = editingInvestment?.category || preselectedCategory || '';
  const initialStep = editingInvestment ? 3 : (preselectedCategory ? 2 : 1);

  const [step, setStep] = useState(initialStep);
  const [category, setCategory] = useState<InvestmentCategory | ''>(initialCategory);
  const [subType, setSubType] = useState(editingInvestment?.subType || '');
  const [customName, setCustomName] = useState(editingInvestment?.customName || '');
  const [exchange, setExchange] = useState<StockExchange>(editingInvestment?.exchange || 'bist');
  const [quantity, setQuantity] = useState(editingInvestment ? formatNumber(editingInvestment.quantity) : '');
  const [purchasePrice, setPurchasePrice] = useState(editingInvestment ? formatNumber(editingInvestment.purchasePrice) : '');
  const [purchaseDate, setPurchaseDate] = useState(
    editingInvestment?.purchaseDate || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(editingInvestment?.notes || '');
  const [stockSearch, setStockSearch] = useState('');

  const { getPrice } = useInvestmentPricesContext();

  useEffect(() => {
    if (editingInvestment) {
      setStep(3);
      setCategory(editingInvestment.category);
      setSubType(editingInvestment.subType);
      setCustomName(editingInvestment.customName || '');
      setExchange(editingInvestment.exchange || 'bist');
      setQuantity(formatNumber(editingInvestment.quantity));
      setPurchasePrice(formatNumber(editingInvestment.purchasePrice));
      setPurchaseDate(editingInvestment.purchaseDate);
      setNotes(editingInvestment.notes || '');
    }
  }, [editingInvestment]);

  const handleCategorySelect = (cat: InvestmentCategory) => {
    setCategory(cat);
    setSubType('');
    setCustomName('');
    setStockSearch('');
    setStep(2);
  };

  const handleSubTypeSelect = (type: string, name?: string) => {
    setSubType(type);
    if (name) setCustomName(name);
    const price = getPrice(type);
    if (price) {
      setPurchasePrice(formatNumber(price.buyPrice));
    }
    setStep(3);
  };

  const handleSubmit = () => {
    if (!category || !subType || !quantity || !purchasePrice) return;
    onSubmit({
      category: category as InvestmentCategory,
      subType,
      customName: customName || undefined,
      exchange: category === 'hisse' ? exchange : undefined,
      quantity: parseTurkishNumber(quantity),
      purchasePrice: parseTurkishNumber(purchasePrice),
      purchaseDate,
      notes: notes || undefined,
    });
  };

  const goBack = () => {
    if (isEditing) { onClose(); return; }
    if (step === 3) setStep(2);
    else if (step === 2 && !preselectedCategory) setStep(1);
    else onClose();
  };

  const getSelectedLabel = () => {
    if (category) return getInvestmentLabel(category as InvestmentCategory, subType, customName);
    return subType;
  };

  const formatPrice = (p: number) => p.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const currentStocks = exchange === 'bist' ? BIST_STOCKS : US_STOCKS;

  const filteredStocks = useMemo(() => {
    if (!stockSearch) return currentStocks;
    const q = stockSearch.toLowerCase();
    return currentStocks.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [currentStocks, stockSearch]);

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={goBack} className="rounded-lg p-1.5 hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold">
          {isEditing && t('investments:editInvestment')}
          {!isEditing && step === 1 && t('investments:addInvestment')}
          {!isEditing && step === 2 && t(INVESTMENT_CATEGORY_LABEL_KEYS[category as InvestmentCategory])}
          {!isEditing && step === 3 && t('investments:form.details')}
        </h2>
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <div className="space-y-3">
          {(Object.keys(CATEGORY_ICONS) as InvestmentCategory[]).map((cat) => {
            const { icon: Icon, gradient, descKey } = CATEGORY_ICONS[cat];
            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 shadow-soft transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-md',
                  gradient
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">{t(INVESTMENT_CATEGORY_LABEL_KEYS[cat])}</p>
                  <p className="text-xs text-muted-foreground">{t(descKey)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: Gold (grouped) */}
      {step === 2 && category === 'altin' && (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {(['popular', 'yatirim', 'bilezik', 'kolye', 'yuzuk_kupe'] as GoldGroup[]).map((group) => {
            const groupItems = GOLD_ITEMS.filter((i) => i.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group} className="space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 sticky top-0 bg-background py-1 z-10">
                  <span>{GOLD_GROUP_ICONS[group]}</span> {GOLD_GROUP_LABELS[group]}
                </p>
                {groupItems.map((item) => {
                  const price = getPrice(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSubTypeSelect(item.id)}
                      className="flex w-full items-center justify-between rounded-xl bg-card p-3 shadow-soft transition-all hover:shadow-md active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{item.icon}</span>
                        <div className="text-left">
                          <span className="font-medium text-sm">{item.label}</span>
                          {item.needsGramInput && (
                            <span className="ml-1.5 text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1 py-0.5 rounded">{t('investments:form.gram')}</span>
                          )}
                        </div>
                      </div>
                      {price && price.sellPrice > 0 ? (
                        <span className="text-xs font-semibold text-amber-600">
                          {formatPrice(price.sellPrice)} ₺
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground">{t('investments:form.manual')}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Step 2: Silver & Metals */}
      {step === 2 && category === 'gumus' && (
        <div className="space-y-2">
          {METAL_ITEMS.map((item) => {
            const price = getPrice(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleSubTypeSelect(item.id)}
                className="flex w-full items-center justify-between rounded-xl bg-card p-3.5 shadow-soft transition-all hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {price && price.sellPrice > 0 ? (
                  <span className="text-sm font-semibold text-slate-500">
                    {formatPrice(price.sellPrice)} ₺
                  </span>
                ) : (
                  <span className="text-[9px] text-muted-foreground">{t('investments:form.manual')}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: Currency */}
      {step === 2 && category === 'doviz' && (
        <div className="space-y-2">
          {(Object.keys(CURRENCY_TYPE_LABELS) as CurrencyType[]).map((type) => {
            const price = getPrice(type);
            return (
              <button
                key={type}
                onClick={() => handleSubTypeSelect(type)}
                className="flex w-full items-center justify-between rounded-xl bg-card p-3.5 shadow-soft transition-all hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{CURRENCY_FLAGS[type]}</span>
                  <div className="text-left">
                    <span className="font-semibold text-sm">{type}</span>
                    <p className="text-xs text-muted-foreground">{CURRENCY_TYPE_LABELS[type].replace(` (${type})`, '')}</p>
                  </div>
                </div>
                {price && price.sellPrice > 0 && (
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatPrice(price.sellPrice)} ₺
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: Stocks (BIST & US) with Sector Tabs */}
      {step === 2 && category === 'hisse' && (
        <div className="space-y-3">
          {/* Exchange Toggle */}
          <div className="flex rounded-lg bg-secondary p-1 gap-1">
            <button
              onClick={() => { setExchange('bist'); setStockSearch(''); }}
              className={cn(
                'flex-1 rounded-md py-1.5 text-[11px] font-semibold transition-all text-center',
                exchange === 'bist' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              🇹🇷 BIST
            </button>
            <button
              onClick={() => { setExchange('us'); setStockSearch(''); }}
              className={cn(
                'flex-1 rounded-md py-1.5 text-[11px] font-semibold transition-all text-center',
                exchange === 'us' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              🇺🇸 ABD
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value.toUpperCase())}
              placeholder={exchange === 'bist' ? t('investments:form.searchStockBist') : t('investments:form.searchStockUs')}
              className="pl-9"
            />
          </div>

          {/* Custom entry */}
          {stockSearch && filteredStocks.length === 0 && (
            <Button
              onClick={() => {
                setCustomName(stockSearch);
                handleSubTypeSelect(stockSearch, stockSearch);
              }}
              variant="outline"
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('investments:form.continueWith', { name: stockSearch })}
            </Button>
          )}

          {/* Stock list */}
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {filteredStocks.map((stock) => {
              const price = getPrice(stock.symbol);
              return (
                <button
                  key={stock.symbol}
                  onClick={() => handleSubTypeSelect(stock.symbol, stock.symbol)}
                  className="flex w-full items-center justify-between rounded-xl bg-card p-3 shadow-soft transition-all hover:shadow-md active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg text-[10px] font-bold text-white',
                      exchange === 'bist' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    )}>
                      {stock.symbol.slice(0, 3)}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{stock.symbol}</p>
                      <p className="text-xs text-muted-foreground">{stock.name}</p>
                    </div>
                  </div>
                  {price && price.sellPrice > 0 ? (
                    <span className={cn(
                      'text-sm font-semibold',
                      exchange === 'bist' ? 'text-red-600' : 'text-blue-600'
                    )}>
                      {formatPrice(price.sellPrice)} ₺
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{t('investments:form.manual')}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Crypto */}
      {step === 2 && category === 'kripto' && (
        <div className="space-y-4">
          {/* Custom entry */}
          <div className="space-y-2">
            <Label>{t('investments:form.cryptoName')}</Label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={t('investments:form.cryptoPlaceholder')}
            />
            {customName && !POPULAR_CRYPTOS.includes(customName) && (
              <Button
                onClick={() => {
                  setSubType(customName);
                  setStep(3);
                }}
                variant="outline"
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('investments:form.continueWith', { name: customName })}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground font-medium">{t('investments:form.popularCryptos')}</p>

          <div className="space-y-1.5">
            {POPULAR_CRYPTOS.map((crypto) => {
              const info = CRYPTO_INFO[crypto];
              const price = getPrice(crypto);
              return (
                <button
                  key={crypto}
                  onClick={() => handleSubTypeSelect(crypto, crypto)}
                  className="flex w-full items-center justify-between rounded-xl bg-card p-3 shadow-soft transition-all hover:shadow-md active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-sm"
                      style={{ backgroundColor: info?.color || '#6b7280' }}
                    >
                      {info?.symbol || '?'}
                    </div>
                    <span className="font-medium text-sm">{crypto}</span>
                  </div>
                  {price && price.sellPrice > 0 ? (
                    <span className="text-sm font-semibold text-purple-600">
                      {formatPrice(price.sellPrice)} ₺
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('investments:form.manualPrice')}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Quantity & Price */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Selected badge */}
          <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('investments:form.selected')}</p>
            <p className="font-bold text-primary mt-0.5">
              {getSelectedLabel()}
              {category === 'hisse' && exchange && (
                <span className={cn(
                  'ml-2 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white',
                  exchange === 'bist' ? 'bg-red-500' : 'bg-blue-500'
                )}>
                  {exchange === 'bist' ? 'BIST' : 'ABD'}
                </span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label>
              {category === 'doviz' ? t('investments:form.quantityAmount') :
               category === 'kripto' ? t('investments:form.quantityPieces') :
               category === 'hisse' ? t('investments:form.lotPieces') :
               category === 'gumus' ? t('investments:form.gramWeight') :
               (() => {
                 const goldItem = getGoldItem(subType);
                 if (goldItem?.needsGramInput) return t('investments:form.gramWeight');
                 return t('investments:form.quantityPieces');
               })()}
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
                setQuantity(cleaned);
              }}
              onBlur={() => {
                if (quantity) {
                  const parsed = parseTurkishNumber(quantity);
                  if (parsed > 0) setQuantity(formatNumber(parsed));
                }
              }}
              placeholder={(() => {
                if (category === 'hisse') return t('investments:form.exHundred');
                const goldItem = getGoldItem(subType);
                if (goldItem?.needsGramInput || category === 'gumus') return t('investments:form.exGram');
                return t('investments:form.exOne');
              })()}
              step="any"
              min="0"
            />
            {(() => {
              const goldItem = getGoldItem(subType);
              if (goldItem?.fixedGramPerPiece) {
                const qty = parseTurkishNumber(quantity) || 0;
                if (qty > 0) {
                  return (
                    <p className="text-xs text-muted-foreground">
                      {t('investments:form.totalGold', { weight: (qty * goldItem.fixedGramPerPiece).toFixed(2), karat: goldItem.ayar })}
                    </p>
                  );
                }
              }
              return null;
            })()}
          </div>

          <div className="space-y-2">
            <Label>
              {(() => {
                const goldItem = getGoldItem(subType);
                if (goldItem?.needsGramInput || category === 'gumus') return t('investments:form.gramBuyPrice');
                return t('investments:form.unitBuyPrice');
              })()}
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              value={purchasePrice}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
                setPurchasePrice(cleaned);
              }}
              onBlur={() => {
                if (purchasePrice) {
                  const parsed = parseTurkishNumber(purchasePrice);
                  if (parsed > 0) setPurchasePrice(formatNumber(parsed));
                }
              }}
              placeholder={t('investments:form.exPrice')}
            />
            {getPrice(subType) && getPrice(subType)!.buyPrice > 0 && (
              <button
                onClick={() => setPurchasePrice(formatNumber(getPrice(subType)!.buyPrice))}
                className="text-xs text-primary font-medium hover:underline"
              >
                {t('investments:form.useCurrentPrice', { price: formatPrice(getPrice(subType)!.buyPrice) })}
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('investments:form.purchaseDate')}</Label>
            <Input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('investments:form.notesOptional')}</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('investments:form.notesPlaceholder')}
            />
          </div>

          {quantity && purchasePrice && parseTurkishNumber(quantity) > 0 && parseTurkishNumber(purchasePrice) > 0 && (
            <div className="rounded-xl bg-muted p-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('investments:form.totalCost')}</span>
                <span className="font-bold">
                  {formatPrice(parseTurkishNumber(quantity) * parseTurkishNumber(purchasePrice))} ₺
                </span>
              </div>
              {getPrice(subType) && getPrice(subType)!.sellPrice > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('investments:form.currentValue')}</span>
                  <span className="font-bold text-primary">
                    {formatPrice(parseTurkishNumber(quantity) * getPrice(subType)!.sellPrice)} ₺
                  </span>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!quantity || !purchasePrice || parseTurkishNumber(quantity) <= 0 || parseTurkishNumber(purchasePrice) <= 0}
            className="w-full gap-2"
            size="lg"
          >
            {isEditing ? (
              <><Save className="h-4 w-4" /> {t('common:actions.update')}</>
            ) : (
              <><Plus className="h-4 w-4" /> {t('investments:addInvestment')}</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
