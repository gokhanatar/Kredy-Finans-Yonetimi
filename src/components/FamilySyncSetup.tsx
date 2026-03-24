import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Copy, LogIn, LogOut, CheckCircle2, Wifi, WifiOff, UserPlus, Crown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { toast } from '@/hooks/use-toast';
import { useFamilySync, formatFamilyCode } from '@/contexts/FamilySyncContext';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { SubscriptionPaywall } from '@/components/SubscriptionPaywall';
import { cn } from '@/lib/utils';

export function FamilySyncSetup() {
  const { t } = useTranslation(['family', 'common']);
  const navigate = useNavigate();
  const { isPremium, isScreenshotMode } = useSubscriptionContext();
  const [showPaywall, setShowPaywall] = useState(false);
  const {
    familyId,
    members,
    memberName,
    isConnected,
    isConfigured,
    error,
    createFamily,
    joinFamily,
    leaveFamily,
    isInGracePeriod,
    gracePeriodDaysLeft,
  } = useFamilySync();

  const [mode, setMode] = useState<'idle' | 'create' | 'join'>('idle');
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const memberList = Object.entries(members);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: t('common:status.error'), description: t('sync.errorEmptyName'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const code = await createFamily(name.trim());
      toast({ title: t('sync.created'), description: t('sync.createdDesc', { code }) });
      setMode('idle');
      setName('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('sync.errorCreateFailed');
      toast({ title: t('common:status.error'), description: msg, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim() || !joinCode.trim()) {
      toast({ title: t('common:status.error'), description: t('sync.errorEmptyFields'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const success = await joinFamily(joinCode.trim(), name.trim(), isPremium);
      if (success) {
        toast({ title: t('sync.joined'), description: t('sync.joinedDesc') });
        setMode('idle');
        setName('');
        setJoinCode('');
      } else {
        toast({ title: t('common:status.error'), description: t('sync.errorNotFound'), variant: 'destructive' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('sync.errorConnectionFailed');
      toast({ title: t('common:status.error'), description: msg, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleLeave = async () => {
    setLoading(true);
    try {
      await leaveFamily();
      toast({ title: t('sync.left'), description: t('sync.leftDesc') });
    } catch {
      toast({ title: t('common:status.error'), description: t('sync.errorOperationFailed'), variant: 'destructive' });
    }
    setLoading(false);
  };

  const copyCode = () => {
    if (familyId) {
      navigator.clipboard.writeText(formatFamilyCode(familyId));
      toast({ title: t('sync.codeCopied'), description: t('sync.codeCopiedDesc') });
    }
  };

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            {t('sync.title')}
          </CardTitle>
          <CardDescription>
            {t('sync.firebaseRequired')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Connected state
  if (isConnected && familyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            {t('sync.title')}
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <Wifi className="h-3 w-3 text-success" />
            {t('sync.connected')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Grace Period Warning */}
          {isInGracePeriod && gracePeriodDaysLeft !== null && (
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <p className="text-sm font-semibold text-warning">Aile Grubu Süresi Doluyor</p>
                  <p className="text-xs text-muted-foreground">
                    Premium üyeliğiniz sona erdi. {gracePeriodDaysLeft} gün içinde aile grubunuz otomatik olarak dağılacak.
                  </p>
                  <Button size="sm" onClick={() => navigate('/subscription')} className="gap-1.5 mt-1">
                    <Crown className="h-3 w-3" /> PRO'ya Geç
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Family Code */}
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{t('sync.familyCode')}</p>
              <p className="text-base font-mono font-bold tracking-widest text-primary truncate">{formatFamilyCode(familyId)}</p>
            </div>
            <Button variant="outline" size="icon" onClick={copyCode} className="shrink-0">
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Members */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('sync.members')} ({memberList.length})</p>
            {memberList.map(([id, member]) => {
              const isOnline = Date.now() - member.lastSeen < 60000;
              const isMemberPremium = member.isPremium || member.role === 'organizer';
              return (
                <div key={id} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white',
                    isOnline ? 'bg-success' : 'bg-muted-foreground'
                  )}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium">{member.name}</p>
                      {isMemberPremium && (
                        <span className="flex items-center gap-0.5 rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-bold text-warning">
                          <Crown className="h-2.5 w-2.5" />
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isOnline ? t('sync.online') : t('sync.offline')}
                    </p>
                  </div>
                  {isOnline && <Wifi className="h-3 w-3 text-success" />}
                  {!isOnline && <WifiOff className="h-3 w-3 text-muted-foreground" />}
                </div>
              );
            })}
          </div>

          {/* Leave Button */}
          <Button
            variant="outline"
            className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleLeave}
            disabled={loading}
          >
            <LogOut className="h-4 w-4" />
            {t('sync.leave')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Disconnected state
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5 text-primary" />
          {t('sync.title')}
        </CardTitle>
        <CardDescription>
          {t('sync.disconnected')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {mode === 'idle' && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 relative"
              onClick={() => isPremium ? setMode('create') : setShowPaywall(true)}
            >
              {!isPremium && !isScreenshotMode && (
                <span className="absolute -right-1 -top-1 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-warning to-warning/80 px-1.5 py-0.5 text-[8px] font-bold text-white">
                  <Crown className="h-2 w-2" />
                  PRO
                </span>
              )}
              <UserPlus className="h-5 w-5 text-primary" />
              <span className="text-xs">{t('sync.createGroup')}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 relative"
              onClick={() => setMode('join')}
            >
              <LogIn className="h-5 w-5 text-primary" />
              <span className="text-xs">{t('sync.joinGroup')}</span>
              <span className="text-[9px] text-success font-medium">{t('sync.freeJoin', { defaultValue: 'Ücretsiz' })}</span>
            </Button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="create-name">{t('sync.yourName')}</Label>
              <Input
                id="create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('sync.namePlaceholderCreate')}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode('idle')} className="flex-1">
                {t('common:actions.cancel')}
              </Button>
              <Button onClick={handleCreate} disabled={loading} className="flex-1 gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t('common:actions.create')}
              </Button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="join-name">{t('sync.yourName')}</Label>
              <Input
                id="join-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('sync.namePlaceholderJoin')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="join-code">{t('sync.familyCode')}</Label>
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => {
                  const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  if (raw.length <= 12) {
                    const formatted = raw.match(/.{1,4}/g)?.join('-') || raw;
                    setJoinCode(formatted);
                  }
                }}
                placeholder={t('sync.codePlaceholder')}
                maxLength={14}
                className="font-mono tracking-widest text-center text-lg"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode('idle')} className="flex-1">
                {t('common:actions.cancel')}
              </Button>
              <Button onClick={handleJoin} disabled={loading} className="flex-1 gap-2">
                <LogIn className="h-4 w-4" />
                {t('sync.joinGroup')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Paywall Dialog */}
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>{t('common:subscription')}</DialogTitle>
          </VisuallyHidden>
          <SubscriptionPaywall
            onClose={() => setShowPaywall(false)}
            showCloseButton={true}
            context="family"
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
