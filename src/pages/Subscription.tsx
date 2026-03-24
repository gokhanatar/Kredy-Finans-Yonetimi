import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubscriptionPaywall } from '@/components/SubscriptionPaywall';

export default function Subscription() {
  const navigate = useNavigate();
  const { t } = useTranslation(['subscription', 'common']);

  return (
    <div className="relative">
      <div className="absolute left-3 top-3 z-20">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-background/80 backdrop-blur-sm">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <SubscriptionPaywall
        onClose={() => navigate(-1)}
        showCloseButton={false}
      />
    </div>
  );
}
