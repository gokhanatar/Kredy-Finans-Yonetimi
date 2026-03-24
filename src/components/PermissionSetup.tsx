import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Bell, Camera, ChevronRight, Check, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PermissionSetupProps {
  onComplete: () => void;
}

type PermissionStep = 'notification' | 'camera' | 'done';

const isNativePlatform = typeof window !== 'undefined' &&
  (window as any).Capacitor?.isNativePlatform?.() === true;

export function PermissionSetup({ onComplete }: PermissionSetupProps) {
  const { t } = useTranslation(['onboarding', 'common']);
  const [step, setStep] = useState<PermissionStep>('notification');
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);

  const handleNotificationPermission = async () => {
    try {
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        setNotificationGranted(result === 'granted');
      }
      // On Capacitor, use native push notification plugin if available
      if (isNativePlatform) {
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          const result = await LocalNotifications.requestPermissions();
          setNotificationGranted(result.display === 'granted');
        } catch {
          // Plugin not available
        }
      }
    } catch {
      // Permission API not available
    }
    // Move to camera step on native, otherwise finish
    if (isNativePlatform) {
      setStep('camera');
    } else {
      setStep('done');
    }
  };

  const handleCameraPermission = async () => {
    try {
      if (isNativePlatform) {
        try {
          const { Camera: CameraPlugin } = await import('@capacitor/camera');
          const result = await CameraPlugin.requestPermissions({ permissions: ['camera'] });
          setCameraGranted(result.camera === 'granted');
        } catch {
          // Plugin not available
        }
      } else {
        // Web fallback
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setCameraGranted(true);
      }
    } catch {
      // Permission denied or not available
    }
    setStep('done');
  };

  const handleSkipNotification = () => {
    if (isNativePlatform) {
      setStep('camera');
    } else {
      setStep('done');
    }
  };

  const handleSkipCamera = () => {
    setStep('done');
  };

  const handleDone = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div className="flex items-center justify-center p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
          <Shield className="h-8 w-8 text-white" />
        </div>
      </div>

      <div className="px-8 text-center">
        <h1 className="text-xl font-bold text-foreground">{t('permissions.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('permissions.subtitle')}</p>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          {step === 'notification' && (
            <motion.div
              key="notification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex w-full max-w-sm flex-col items-center text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-warning to-amber-500 shadow-lg">
                <Bell className="h-10 w-10 text-white" />
              </div>
              <h2 className="mb-2 text-lg font-bold text-foreground">{t('permissions.notification.title')}</h2>
              <p className="mb-8 text-sm text-muted-foreground">{t('permissions.notification.description')}</p>
              <div className="flex w-full flex-col gap-3">
                <Button onClick={handleNotificationPermission} className="w-full py-5 text-base font-semibold" size="lg">
                  <Bell className="mr-2 h-5 w-5" />
                  {t('permissions.notification.allow')}
                </Button>
                <button onClick={handleSkipNotification} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('permissions.notification.skip')}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex w-full max-w-sm flex-col items-center text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
                <Camera className="h-10 w-10 text-white" />
              </div>
              <h2 className="mb-2 text-lg font-bold text-foreground">{t('permissions.camera.title')}</h2>
              <p className="mb-8 text-sm text-muted-foreground">{t('permissions.camera.description')}</p>
              <div className="flex w-full flex-col gap-3">
                <Button onClick={handleCameraPermission} className="w-full py-5 text-base font-semibold" size="lg">
                  <Camera className="mr-2 h-5 w-5" />
                  {t('permissions.camera.allow')}
                </Button>
                <button onClick={handleSkipCamera} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('permissions.camera.skip')}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex w-full max-w-sm flex-col items-center text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-success to-emerald-600 shadow-lg">
                <Check className="h-10 w-10 text-white" />
              </div>
              <h2 className="mb-2 text-lg font-bold text-foreground">{t('permissions.done')}</h2>

              <div className="mt-4 w-full space-y-2">
                <div className={cn(
                  'flex items-center gap-3 rounded-lg p-3',
                  notificationGranted ? 'bg-success/10' : 'bg-muted'
                )}>
                  <Bell className={cn('h-5 w-5', notificationGranted ? 'text-success' : 'text-muted-foreground')} />
                  <span className="text-sm">{t('permissions.notification.title')}</span>
                  {notificationGranted && <Check className="ml-auto h-4 w-4 text-success" />}
                </div>
                {isNativePlatform && (
                  <div className={cn(
                    'flex items-center gap-3 rounded-lg p-3',
                    cameraGranted ? 'bg-success/10' : 'bg-muted'
                  )}>
                    <Camera className={cn('h-5 w-5', cameraGranted ? 'text-success' : 'text-muted-foreground')} />
                    <span className="text-sm">{t('permissions.camera.title')}</span>
                    {cameraGranted && <Check className="ml-auto h-4 w-4 text-success" />}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom */}
      {step === 'done' && (
        <div className="p-8">
          <Button onClick={handleDone} className="w-full py-6 text-lg font-semibold" size="lg">
            {t('permissions.done')}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Step indicators */}
      <div className="mb-4 flex justify-center gap-2">
        <div className={cn('h-2 w-8 rounded-full', step === 'notification' ? 'bg-primary' : 'bg-primary/30')} />
        {isNativePlatform && (
          <div className={cn('h-2 w-8 rounded-full', step === 'camera' ? 'bg-primary' : 'bg-primary/30')} />
        )}
        <div className={cn('h-2 w-8 rounded-full', step === 'done' ? 'bg-primary' : 'bg-primary/30')} />
      </div>
    </div>
  );
}
