import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Delete, ScanFace, Fingerprint, ShieldCheck, HelpCircle, ArrowLeft, KeyRound, AlertTriangle, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

type ForgotStep = 'none' | 'hint1' | 'hint2' | 'final';

const SESSION_KEY = 'kredi-pusula-pin-failed-attempts';

export function PinLockScreen() {
  const {
    unlock,
    isBiometricEnabled,
    isBiometricAvailable,
    biometryType,
    unlockWithBiometric,
    pinHint1,
    pinHint2,
  } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('none');
  const [failedAttempts, setFailedAttempts] = useState(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });
  const maxLength = 6;
  const { t } = useTranslation(['settings']);

  // Persist failedAttempts to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, String(failedAttempts));
  }, [failedAttempts]);

  // Auto-trigger biometric on mount
  useEffect(() => {
    if (isBiometricEnabled) {
      unlockWithBiometric().then((success) => {
        if (success) {
          setUnlocked(true);
          sessionStorage.removeItem(SESSION_KEY);
        }
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDigit = (digit: string) => {
    if (pin.length >= maxLength) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === maxLength) {
      const success = unlock(newPin);
      if (success) {
        setUnlocked(true);
        sessionStorage.removeItem(SESSION_KEY);
      } else {
        setError(true);
        setShake(true);
        setFailedAttempts((prev) => prev + 1);
        setTimeout(() => {
          setPin('');
          setShake(false);
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleBiometric = async () => {
    const success = await unlockWithBiometric();
    if (success) {
      setUnlocked(true);
      sessionStorage.removeItem(SESSION_KEY);
    }
  };

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('common:greeting.morning');
    if (hour >= 12 && hour < 18) return t('common:greeting.afternoon');
    if (hour >= 18 && hour < 22) return t('common:greeting.evening');
    return t('common:greeting.night', { defaultValue: t('common:greeting.evening') });
  };

  const BiometricIcon = biometryType === 'face' ? ScanFace : Fingerprint;
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', (isBiometricEnabled ? 'bio' : ''), '0', 'del'];

  // Logo + Title block (reused in multiple views)
  const LogoBlock = () => (
    <>
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl scale-150 animate-pulse" />
        <img
          src="/logo.png"
          alt="Kredy"
          className="relative h-24 w-24 rounded-3xl shadow-lg"
          style={{ background: 'transparent' }}
        />
      </div>
      <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-0.5">
        Kredy
      </h1>
      <p className="text-muted-foreground text-xs mb-1">
        {t('pin.slogan')}
      </p>
    </>
  );

  // Unlock animation overlay
  if (unlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 animate-fade-out">
        <div className="flex flex-col items-center gap-4 animate-unlock-bounce">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
            <ShieldCheck className="h-10 w-10 text-success animate-check-pop" />
          </div>
          <p className="text-lg font-semibold text-success">{getGreeting()}</p>
        </div>
      </div>
    );
  }

  const handleBackToPin = () => {
    setForgotStep('none');
    setPin('');
    setError(false);
  };

  // Forgot PIN flow
  if (forgotStep !== 'none') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <LogoBlock />
        <p className="text-muted-foreground text-sm mb-6">
          {t('pin.forgotPin')}
        </p>

        <div className="w-full max-w-[320px] space-y-4">
          {/* Step 1: Show Hint 1 */}
          {forgotStep === 'hint1' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-secondary/50 p-4 text-center space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('pin.hintLabel')}
                </p>
                <p className="text-base font-medium">
                  {pinHint1 || t('pin.noHint')}
                </p>
              </div>
              <Button
                variant="default"
                className="w-full gap-2"
                onClick={handleBackToPin}
              >
                <KeyRound className="h-4 w-4" />
                {t('pin.remembered')}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => {
                  if (pinHint2) {
                    setForgotStep('hint2');
                  } else {
                    setForgotStep('final');
                  }
                }}
              >
                {t('pin.stillDontRemember')}
              </Button>
            </div>
          )}

          {/* Step 2: Show Hint 2 */}
          {forgotStep === 'hint2' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-secondary/50 p-4 text-center space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('pin.hintLabel2')}
                </p>
                <p className="text-base font-medium">
                  {pinHint2}
                </p>
              </div>
              <Button
                variant="default"
                className="w-full gap-2"
                onClick={handleBackToPin}
              >
                <KeyRound className="h-4 w-4" />
                {t('pin.remembered')}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setForgotStep('final')}
              >
                {t('pin.stillDontRemember')}
              </Button>
            </div>
          )}

          {/* Step 3: Biometric or reinstall */}
          {forgotStep === 'final' && (
            <div className="space-y-4">
              {isBiometricEnabled && isBiometricAvailable ? (
                <Button
                  variant="default"
                  className="w-full gap-2"
                  onClick={async () => {
                    const success = await unlockWithBiometric();
                    if (success) {
                      setUnlocked(true);
                      sessionStorage.removeItem(SESSION_KEY);
                    }
                  }}
                >
                  <BiometricIcon className="h-5 w-5" />
                  {t('pin.unlockBiometric')}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-destructive/10 p-4 text-center space-y-2">
                    <p className="text-sm font-semibold text-destructive">
                      {t('pin.resetTitle')}
                    </p>
                    <p className="text-sm text-destructive/80">
                      {t('pin.resetMessage')}
                    </p>
                    <p className="text-xs text-destructive font-medium">
                      {t('pin.resetWarning')}
                    </p>
                  </div>
                  {/* Sync recovery info */}
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Cloud className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      {t('pin.resetSyncRecovery')}
                    </p>
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground"
                onClick={handleBackToPin}
              >
                <ArrowLeft className="h-4 w-4" />
                {t('pin.backToPin')}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Logo - bigger and more prominent */}
      <LogoBlock />
      <p className="text-muted-foreground text-sm mb-8">
        {error
          ? t('pin.wrongPin')
          : isBiometricEnabled
            ? t('pin.enterPinOrBiometric')
            : t('pin.enterPin')}
      </p>

      <div className={cn('flex gap-3 mb-10', shake && 'animate-shake')}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-5 w-5 rounded-full border-2 transition-all duration-200',
              i < pin.length
                ? error
                  ? 'bg-destructive border-destructive scale-110'
                  : 'bg-primary border-primary scale-110 shadow-md shadow-primary/30'
                : 'border-muted-foreground/30'
            )}
          />
        ))}
      </div>

      {/* Auto-show hints based on failed attempts */}
      {failedAttempts >= 1 && pinHint1 && (
        <div className="w-full max-w-[280px] mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              {t('pin.hintLabel')}
            </p>
          </div>
          <p className="text-sm font-medium">{pinHint1}</p>
        </div>
      )}

      {/* Show "no hint set" warning when hints are not available */}
      {failedAttempts >= 1 && !pinHint1 && (
        <div className="w-full max-w-[280px] mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              {t('pin.hintLabel')}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">{t('pin.noHintSet')}</p>
        </div>
      )}

      {failedAttempts >= 3 && pinHint2 && (
        <div className="w-full max-w-[280px] mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              {t('pin.hintLabel2')}
            </p>
          </div>
          <p className="text-sm font-medium">{pinHint2}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
        {digits.map((digit, i) => {
          if (digit === '') return <div key={i} />;
          if (digit === 'bio') {
            return (
              <button
                key={i}
                onClick={handleBiometric}
                className="flex h-16 w-full items-center justify-center rounded-2xl transition-all hover:bg-secondary active:scale-95 active:bg-primary/10"
                aria-label={biometryType === 'face' ? 'Face ID' : 'Touch ID'}
              >
                <BiometricIcon className="h-6 w-6 text-primary" />
              </button>
            );
          }
          if (digit === 'del') {
            return (
              <button
                key={i}
                onClick={handleDelete}
                className="flex h-16 w-full items-center justify-center rounded-2xl transition-all hover:bg-secondary active:scale-95 active:bg-secondary/80"
                aria-label={t('common:actions.delete')}
              >
                <Delete className="h-6 w-6 text-foreground" />
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleDigit(digit)}
              className="flex h-16 w-full items-center justify-center rounded-2xl bg-secondary/60 backdrop-blur-sm border border-white/10 shadow-sm text-xl font-semibold transition-all hover:bg-secondary/80 active:scale-95 active:bg-primary/10"
            >
              {digit}
            </button>
          );
        })}
      </div>

      {/* Forgot PIN link - always visible */}
      <button
        onClick={() => {
          if (pinHint1) {
            setForgotStep('hint1');
          } else if (pinHint2) {
            setForgotStep('hint2');
          } else {
            setForgotStep('final');
          }
        }}
        className="mt-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <HelpCircle className="h-4 w-4" />
        {t('pin.forgotPin')}
      </button>
    </div>
  );
}
