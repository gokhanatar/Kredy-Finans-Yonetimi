import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Smartphone, Apple, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WidgetSetupGuide() {
  const { t } = useTranslation(['widgets', 'common']);
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (id: string) => setOpen(open === id ? null : id);

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Smartphone className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold">{t('title')}</h3>
      </div>

      <p className="text-xs text-amber-600 bg-amber-500/10 rounded-lg px-3 py-2">
        {t('setupGuide.note')}
      </p>

      {/* iOS */}
      <button
        onClick={() => toggle('ios')}
        className="flex w-full items-center justify-between rounded-xl bg-secondary/50 px-3 py-2.5"
      >
        <span className="text-xs font-medium flex items-center gap-2">
          <Apple className="h-4 w-4" /> {t('setupGuide.ios.title')}
        </span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open === 'ios' && 'rotate-180')} />
      </button>
      {open === 'ios' && (
        <ol className="ml-4 space-y-1.5 text-xs text-muted-foreground list-decimal list-outside pl-2">
          <li>{t('setupGuide.ios.step1')}</li>
          <li>{t('setupGuide.ios.step2')}</li>
          <li>{t('setupGuide.ios.step3')}</li>
          <li>{t('setupGuide.ios.step4')}</li>
          <li>{t('setupGuide.ios.step5')}</li>
          <li>{t('setupGuide.ios.step6')}</li>
        </ol>
      )}

      {/* Android */}
      <button
        onClick={() => toggle('android')}
        className="flex w-full items-center justify-between rounded-xl bg-secondary/50 px-3 py-2.5"
      >
        <span className="text-xs font-medium flex items-center gap-2">
          <Monitor className="h-4 w-4" /> {t('setupGuide.android.title')}
        </span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open === 'android' && 'rotate-180')} />
      </button>
      {open === 'android' && (
        <ol className="ml-4 space-y-1.5 text-xs text-muted-foreground list-decimal list-outside pl-2">
          <li>{t('setupGuide.android.step1')}</li>
          <li>{t('setupGuide.android.step2')}</li>
          <li>{t('setupGuide.android.step3')}</li>
          <li>{t('setupGuide.android.step4')}</li>
          <li>{t('setupGuide.android.step5')}</li>
        </ol>
      )}
    </div>
  );
}
