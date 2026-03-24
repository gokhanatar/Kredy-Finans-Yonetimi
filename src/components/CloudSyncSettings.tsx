import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, Upload, Download, RefreshCw, LogOut, LogIn, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { useCloudAuth } from '@/contexts/CloudAuthContext';

export function CloudSyncSettings() {
  const { t } = useTranslation(['settings', 'common']);
  const {
    user,
    loading,
    syncing,
    lastBackup,
    error,
    autoSyncEnabled,
    loginWithGoogle,
    loginWithApple,
    loginWithEmail,
    registerEmail,
    logout,
    backup,
    restore,
    setAutoSyncEnabled,
  } = useCloudAuth();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!emailInput.trim() || !passwordInput.trim()) return;
    setAuthLoading(true);
    try {
      if (isRegister) {
        await registerEmail(emailInput.trim(), passwordInput);
      } else {
        await loginWithEmail(emailInput.trim(), passwordInput);
      }
      toast({ title: t('cloud.signedIn'), description: t('cloud.signedInDesc') });
      setShowEmailForm(false);
      setEmailInput('');
      setPasswordInput('');
    } catch {
      toast({ title: t('cloud.signInError'), variant: 'destructive' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await loginWithGoogle();
      toast({ title: t('cloud.signedIn'), description: t('cloud.signedInDesc') });
    } catch {
      toast({ title: t('cloud.signInError'), variant: 'destructive' });
    }
  };

  const handleAppleAuth = async () => {
    try {
      await loginWithApple();
      toast({ title: t('cloud.signedIn'), description: t('cloud.signedInDesc') });
    } catch {
      toast({ title: t('cloud.signInError'), variant: 'destructive' });
    }
  };

  const handleBackup = async () => {
    try {
      await backup();
      toast({ title: t('cloud.backupDone'), description: t('cloud.backupDoneDesc') });
    } catch {
      toast({ title: t('cloud.backupError'), variant: 'destructive' });
    }
  };

  const handleRestore = async () => {
    try {
      const success = await restore();
      if (success) {
        toast({ title: t('cloud.restoreDone'), description: t('cloud.restoreDoneDesc') });
      } else {
        toast({ title: t('cloud.noBackup'), description: t('cloud.noBackupDesc'), variant: 'destructive' });
      }
    } catch {
      toast({ title: t('cloud.restoreError'), variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    await logout();
    toast({ title: t('cloud.signedOut'), description: t('cloud.signedOutDesc') });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cloud className="h-5 w-5 text-primary" />
          {t('cloud.title')}
          {user && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle className="h-3.5 w-3.5" />
              {t('cloud.signedIn')}
            </span>
          )}
        </CardTitle>
        <CardDescription>{t('cloud.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !user ? (
          /* Auth Section - Not Signed In */
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogleAuth}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {t('cloud.googleSignIn')}
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleAppleAuth}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              {t('cloud.appleSignIn')}
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowEmailForm(!showEmailForm)}
            >
              <Mail className="h-4 w-4" />
              {t('cloud.emailSignIn')}
            </Button>

            {showEmailForm && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="space-y-2">
                  <Label>{t('cloud.email')}</Label>
                  <Input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={t('cloud.emailPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('cloud.password')}</Label>
                  <Input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={t('cloud.passwordPlaceholder')}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleEmailAuth}
                  disabled={authLoading}
                >
                  {authLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isRegister ? t('cloud.register') : t('cloud.signIn')}
                </Button>
                <button
                  type="button"
                  className="w-full text-xs text-center text-primary underline"
                  onClick={() => setIsRegister(!isRegister)}
                >
                  {isRegister ? t('cloud.hasAccount') : t('cloud.noAccount')}
                </button>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">{t('cloud.privacyNote')}</p>
          </div>
        ) : (
          /* Signed In - Backup/Restore/Sync UI */
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName || user.email}</p>
                {user.displayName && user.email && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Sync Status */}
            {syncing && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <RefreshCw className="h-4 w-4 animate-spin" />
                {t('cloud.syncing')}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Last Backup */}
            {lastBackup && (
              <div className="text-xs text-muted-foreground">
                {t('cloud.lastBackup')}: {formatDate(lastBackup)}
              </div>
            )}

            {/* Backup/Restore Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleBackup}
                disabled={syncing}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {t('cloud.backup')}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={syncing} className="gap-2">
                    <Download className="h-4 w-4" />
                    {t('cloud.restore')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('cloud.restore')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('cloud.restoreDoneDesc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestore}>
                      {t('cloud.restore')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <Separator />

            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{t('cloud.autoSync')}</Label>
                <p className="text-xs text-muted-foreground">{t('cloud.autoSyncDesc')}</p>
              </div>
              <Switch
                checked={autoSyncEnabled}
                onCheckedChange={setAutoSyncEnabled}
              />
            </div>

            <p className="text-xs text-muted-foreground">{t('cloud.syncNote')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
