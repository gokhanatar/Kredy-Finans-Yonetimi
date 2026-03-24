import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Home, 
  Car, 
  Receipt, 
  AlertTriangle, 
  Building2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { AssetNotification, useAssetTaxNotifications } from '@/hooks/useAssetTaxNotifications';
import { Property, Vehicle, Business } from '@/types/assetTypes';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaxCalendarProps {
  properties: Property[];
  vehicles: Vehicle[];
  businesses: Business[];
}

const NOTIFICATION_ICONS: Record<AssetNotification['type'], React.ReactNode> = {
  property_tax: <Home className="h-4 w-4" />,
  mtv: <Car className="h-4 w-4" />,
  inspection: <Car className="h-4 w-4" />,
  rental_income: <Receipt className="h-4 w-4" />,
  luxury_property: <Home className="h-4 w-4" />,
  sale_ban: <AlertTriangle className="h-4 w-4" />,
  annual_fee: <Building2 className="h-4 w-4" />,
};

const NOTIFICATION_COLORS: Record<AssetNotification['type'], string> = {
  property_tax: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  mtv: 'bg-green-500/10 text-green-600 border-green-500/20',
  inspection: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  rental_income: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  luxury_property: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  sale_ban: 'bg-red-500/10 text-red-600 border-red-500/20',
  annual_fee: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

const SEVERITY_STYLES: Record<AssetNotification['severity'], string> = {
  info: 'border-l-blue-500',
  warning: 'border-l-orange-500',
  danger: 'border-l-red-500',
};

export function TaxCalendar({ properties, vehicles, businesses }: TaxCalendarProps) {
  const { 
    allNotifications,
    calculateNextPropertyTaxDate,
    calculateNextMTVDate,
  } = useAssetTaxNotifications(properties, vehicles, businesses);

  // Sabit takvim tarihleri
  const fixedDates = useMemo(() => {
    const propertyTax = calculateNextPropertyTaxDate();
    const mtv = calculateNextMTVDate();
    
    return [
      {
        id: 'property-tax-fixed',
        label: `Emlak Vergisi ${propertyTax.installment}. Taksit`,
        date: propertyTax.date,
        daysRemaining: propertyTax.daysRemaining,
        type: 'property_tax' as const,
        icon: <Home className="h-4 w-4" />,
      },
      {
        id: 'mtv-fixed',
        label: `MTV ${mtv.installment}. Taksit`,
        date: mtv.date,
        daysRemaining: mtv.daysRemaining,
        type: 'mtv' as const,
        icon: <Car className="h-4 w-4" />,
      },
    ];
  }, [calculateNextPropertyTaxDate, calculateNextMTVDate]);

  const upcomingNotifications = allNotifications.filter(n => n.daysRemaining >= 0).slice(0, 10);
  const hasNoAssets = properties.length === 0 && vehicles.length === 0 && businesses.length === 0;

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Vergi Takvimi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sabit Tarihler */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Yaklaşan Son Tarihler</p>
          <div className="grid gap-2">
            {fixedDates.map((item) => (
              <div 
                key={item.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  NOTIFICATION_COLORS[item.type]
                )}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(item.date, 'd MMMM yyyy', { locale: tr })}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={item.daysRemaining <= 7 ? 'destructive' : item.daysRemaining <= 14 ? 'secondary' : 'outline'}
                >
                  {item.daysRemaining} gün
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Varlık Bazlı Bildirimler */}
        {upcomingNotifications.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Varlık Bildirimleri</p>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {upcomingNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 rounded-lg border-l-4 bg-card",
                      SEVERITY_STYLES[notification.severity]
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "p-1.5 rounded-md mt-0.5",
                          NOTIFICATION_COLORS[notification.type]
                        )}>
                          {NOTIFICATION_ICONS[notification.type]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {notification.message}
                          </p>
                          {notification.assetName && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📍 {notification.assetName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className={cn(
                          "text-xs font-medium",
                          notification.severity === 'danger' && "text-red-600",
                          notification.severity === 'warning' && "text-orange-600",
                        )}>
                          {notification.daysRemaining}g
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Boş Durum */}
        {hasNoAssets && (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Henüz varlık eklenmemiş</p>
            <p className="text-xs mt-1">Gayrimenkul veya araç ekleyerek vergi takibine başlayın</p>
          </div>
        )}

        {/* Bilgi */}
        <div className="text-xs text-center text-muted-foreground pt-2 border-t">
          Tarihler 2026 mevzuatına göre hesaplanmaktadır
        </div>
      </CardContent>
    </Card>
  );
}
