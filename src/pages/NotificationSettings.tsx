import { ArrowLeft, Bell, BellRing, Calendar, Clock, Receipt, Building2, Home, Car, CreditCard as CardIcon, Sparkles, FileText, Target, Repeat, TrendingUp, Wallet, ToggleLeft, ToggleRight, Wrench, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePushNotifications, NOTIFICATION_TOGGLE_KEYS } from '@/hooks/usePushNotifications';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CreditCard } from '@/types/finance';
import { toast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { calculateNextPropertyTaxDate, calculateNextMTVDate } from '@/lib/assetTaxUtils';

export default function NotificationSettings() {
  const { t } = useTranslation(['notifications', 'common']);
  const navigate = useNavigate();
  const [cards] = useLocalStorage<CreditCard[]>('kredi-pusula-cards', [] as CreditCard[]);
  const {
    settings,
    updateSettings,
    permissionGranted,
    requestPermissions,
    calculateNextKDVDate,
    calculateNextQuarterlyTaxDate,
  } = usePushNotifications(cards);

  const nextKDVDate = calculateNextKDVDate();
  const nextQuarterlyDate = calculateNextQuarterlyTaxDate();
  const daysUntilKDV = differenceInDays(nextKDVDate, new Date());
  const daysUntilQuarterly = differenceInDays(nextQuarterlyDate, new Date());
  const nextPropertyTax = calculateNextPropertyTaxDate();
  const nextMTV = calculateNextMTVDate();

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    toast({
      title: granted ? t('permission.active') : t('permission.denied'),
      description: granted
        ? t('permission.enabled')
        : t('permission.notGranted'),
      variant: granted ? 'default' : 'destructive',
    });
  };

  const handleEnableAll = () => {
    const allOn: Record<string, boolean> = { enabled: true };
    NOTIFICATION_TOGGLE_KEYS.forEach((key) => { allOn[key] = true; });
    updateSettings(allOn);
    toast({ title: t('master.allEnabled') });
  };

  const handleDisableAll = () => {
    const allOff: Record<string, boolean> = { enabled: false };
    NOTIFICATION_TOGGLE_KEYS.forEach((key) => { allOff[key] = false; });
    updateSettings(allOff);
    toast({ title: t('master.allDisabled') });
  };

  const NotifToggle = ({
    id,
    label,
    description,
    settingKey,
    icon,
    iconColor = 'text-primary',
    iconBg = 'bg-primary/10',
  }: {
    id: string;
    label: string;
    description: string;
    settingKey: keyof typeof settings;
    icon: React.ReactNode;
    iconColor?: string;
    iconBg?: string;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="min-w-0">
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      <Switch
        id={id}
        checked={!!settings[settingKey]}
        onCheckedChange={(checked) => updateSettings({ [settingKey]: checked })}
        disabled={!settings.enabled}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-safe-nav">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Permission Banner */}
        {!permissionGranted && (
          <div className="rounded-xl bg-warning/10 border border-warning/20 p-4">
            <div className="flex items-start gap-3">
              <BellRing className="h-5 w-5 text-warning mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{t('permission.required')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('permission.description')}
                </p>
                <Button onClick={handleRequestPermissions} className="mt-3" size="sm">
                  {t('permission.grant')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Master Toggle + Enable/Disable All */}
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="notifications-enabled" className="text-base font-medium">
                  {t('master.enable')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('master.description')}
                </p>
              </div>
            </div>
            <Switch
              id="notifications-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSettings({ enabled: checked })}
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={handleEnableAll}
            >
              <ToggleRight className="h-3.5 w-3.5" />
              {t('master.enableAll')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={handleDisableAll}
            >
              <ToggleLeft className="h-3.5 w-3.5" />
              {t('master.disableAll')}
            </Button>
          </div>
        </div>

        {/* Kredi Kartı Bildirimleri */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">
            {t('creditCard.title')}
          </h3>
          <div className="rounded-xl bg-card p-4 shadow-soft divide-y divide-border">
            <NotifToggle
              id="payment-reminder"
              label={t('creditCard.paymentReminder')}
              description={t('creditCard.paymentReminderDesc')}
              settingKey="paymentReminder"
              icon={<CardIcon className="h-4 w-4" />}
              iconColor="text-red-500"
              iconBg="bg-red-500/10"
            />
            <NotifToggle
              id="golden-window"
              label={t('creditCard.goldenWindow')}
              description={t('creditCard.goldenWindowDesc')}
              settingKey="goldenWindowAlert"
              icon={<Sparkles className="h-4 w-4" />}
              iconColor="text-amber-500"
              iconBg="bg-amber-500/10"
            />
            <NotifToggle
              id="statement-reminder"
              label={t('creditCard.statementReminder')}
              description={t('creditCard.statementReminderDesc')}
              settingKey="statementReminder"
              icon={<FileText className="h-4 w-4" />}
              iconColor="text-sky-500"
              iconBg="bg-sky-500/10"
            />
            <NotifToggle
              id="overdue-reminder"
              label={t('creditCard.overdueReminder')}
              description={t('creditCard.overdueReminderDesc')}
              settingKey="overdueReminder"
              icon={<BellRing className="h-4 w-4" />}
              iconColor="text-red-600"
              iconBg="bg-red-600/10"
            />
          </div>
        </div>

        {/* Gecikme Alt Ayarları */}
        {settings.overdueReminder && settings.enabled && (
          <div className="rounded-xl bg-card p-4 shadow-soft space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('overdueDetails.title')}</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('overdueDetails.frequency')}</p>
                <p className="text-xs text-muted-foreground">{t('overdueDetails.frequencyDesc')}</p>
              </div>
              <Select
                value={settings.overdueNotificationFrequency}
                onValueChange={(value: 'daily' | 'every_3_days' | 'weekly') =>
                  updateSettings({ overdueNotificationFrequency: value })
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('overdueDetails.daily')}</SelectItem>
                  <SelectItem value="every_3_days">{t('overdueDetails.every3Days')}</SelectItem>
                  <SelectItem value="weekly">{t('overdueDetails.weekly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('overdueDetails.time')}</p>
                <p className="text-xs text-muted-foreground">{t('overdueDetails.timeDesc')}</p>
              </div>
              <Select
                value={`${settings.overdueNotificationTime.hour}:${settings.overdueNotificationTime.minute.toString().padStart(2, '0')}`}
                onValueChange={(value) => {
                  const [hour, minute] = value.split(':').map(Number);
                  updateSettings({ overdueNotificationTime: { hour, minute } });
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8:00">08:00</SelectItem>
                  <SelectItem value="9:00">09:00</SelectItem>
                  <SelectItem value="10:00">10:00</SelectItem>
                  <SelectItem value="12:00">12:00</SelectItem>
                  <SelectItem value="18:00">18:00</SelectItem>
                  <SelectItem value="20:00">20:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Kredi Bildirimleri */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">
            {t('loanSection.title')}
          </h3>
          <div className="rounded-xl bg-card p-4 shadow-soft divide-y divide-border">
            <NotifToggle
              id="loan-reminder"
              label={t('loanSection.paymentReminder')}
              description={t('loanSection.paymentReminderDesc')}
              settingKey="loanPaymentReminder"
              icon={<Building2 className="h-4 w-4" />}
              iconColor="text-blue-500"
              iconBg="bg-blue-500/10"
            />
          </div>
        </div>

        {/* Kredi Alt Ayarları */}
        {settings.loanPaymentReminder && settings.enabled && (
          <div className="rounded-xl bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('loanSection.daysBefore')}</p>
                <p className="text-xs text-muted-foreground">{t('loanSection.daysBeforeDesc')}</p>
              </div>
              <Select
                value={settings.loanReminderDays.toString()}
                onValueChange={(value) => updateSettings({ loanReminderDays: parseInt(value) })}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 {t('common:time.days')}</SelectItem>
                  <SelectItem value="3">3 {t('common:time.days')}</SelectItem>
                  <SelectItem value="5">5 {t('common:time.days')}</SelectItem>
                  <SelectItem value="7">7 {t('common:time.days')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Vergi Bildirimleri */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">
            {t('taxSection.title')}
          </h3>
          <div className="rounded-xl bg-card p-4 shadow-soft divide-y divide-border">
            <NotifToggle
              id="tax-reminder"
              label={t('taxSection.kdvReport')}
              description={`${t('taxSection.next')}: ${format(nextKDVDate, 'd MMMM', { locale: tr })} (${daysUntilKDV} ${t('common:time.days')})`}
              settingKey="taxReminder"
              icon={<Receipt className="h-4 w-4" />}
              iconColor="text-orange-500"
              iconBg="bg-orange-500/10"
            />
            <NotifToggle
              id="quarterly-tax"
              label={t('taxSection.quarterlyTax')}
              description={`${t('taxSection.next')}: ${format(nextQuarterlyDate, 'd MMMM yyyy', { locale: tr })} (${daysUntilQuarterly} ${t('common:time.days')})`}
              settingKey="quarterlyTaxReminder"
              icon={<Building2 className="h-4 w-4" />}
              iconColor="text-purple-500"
              iconBg="bg-purple-500/10"
            />
            <NotifToggle
              id="property-tax"
              label={`${t('taxSection.propertyTax')} ${nextPropertyTax.installment}. ${t('taxSection.installment')}`}
              description={`${t('taxSection.deadline')}: ${format(nextPropertyTax.date, 'd MMMM', { locale: tr })} (${nextPropertyTax.daysRemaining} ${t('common:time.days')})`}
              settingKey="propertyTaxReminder"
              icon={<Home className="h-4 w-4" />}
              iconColor="text-green-500"
              iconBg="bg-green-500/10"
            />
            <NotifToggle
              id="mtv-reminder"
              label={`${t('taxSection.mtv')} ${nextMTV.installment}. ${t('taxSection.installment')}`}
              description={`${t('taxSection.deadline')}: ${format(nextMTV.date, 'd MMMM', { locale: tr })} (${nextMTV.daysRemaining} ${t('common:time.days')})`}
              settingKey="mtvReminder"
              icon={<Car className="h-4 w-4" />}
              iconColor="text-emerald-500"
              iconBg="bg-emerald-500/10"
            />
          </div>
        </div>

        {/* Vergi Hatırlatma Zamanı */}
        {(settings.taxReminder || settings.propertyTaxReminder || settings.mtvReminder) && settings.enabled && (
          <div className="rounded-xl bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('taxSection.reminderDays')}</p>
                <p className="text-xs text-muted-foreground">{t('taxSection.reminderDaysDesc')}</p>
              </div>
              <Select
                value={settings.kdvReminderDays.toString()}
                onValueChange={(value) => updateSettings({ kdvReminderDays: parseInt(value) })}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 {t('common:time.days')}</SelectItem>
                  <SelectItem value="5">5 {t('common:time.days')}</SelectItem>
                  <SelectItem value="7">7 {t('common:time.days')}</SelectItem>
                  <SelectItem value="10">10 {t('common:time.days')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Aile Finansı Bildirimleri */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">
            {t('familySection.title')}
          </h3>
          <div className="rounded-xl bg-card p-4 shadow-soft divide-y divide-border">
            <NotifToggle
              id="family-activity"
              label={t('familySection.activityNotification')}
              description={t('familySection.activityNotificationDesc')}
              settingKey="familyActivityNotification"
              icon={<Users className="h-4 w-4" />}
              iconColor="text-blue-500"
              iconBg="bg-blue-500/10"
            />
            <NotifToggle
              id="budget-alert"
              label={t('familySection.budgetAlert')}
              description={t('familySection.budgetAlertDesc')}
              settingKey="budgetAlert"
              icon={<Wallet className="h-4 w-4" />}
              iconColor="text-violet-500"
              iconBg="bg-violet-500/10"
            />
            <NotifToggle
              id="goal-reminder"
              label={t('familySection.goalReminder')}
              description={t('familySection.goalReminderDesc')}
              settingKey="goalReminder"
              icon={<Target className="h-4 w-4" />}
              iconColor="text-pink-500"
              iconBg="bg-pink-500/10"
            />
            <NotifToggle
              id="recurring-expense"
              label={t('familySection.recurringExpense')}
              description={t('familySection.recurringExpenseDesc')}
              settingKey="recurringExpenseReminder"
              icon={<Repeat className="h-4 w-4" />}
              iconColor="text-teal-500"
              iconBg="bg-teal-500/10"
            />
            <NotifToggle
              id="subscription-renewal"
              label={t('familySection.subscriptionRenewal')}
              description={t('familySection.subscriptionRenewalDesc')}
              settingKey="subscriptionRenewalReminder"
              icon={<Calendar className="h-4 w-4" />}
              iconColor="text-indigo-500"
              iconBg="bg-indigo-500/10"
            />
          </div>
        </div>

        {/* Yatırım Bildirimleri */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">
            {t('investmentSection.title')}
          </h3>
          <div className="rounded-xl bg-card p-4 shadow-soft divide-y divide-border">
            <NotifToggle
              id="investment-price"
              label={t('investmentSection.priceAlert')}
              description={t('investmentSection.priceAlertDesc')}
              settingKey="investmentPriceAlert"
              icon={<TrendingUp className="h-4 w-4" />}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-600/10"
            />
          </div>
        </div>

        {/* Araç & Gayrimenkul Hatırlatmaları */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">
            {t('assetSection.title')}
          </h3>
          <div className="rounded-xl bg-card p-4 shadow-soft divide-y divide-border">
            <NotifToggle
              id="vehicle-inspection-reminder"
              label={t('assetSection.vehicleInspection')}
              description={t('assetSection.vehicleInspectionDesc')}
              settingKey="vehicleInspectionReminder"
              icon={<Wrench className="h-4 w-4" />}
              iconColor="text-orange-600"
              iconBg="bg-orange-600/10"
            />
            <NotifToggle
              id="rent-due-reminder"
              label={t('assetSection.rentDue')}
              description={t('assetSection.rentDueDesc')}
              settingKey="rentDueReminder"
              icon={<Home className="h-4 w-4" />}
              iconColor="text-cyan-500"
              iconBg="bg-cyan-500/10"
            />
            <NotifToggle
              id="contract-renewal-reminder"
              label={t('assetSection.contractRenewal')}
              description={t('assetSection.contractRenewalDesc')}
              settingKey="contractRenewalReminder"
              icon={<FileText className="h-4 w-4" />}
              iconColor="text-rose-500"
              iconBg="bg-rose-500/10"
            />
            <NotifToggle
              id="recurring-bill-reminder"
              label={t('assetSection.recurringBill')}
              description={t('assetSection.recurringBillDesc')}
              settingKey="recurringBillReminder"
              icon={<FileText className="h-4 w-4" />}
              iconColor="text-amber-600"
              iconBg="bg-amber-600/10"
            />
          </div>
        </div>

        {/* Zamanlama */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">
            {t('timing.title')}
          </h3>
          <div className="rounded-xl bg-card p-4 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">{t('timing.daysBefore')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('timing.daysBeforeDesc')}
                  </p>
                </div>
              </div>
              <Select
                value={settings.reminderDaysBefore.toString()}
                onValueChange={(value) => updateSettings({ reminderDaysBefore: parseInt(value) })}
                disabled={!settings.enabled}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 {t('common:time.days')}</SelectItem>
                  <SelectItem value="2">2 {t('common:time.days')}</SelectItem>
                  <SelectItem value="3">3 {t('common:time.days')}</SelectItem>
                  <SelectItem value="5">5 {t('common:time.days')}</SelectItem>
                  <SelectItem value="7">7 {t('common:time.days')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">{t('timing.notificationTime')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('timing.notificationTimeDesc')}
                  </p>
                </div>
              </div>
              <Select
                value={`${settings.reminderTime.hour}:${settings.reminderTime.minute.toString().padStart(2, '0')}`}
                onValueChange={(value) => {
                  const [hour, minute] = value.split(':').map(Number);
                  updateSettings({ reminderTime: { hour, minute } });
                }}
                disabled={!settings.enabled}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8:00">08:00</SelectItem>
                  <SelectItem value="9:00">09:00</SelectItem>
                  <SelectItem value="10:00">10:00</SelectItem>
                  <SelectItem value="12:00">12:00</SelectItem>
                  <SelectItem value="18:00">18:00</SelectItem>
                  <SelectItem value="20:00">20:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground px-4">
          {t('webNote')}
        </p>
      </div>
    </div>
  );
}
