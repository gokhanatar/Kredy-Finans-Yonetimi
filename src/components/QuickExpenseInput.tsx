import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Loader2, Sparkles, Wifi, WifiOff, Check, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStorageForScope } from '@/hooks/useStorageForScope';
import { PERSONAL_STORAGE_KEYS, FamilyTransaction, EXPENSE_CATEGORIES } from '@/types/familyFinance';
import { parseExpenseFromText, ParsedExpense } from '@/lib/naturalLanguageParser';
import { getGeminiApiKey } from '@/lib/geminiReceiptScanner';
import { formatCurrency, parseTurkishNumber } from '@/lib/financeUtils';
import { toast } from '@/hooks/use-toast';
import { CategoryIcon } from '@/components/ui/category-icon';

function getCategoryIcon(category: string): string {
  const found = EXPENSE_CATEGORIES.find((c) => c.id === category);
  return found?.icon || 'package';
}

const EXAMPLE_PROMPTS = [
  'ai:nlp.example1',
  'ai:nlp.example2',
  'ai:nlp.example3',
];

const QuickExpenseInput = () => {
  const { t } = useTranslation(['ai', 'family']);
  const [transactions, setTransactions] = useStorageForScope<FamilyTransaction[]>(
    PERSONAL_STORAGE_KEYS.TRANSACTIONS,
    [],
    'personal'
  );

  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedExpense | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editMerchant, setEditMerchant] = useState('');
  const [editDate, setEditDate] = useState('');

  const apiKey = getGeminiApiKey();
  const hasApiKey = !!apiKey;

  const handleParse = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsParsing(true);
    setParsedResult(null);
    setIsEditing(false);

    try {
      const result = await parseExpenseFromText(inputText, apiKey || undefined);

      if (result) {
        setParsedResult(result);
        setEditAmount(result.amount.toLocaleString('tr-TR'));
        setEditCategory(result.category);
        setEditMerchant(result.merchant);
        setEditDate(result.date);
      } else {
        toast({
          title: t('ai:nlp.parseFailed'),
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: t('ai:nlp.parseFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  }, [inputText, apiKey, t]);

  const handleSave = useCallback(() => {
    const amount = parseTurkishNumber(editAmount);
    if (amount <= 0) return;

    const newTransaction: FamilyTransaction = {
      id: crypto.randomUUID(),
      type: 'expense',
      amount,
      category: editCategory as FamilyTransaction['category'],
      description: editMerchant || parsedResult?.description || inputText,
      date: editDate || new Date().toISOString().split('T')[0],
      currency: 'TRY',
    };

    setTransactions((prev) => [newTransaction, ...prev]);

    toast({
      title: t('ai:nlp.saved'),
    });

    // Reset
    setParsedResult(null);
    setInputText('');
    setIsEditing(false);
  }, [editAmount, editCategory, editMerchant, editDate, parsedResult, inputText, setTransactions, t]);

  const handleExampleClick = (exampleKey: string) => {
    setInputText(t(exampleKey));
    setParsedResult(null);
  };

  return (
    <div className="space-y-4">
      {/* Input Area */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('ai:nlp.title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{t('ai:nlp.subtitle')}</p>
            <Badge
              variant="outline"
              className={`text-[9px] ${hasApiKey ? 'text-success' : 'text-muted-foreground'}`}
            >
              {hasApiKey ? (
                <>
                  <Wifi className="mr-0.5 h-2.5 w-2.5" />
                  {t('ai:nlp.aiPowered')}
                </>
              ) : (
                <>
                  <WifiOff className="mr-0.5 h-2.5 w-2.5" />
                  {t('ai:nlp.offlineMode')}
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Text input with send */}
          <div className="flex gap-2">
            <Input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isParsing) handleParse();
              }}
              placeholder={t('ai:nlp.placeholder')}
              className="flex-1"
              disabled={isParsing}
            />
            <Button
              size="icon"
              onClick={handleParse}
              disabled={isParsing || !inputText.trim()}
              className="shrink-0"
            >
              {isParsing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Example chips */}
          <div>
            <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">
              {t('ai:nlp.examples')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((key) => (
                <button
                  key={key}
                  onClick={() => handleExampleClick(key)}
                  className="rounded-full border bg-secondary/50 px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parsed Result Card */}
      {parsedResult && (
        <Card className="border-success/30 bg-success/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-success" />
                {t('ai:nlp.parsed')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px]">
                  {t('ai:nlp.confidence', {
                    percent: Math.round(parsedResult.confidence * 100),
                  })}
                </Badge>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex h-7 items-center gap-1 rounded-md border bg-background px-2 text-[10px] font-medium transition-colors hover:bg-secondary"
                >
                  <Pencil className="h-3 w-3" />
                  {t('ai:nlp.edit')}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEditing ? (
              <>
                {/* Editable fields */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                      {t('ai:nlp.amount')}
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        TL
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                      {t('ai:nlp.category')}
                    </label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <CategoryIcon name={cat.icon} size={14} />
                              <span>{cat.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                      {t('ai:nlp.merchant')}
                    </label>
                    <Input
                      type="text"
                      value={editMerchant}
                      onChange={(e) => setEditMerchant(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                      {t('ai:nlp.date')}
                    </label>
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Read-only display */}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-lg bg-background p-2.5">
                    <span className="text-[10px] text-muted-foreground">{t('ai:nlp.amount')}</span>
                    <span className="ml-auto text-sm font-semibold">
                      {formatCurrency(parsedResult.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-background p-2.5">
                    <CategoryIcon
                      name={getCategoryIcon(parsedResult.category)}
                      size={14}
                      className="text-muted-foreground"
                    />
                    <span className="text-[10px] text-muted-foreground">{t('ai:nlp.category')}</span>
                    <span className="ml-auto text-xs font-medium">{parsedResult.category}</span>
                  </div>

                  {parsedResult.merchant && (
                    <div className="flex items-center gap-2 rounded-lg bg-background p-2.5">
                      <span className="text-[10px] text-muted-foreground">{t('ai:nlp.merchant')}</span>
                      <span className="ml-auto text-xs font-medium">{parsedResult.merchant}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 rounded-lg bg-background p-2.5">
                    <span className="text-[10px] text-muted-foreground">{t('ai:nlp.date')}</span>
                    <span className="ml-auto text-xs font-medium">{parsedResult.date}</span>
                  </div>
                </div>
              </>
            )}

            <Button onClick={handleSave} className="w-full gap-2" size="sm">
              <Check className="h-4 w-4" />
              {t('ai:nlp.save')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuickExpenseInput;
