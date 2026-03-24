import { useState } from 'react';
import { Camera, Crown, Loader2, Cpu, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { SubscriptionPaywall } from '@/components/SubscriptionPaywall';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useReceiptScanner } from '@/hooks/useReceiptScanner';
import { isGeminiConfigured } from '@/lib/geminiReceiptScanner';
import { toast } from '@/hooks/use-toast';
import type { ParsedReceipt } from '@/lib/receiptParser';

interface ReceiptScanButtonProps {
  onResult: (receipt: ParsedReceipt) => void;
  compact?: boolean;
}

export function ReceiptScanButton({ onResult, compact = false }: ReceiptScanButtonProps) {
  const { t } = useTranslation(['cards', 'common']);
  const { isPremium, isScreenshotMode } = useSubscriptionContext();
  const { scanReceipt, scanReceiptWithAI, isScanning, error } = useReceiptScanner();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const geminiAvailable = isGeminiConfigured();

  const handleResult = (result: ParsedReceipt | null) => {
    if (result) {
      if (result.total) {
        toast({
          title: t('cards:receiptScanner.scanned'),
          description: t('cards:receiptScanner.scannedDesc'),
        });
      } else {
        toast({
          title: t('cards:receiptScanner.noAmount'),
          variant: 'destructive',
        });
      }
      onResult(result);
    } else if (error) {
      toast({
        title: t(`cards:receiptScanner.${error}`),
        variant: 'destructive',
      });
    }
  };

  const handleQuickScan = async () => {
    setShowMenu(false);
    const result = await scanReceipt();
    handleResult(result);
  };

  const handleAIScan = async () => {
    setShowMenu(false);
    if (!geminiAvailable) {
      toast({
        title: t('cards:receiptScanner.noApiKey'),
        variant: 'destructive',
      });
      return;
    }
    const result = await scanReceiptWithAI();
    handleResult(result);
  };

  const handleClick = () => {
    if (!isPremium && !isScreenshotMode) {
      setShowPaywall(true);
      return;
    }

    // If Gemini is configured, show menu. Otherwise direct scan.
    if (geminiAvailable) {
      setShowMenu(true);
    } else {
      handleQuickScan();
    }
  };

  const scanMenu = (
    <PopoverContent className="w-52 p-2" align="end">
      <button
        onClick={handleQuickScan}
        disabled={isScanning}
        className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-secondary"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Cpu className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{t('cards:receiptScanner.quickScan')}</p>
          <p className="text-[10px] text-muted-foreground">{t('cards:receiptScanner.quickMore')}</p>
        </div>
      </button>
      <button
        onClick={handleAIScan}
        disabled={isScanning}
        className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-secondary"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
          <Sparkles className="h-4 w-4 text-violet-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium flex items-center gap-1.5">
            {t('cards:receiptScanner.aiScan')}
            <span className="rounded bg-violet-500/15 px-1 py-0.5 text-[8px] font-bold text-violet-600">
              {t('cards:receiptScanner.aiLabel')}
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground">{t('cards:receiptScanner.aiMore')}</p>
        </div>
      </button>
    </PopoverContent>
  );

  if (compact) {
    return (
      <>
        <Popover open={showMenu} onOpenChange={setShowMenu}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={handleClick}
              disabled={isScanning}
              className="relative flex h-10 items-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
            >
              {isScanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {t('cards:receiptScanner.scan')}
              {!isPremium && !isScreenshotMode && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-warning to-amber-500">
                  <Crown className="h-2.5 w-2.5 text-white" />
                </span>
              )}
            </button>
          </PopoverTrigger>
          {scanMenu}
        </Popover>

        <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
          <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto p-0">
            <VisuallyHidden>
              <DialogTitle>{t('cards:receiptScanner.proRequired')}</DialogTitle>
            </VisuallyHidden>
            <SubscriptionPaywall onClose={() => setShowPaywall(false)} showCloseButton={false} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Popover open={showMenu} onOpenChange={setShowMenu}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            disabled={isScanning}
            className="relative gap-2"
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {t('cards:receiptScanner.scan')}
            {!isPremium && !isScreenshotMode && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-warning to-warning/80 px-1.5 py-0.5 text-[8px] font-bold text-white">
                <Crown className="h-2 w-2" /> PRO
              </span>
            )}
          </Button>
        </PopoverTrigger>
        {scanMenu}
      </Popover>

      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>{t('cards:receiptScanner.proRequired')}</DialogTitle>
          </VisuallyHidden>
          <SubscriptionPaywall onClose={() => setShowPaywall(false)} showCloseButton={false} />
        </DialogContent>
      </Dialog>
    </>
  );
}
