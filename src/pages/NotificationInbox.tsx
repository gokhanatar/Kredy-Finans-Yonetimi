import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trash2, BellOff, CheckCircle2, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CategoryIcon } from '@/components/ui/category-icon';
import { useNotificationInbox, type InboxNotification, type NotificationType } from '@/hooks/useNotificationInbox';
import { PaymentActionDrawer } from '@/components/PaymentActionDrawer';

const TYPE_ICON_MAP: Record<NotificationType, string> = {
  payment: 'credit-card',
  golden: 'sparkles',
  tax: 'calendar',
  inspection: 'car',
  rent: 'home',
  budget: 'bar-chart',
  goal: 'target',
  subscription: 'bell',
  overdue: 'clock',
  bill: 'file-text',
  family: 'users',
};

const SEVERITY_STYLES = {
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  danger: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/20',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Az once';
  if (diffMinutes < 60) return `${diffMinutes} dk once`;
  if (diffHours < 24) return `${diffHours} saat once`;
  if (diffDays < 7) return `${diffDays} gun once`;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function NotificationItem({
  notification,
  onMarkAsDone,
  onMarkAsRead,
  onDelete,
  onRecordPayment,
}: {
  notification: InboxNotification;
  onMarkAsDone: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onRecordPayment: (n: InboxNotification) => void;
}) {
  const severity = SEVERITY_STYLES[notification.severity];
  const iconName = TYPE_ICON_MAP[notification.type];

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl transition-all ${
        notification.isDone
          ? 'opacity-50'
          : notification.isRead
          ? 'bg-card'
          : 'bg-card ring-1 ring-primary/10'
      }`}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${severity.bg}`}>
        <CategoryIcon name={iconName} size={20} className={severity.text} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4
            className={`text-sm font-medium truncate ${
              notification.isDone ? 'line-through text-muted-foreground' : ''
            }`}
          >
            {notification.title}
          </h4>
          {!notification.isRead && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
        <p
          className={`text-xs text-muted-foreground ${
            notification.isDone ? 'line-through' : ''
          }`}
        >
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeDate(notification.createdAt)}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 h-4 border-0 ${severity.badge}`}
          >
            {notification.severity === 'info'
              ? 'Bilgi'
              : notification.severity === 'warning'
              ? 'Uyari'
              : 'Önemli'}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 shrink-0">
        {notification.assetType && !notification.isDone && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onRecordPayment(notification);
            }}
            title="Odeme Kaydet"
          >
            <Banknote className="h-4 w-4" />
          </Button>
        )}
        {!notification.isDone ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-green-500"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsDone(notification.id);
            }}
            title="Yapildi"
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          title="Sil"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <BellOff className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default function NotificationInbox() {
  const { t } = useTranslation(['notifications', 'common']);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { notifications, markAsRead, markAsDone, deleteNotification, clearAll, unreadCount } =
    useNotificationInbox();
  const [activeTab, setActiveTab] = useState('all');

  // Payment drawer state
  const [payingNotification, setPayingNotification] = useState<InboxNotification | null>(null);
  const [drawerAssetType, setDrawerAssetType] = useState<'card' | 'loan' | 'bill' | null>(null);
  const [drawerAssetId, setDrawerAssetId] = useState<string | null>(null);
  const drawerOpen = drawerAssetType !== null && drawerAssetId !== null;

  // Auto-open drawer from URL params (notification tap navigate)
  useEffect(() => {
    const paramType = searchParams.get('assetType') as 'card' | 'loan' | 'bill' | null;
    const paramId = searchParams.get('assetId');
    if (paramType && paramId) {
      setDrawerAssetType(paramType);
      setDrawerAssetId(paramId);
      // Clean URL params
      searchParams.delete('assetType');
      searchParams.delete('assetId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  function handleRecordPayment(n: InboxNotification) {
    if (!n.assetType || !n.assetId) return;
    setPayingNotification(n);
    setDrawerAssetType(n.assetType);
    setDrawerAssetId(n.assetId);
  }

  function handlePaymentComplete() {
    if (payingNotification) {
      markAsDone(payingNotification.id);
    }
    setPayingNotification(null);
    setDrawerAssetType(null);
    setDrawerAssetId(null);
  }

  function handleDrawerOpenChange(open: boolean) {
    if (!open) {
      setPayingNotification(null);
      setDrawerAssetType(null);
      setDrawerAssetId(null);
    }
  }

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.isRead);
      case 'todo':
        return notifications.filter((n) => !n.isDone);
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  return (
    <div className="min-h-screen bg-background pb-safe-nav">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Bildirim Kutusu</h1>
              {unreadCount > 0 && (
                <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Tum bildirimleriniz burada
            </p>
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive"
              onClick={clearAll}
            >
              Tumunu Temizle
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              Tumu
              {notifications.length > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  ({notifications.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Okunmamis
              {unreadCount > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  ({unreadCount})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="todo" className="flex-1">
              Yapilacaklar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {notifications.length === 0 ? (
              <EmptyState message="Henuz bildiriminiz yok" />
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsDone={markAsDone}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onRecordPayment={handleRecordPayment}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="mt-4">
            {filteredNotifications.length === 0 ? (
              <EmptyState message="Tum bildirimler okundu" />
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsDone={markAsDone}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onRecordPayment={handleRecordPayment}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="todo" className="mt-4">
            {filteredNotifications.length === 0 ? (
              <EmptyState message="Yapilacak bildirim yok" />
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsDone={markAsDone}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onRecordPayment={handleRecordPayment}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <PaymentActionDrawer
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
        assetType={drawerAssetType}
        assetId={drawerAssetId}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
}
