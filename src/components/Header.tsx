import { Bell, Settings, Crown, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePrivacyMode } from "@/hooks/usePrivacyMode";
import { useNotificationInbox } from "@/hooks/useNotificationInbox";
import { PremiumBadge } from "@/components/PremiumBadge";
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  userName?: string;
}

export function Header({ userName }: HeaderProps) {
  const navigate = useNavigate();
  const { isPremium, isTrialActive, trialDaysLeft, isScreenshotMode } = useSubscriptionContext();
  const { isPinSet, lock } = useAuth();
  const { isPrivate, toggle: togglePrivacy } = usePrivacyMode();
  const { unreadCount } = useNotificationInbox();
  const { t } = useTranslation(['common']);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('greeting.morning');
    if (hour >= 12 && hour < 18) return t('greeting.afternoon');
    if (hour >= 18 && hour < 22) return t('greeting.evening');
    return t('greeting.night');
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl safe-area-top">
      <div className="page-container flex items-center justify-between py-4">
        {/* Logo & Greeting */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt={t('appName')} className="h-10 w-10 rounded-xl shadow-glow" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{getGreeting()}</p>
              {isPremium && !isTrialActive && !isScreenshotMode && (
                <button onClick={() => navigate('/subscription')} className="transition-transform active:scale-95">
                  <PremiumBadge size="sm" />
                </button>
              )}
            </div>
            <h1 className="text-lg font-bold text-foreground">{userName || t('common:defaultUser')}</h1>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isPremium && !isScreenshotMode ? (
            <button
              onClick={() => navigate('/subscription')}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-warning to-amber-500 px-3 text-sm font-medium text-white transition-all hover:shadow-lg"
            >
              <Crown className="h-4 w-4" />
              <span>{t('subscription:pro')}</span>
            </button>
          ) : isTrialActive && !isScreenshotMode ? (
            <button
              onClick={() => navigate('/subscription')}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-3 text-sm font-medium text-white transition-all hover:shadow-lg"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-xs">{trialDaysLeft} {t('common:time.days', { defaultValue: 'gün' })}</span>
            </button>
          ) : null}

          <button
            onClick={togglePrivacy}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
              isPrivate ? "bg-primary/10 text-primary" : "bg-secondary hover:bg-secondary/80"
            )}
            aria-label={isPrivate ? t('aria.showAmounts') : t('aria.hideAmounts')}
          >
            {isPrivate ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5 text-foreground" />}
          </button>

          {isPinSet && (
            <button
              onClick={lock}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary transition-colors hover:bg-secondary/80"
              aria-label={t('aria.lock')}
            >
              <Lock className="h-5 w-5 text-foreground" />
            </button>
          )}

          <button
            onClick={() => navigate('/notification-inbox')}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-secondary transition-colors hover:bg-secondary/80"
          >
            <Bell className="h-5 w-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs font-bold text-danger-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary transition-colors hover:bg-secondary/80"
          >
            <Settings className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
