import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Receipt, Check, X } from 'lucide-react';
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
import { EXPENSE_CATEGORIES } from '@/types/familyFinance';
import { parseTurkishNumber } from '@/lib/financeUtils';
import { CategoryIcon } from '@/components/ui/category-icon';

interface ParsedReceiptLike {
  total: number | null;
  date: string | null;
  merchant: string | null;
  category: string | null;
  confidence: 'high' | 'medium' | 'low';
}

interface ReceiptScanResultProps {
  result: ParsedReceiptLike;
  onSave: (data: { amount: number; category: string; date: string; merchant: string }) => void;
  onClose: () => void;
}

const ReceiptScanResult = ({ result, onSave, onClose }: ReceiptScanResultProps) => {
  const { t } = useTranslation(['ai', 'cards']);

  const [amount, setAmount] = useState(
    result.total ? result.total.toLocaleString('tr-TR') : ''
  );
  const [category, setCategory] = useState(result.category || 'diger-gider');
  const [date, setDate] = useState(result.date || new Date().toISOString().split('T')[0]);
  const [merchant, setMerchant] = useState(result.merchant || '');

  const confidenceColor = {
    high: 'bg-success text-success-foreground',
    medium: 'bg-warning text-warning-foreground',
    low: 'bg-muted text-muted-foreground',
  };

  const confidencePercent = {
    high: 90,
    medium: 60,
    low: 30,
  };

  const handleSave = () => {
    const parsedAmount = parseTurkishNumber(amount);
    if (parsedAmount <= 0) return;

    onSave({
      amount: parsedAmount,
      category,
      date,
      merchant,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-5 w-5 text-primary" />
            {t('ai:receipt.editBeforeSave')}
          </CardTitle>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Bar */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t('ai:receipt.confidence')}
            </span>
            <Badge className={`text-[9px] ${confidenceColor[result.confidence]}`}>
              %{confidencePercent[result.confidence]}
            </Badge>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                result.confidence === 'high'
                  ? 'bg-success'
                  : result.confidence === 'medium'
                    ? 'bg-warning'
                    : 'bg-muted-foreground'
              }`}
              style={{ width: `${confidencePercent[result.confidence]}%` }}
            />
          </div>
        </div>

        {/* Editable Fields */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Amount */}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
              {t('ai:nlp.amount')}
            </label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-10"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                TL
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
              {t('ai:nlp.category')}
            </label>
            <Select value={category} onValueChange={setCategory}>
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

          {/* Date */}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
              {t('ai:nlp.date')}
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Merchant */}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
              {t('ai:nlp.merchant')}
            </label>
            <Input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={t('ai:nlp.merchant')}
            />
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={parseTurkishNumber(amount) <= 0}
          className="w-full gap-2"
        >
          <Check className="h-4 w-4" />
          {t('ai:receipt.saveAsTransaction')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReceiptScanResult;
