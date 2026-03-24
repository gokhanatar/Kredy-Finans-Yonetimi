import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Car, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Vehicle, 
  VehicleType,
  VEHICLE_TYPE_LABELS,
  VEHICLE_TAX_CONSTANTS,
} from '@/types/assetTypes';
import { formatAssetCurrency, formatAssetDate } from '@/lib/assetTaxUtils';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';
import { isAfter } from 'date-fns';

interface VehicleFormProps {
  onSubmit: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => void;
  initialData?: Vehicle;
  trigger?: React.ReactNode;
}

export function VehicleForm({ onSubmit, initialData, trigger }: VehicleFormProps) {
  const { t } = useTranslation(['assets', 'common']);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    plate: initialData?.plate || '',
    registrationDate: initialData?.registrationDate 
      ? new Date(initialData.registrationDate).toISOString().split('T')[0] 
      : '',
    isPost2018: initialData?.isPost2018 ?? true,
    engineCC: initialData?.engineCC || 0,
    purchaseValue: initialData?.purchaseValue || undefined,
    lastInspectionDate: initialData?.lastInspectionDate 
      ? new Date(initialData.lastInspectionDate).toISOString().split('T')[0] 
      : '',
    vehicleType: initialData?.vehicleType || 'otomobil' as VehicleType,
    isDisabledExempt: initialData?.isDisabledExempt || false,
    disabledExemptDate: initialData?.disabledExemptDate 
      ? new Date(initialData.disabledExemptDate).toISOString().split('T')[0] 
      : '',
  });

  const isPost2025 = formData.disabledExemptDate 
    ? isAfter(new Date(formData.disabledExemptDate), VEHICLE_TAX_CONSTANTS.DISABLED_VEHICLE.BAN_START_DATE)
    : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast({ title: t('assets:vehicleForm.validation.nameRequired'), variant: 'destructive' });
      return;
    }
    if (!formData.plate.trim()) {
      toast({ title: t('assets:vehicleForm.validation.plateRequired'), variant: 'destructive' });
      return;
    }
    if (!formData.registrationDate) {
      toast({ title: t('assets:vehicleForm.validation.registrationRequired'), variant: 'destructive' });
      return;
    }
    if (formData.engineCC <= 0) {
      toast({ title: t('assets:vehicleForm.validation.engineRequired'), variant: 'destructive' });
      return;
    }

    onSubmit({
      name: formData.name,
      plate: formData.plate.toUpperCase(),
      registrationDate: new Date(formData.registrationDate),
      isPost2018: formData.isPost2018,
      engineCC: formData.engineCC,
      purchaseValue: formData.purchaseValue,
      lastInspectionDate: formData.lastInspectionDate 
        ? new Date(formData.lastInspectionDate) 
        : undefined,
      vehicleType: formData.vehicleType,
      isDisabledExempt: formData.isDisabledExempt,
      disabledExemptDate: formData.isDisabledExempt && formData.disabledExemptDate 
        ? new Date(formData.disabledExemptDate) 
        : undefined,
    });
    setOpen(false);
    // Reset form
    setFormData({
      name: '',
      plate: '',
      registrationDate: '',
      isPost2018: true,
      engineCC: 0,
      purchaseValue: undefined,
      lastInspectionDate: '',
      vehicleType: 'otomobil',
      isDisabledExempt: false,
      disabledExemptDate: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t('assets:vehicleForm.addButton')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {initialData ? t('assets:vehicleForm.editTitle') : t('assets:vehicleForm.newTitle')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* İsim ve Plaka */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">{t('assets:vehicleForm.name')}</Label>
              <Input
                id="name"
                placeholder="Audi A4"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="plate">{t('assets:vehicleForm.plate')}</Label>
              <Input
                id="plate"
                placeholder="34 ABC 123"
                value={formData.plate}
                onChange={(e) => setFormData(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                required
              />
            </div>
          </div>
          
          {/* Araç Türü */}
          <div className="space-y-2">
            <Label>{t('assets:vehicleForm.vehicleType')}</Label>
            <Select
              value={formData.vehicleType}
              onValueChange={(value: VehicleType) => setFormData(prev => ({ ...prev, vehicleType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Tescil Tarihi */}
          <div className="space-y-2">
            <Label htmlFor="regDate">{t('assets:vehicleForm.registrationDate')}</Label>
            <Input
              id="regDate"
              type="date"
              value={formData.registrationDate}
              onChange={(e) => {
                const date = new Date(e.target.value);
                const isPost2018 = date.getFullYear() >= 2018;
                setFormData(prev => ({ 
                  ...prev, 
                  registrationDate: e.target.value,
                  isPost2018,
                }));
              }}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.isPost2018
                ? t('assets:vehicleForm.post2018')
                : t('assets:vehicleForm.pre2018')}
            </p>
          </div>
          
          {/* Motor Hacmi */}
          <div className="space-y-2">
            <Label htmlFor="engineCC">{t('assets:vehicleForm.engineCC')}</Label>
            <Input
              id="engineCC"
              type="number"
              placeholder="1600"
              value={formData.engineCC || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                engineCC: parseInt(e.target.value) || 0 
              }))}
              required
            />
          </div>
          
          {/* Alış Değeri (2018 sonrası için) */}
          {formData.isPost2018 && (
            <div className="space-y-2">
              <Label htmlFor="purchaseValue">{t('assets:vehicleForm.purchaseValue')}</Label>
              <Input
                id="purchaseValue"
                type="text"
                inputMode="decimal"
                placeholder="500.000"
                value={formData.purchaseValue ? formatNumber(formData.purchaseValue) : ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  purchaseValue: parseTurkishNumber(e.target.value) || undefined
                }))}
              />
            </div>
          )}
          
          {/* Son Muayene Tarihi */}
          <div className="space-y-2">
            <Label htmlFor="inspectionDate">{t('assets:vehicleForm.inspectionDate')}</Label>
            <Input
              id="inspectionDate"
              type="date"
              value={formData.lastInspectionDate}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                lastInspectionDate: e.target.value 
              }))}
            />
          </div>
          
          {/* Engelli Muafiyeti */}
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="disabled">{t('assets:vehicleForm.disabledExemption')}</Label>
              <Switch
                id="disabled"
                checked={formData.isDisabledExempt}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  isDisabledExempt: checked 
                }))}
              />
            </div>
            
            {formData.isDisabledExempt && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="disabledDate">{t('assets:vehicleForm.exemptionDate')}</Label>
                  <Input
                    id="disabledDate"
                    type="date"
                    value={formData.disabledExemptDate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      disabledExemptDate: e.target.value 
                    }))}
                    required={formData.isDisabledExempt}
                  />
                </div>
                
                {isPost2025 && (
                  <div className="flex items-start gap-2 p-2 rounded-md bg-orange-500/10 border border-orange-500/20">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-orange-600">{t('assets:vehicleForm.saleRestriction')}</p>
                      <p className="text-muted-foreground">
                        {t('assets:vehicleForm.saleRestrictionDesc')}
                        {' '}{t('assets:vehicleForm.otvExemptLimit', { value: formatAssetCurrency(VEHICLE_TAX_CONSTANTS.DISABLED_VEHICLE.OTV_EXEMPT_LIMIT) })}
                      </p>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {t('assets:vehicleForm.domesticRate', { rate: VEHICLE_TAX_CONSTANTS.DISABLED_VEHICLE.DOMESTIC_CONTENT_RATE })}
                </p>
              </>
            )}
          </div>
          
          <Button type="submit" className="w-full">
            {initialData ? t('common:actions.update') : t('common:actions.add')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
