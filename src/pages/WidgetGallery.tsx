import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/MobileNav';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { WidgetPreviewCard } from '@/components/widgets/WidgetPreviewCard';
import { WidgetSetupGuide } from '@/components/widgets/WidgetSetupGuide';
import { widgets, CATEGORY_LABEL_KEYS, type WidgetCategory } from '@/data/widgetData';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | WidgetCategory;

const TAB_IDS: FilterTab[] = ['all', 'ciddi', 'komik', 'eglenceli'];

export default function WidgetGallery() {
  const navigate = useNavigate();
  const { t } = useTranslation(['widgets', 'common']);
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = filter === 'all' ? widgets : widgets.filter((w) => w.category === filter);

  return (
    <div className="min-h-screen bg-background pb-safe-nav">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('title')}</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* FREE: Filter tabs + widget preview cards */}
        <div className="flex gap-2">
          {TAB_IDS.map((tabId) => (
            <button
              key={tabId}
              onClick={() => setFilter(tabId)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                filter === tabId
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-muted-foreground'
              )}
            >
              {t(`categories.${tabId}`)}
            </button>
          ))}
        </div>

        {/* Category sections */}
        {filter === 'all' ? (
          (['ciddi', 'komik', 'eglenceli'] as WidgetCategory[]).map((cat) => {
            const catWidgets = widgets.filter((w) => w.category === cat);
            return (
              <div key={cat} className="space-y-3">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  {t(CATEGORY_LABEL_KEYS[cat])}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {catWidgets.map((w) => (
                    <WidgetPreviewCard key={w.id} widget={w} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((w) => (
              <WidgetPreviewCard key={w.id} widget={w} />
            ))}
          </div>
        )}

        {/* LOCKED: Setup guide */}
        <PremiumLockOverlay>
          <WidgetSetupGuide />
        </PremiumLockOverlay>
      </div>

      <MobileNav activeTab="profile" />
    </div>
  );
}
