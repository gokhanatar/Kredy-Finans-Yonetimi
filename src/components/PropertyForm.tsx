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
import { Plus, Home, Building2, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Property,
  PropertyType,
  LocationType,
  PROPERTY_TYPE_LABELS,
  LOCATION_LABELS,
} from '@/types/assetTypes';
import { calculate2026PropertyValue, formatAssetCurrency } from '@/lib/assetTaxUtils';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';
import { TURKISH_CITIES } from '@/data/turkishCities';

interface PropertyFormProps {
  onSubmit: (property: Omit<Property, 'id' | 'currentValue' | 'createdAt'>) => void;
  initialData?: Property;
  trigger?: React.ReactNode;
}

export function PropertyForm({ onSubmit, initialData, trigger }: PropertyFormProps) {
  const { t } = useTranslation(['assets', 'common']);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    type: PropertyType;
    location: LocationType;
    valuePreviousYear: number;
    sqMeters: number | undefined;
    city: string | undefined;
    district: string | undefined;
    isRented: boolean;
    annualRentIncome: number | undefined;
    rentalDayOfMonth: number | undefined;
    contractStartDate: string | undefined;
    contractEndDate: string | undefined;
    monthlyRentAmount: number | undefined;
    isRetired: boolean;
    isSingleProperty: boolean;
    hasOtherIncome: boolean;
  }>({
    name: initialData?.name || '',
    type: initialData?.type || 'konut',
    location: initialData?.location || 'buyuksehir',
    valuePreviousYear: initialData?.valuePreviousYear || 0,
    sqMeters: initialData?.sqMeters || undefined,
    city: initialData?.city || undefined,
    district: initialData?.district || undefined,
    isRented: initialData?.isRented || false,
    annualRentIncome: initialData?.annualRentIncome || undefined,
    rentalDayOfMonth: initialData?.rentalDayOfMonth || undefined,
    contractStartDate: initialData?.contractStartDate || undefined,
    contractEndDate: initialData?.contractEndDate || undefined,
    monthlyRentAmount: initialData?.monthlyRentAmount || undefined,
    isRetired: initialData?.isRetired || false,
    isSingleProperty: initialData?.isSingleProperty ?? true,
    hasOtherIncome: initialData?.hasOtherIncome || false,
  });

  // Separate display states for Turkish-formatted number inputs
  const [monthlyRentDisplay, setMonthlyRentDisplay] = useState<string>(
    initialData?.monthlyRentAmount ? formatNumber(initialData.monthlyRentAmount) : ''
  );
  const [annualRentDisplay, setAnnualRentDisplay] = useState<string>(
    initialData?.annualRentIncome ? formatNumber(initialData.annualRentIncome) : ''
  );

  const calculated2026Value = calculate2026PropertyValue(formData.valuePreviousYear);

  const handleCityChange = (cityName: string) => {
    const selectedCity = TURKISH_CITIES.find(c => c.name === cityName);
    setFormData(prev => ({
      ...prev,
      city: cityName,
      location: selectedCity?.isBuyuksehir ? 'buyuksehir' : 'diger',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast({ title: t('assets:propertyForm.validation.nameRequired'), variant: 'destructive' });
      return;
    }
    if (formData.valuePreviousYear <= 0) {
      toast({ title: t('assets:propertyForm.validation.valueRequired'), variant: 'destructive' });
      return;
    }
    if (formData.isRented && !formData.monthlyRentAmount) {
      toast({ title: t('assets:propertyForm.validation.rentAmountRequired'), variant: 'destructive' });
      return;
    }

    onSubmit({
      ...formData,
      sqMeters: formData.sqMeters || undefined,
      city: formData.city || undefined,
      district: formData.district || undefined,
      annualRentIncome: formData.isRented ? formData.annualRentIncome : undefined,
      rentalDayOfMonth: formData.isRented ? formData.rentalDayOfMonth : undefined,
      contractStartDate: formData.isRented ? formData.contractStartDate : undefined,
      contractEndDate: formData.isRented ? formData.contractEndDate : undefined,
      monthlyRentAmount: formData.isRented ? formData.monthlyRentAmount : undefined,
    });
    setOpen(false);
    // Reset form
    setFormData({
      name: '',
      type: 'konut',
      location: 'buyuksehir',
      valuePreviousYear: 0,
      sqMeters: undefined,
      city: undefined,
      district: undefined,
      isRented: false,
      annualRentIncome: undefined,
      rentalDayOfMonth: undefined,
      contractStartDate: undefined,
      contractEndDate: undefined,
      monthlyRentAmount: undefined,
      isRetired: false,
      isSingleProperty: true,
      hasOtherIncome: false,
    });
    setMonthlyRentDisplay('');
    setAnnualRentDisplay('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t('assets:propertyForm.addButton')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            {initialData ? t('assets:propertyForm.editTitle') : t('assets:propertyForm.newTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Isim */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('assets:propertyForm.name')}</Label>
            <Input
              id="name"
              placeholder={t('assets:propertyForm.namePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Tur ve Konum */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('assets:propertyForm.type')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value: PropertyType) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('assets:propertyForm.location')}</Label>
              <Select
                value={formData.location}
                onValueChange={(value: LocationType) => setFormData(prev => ({ ...prev, location: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOCATION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Il ve Ilce */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('assets:propertyForm.city', 'Il')}</Label>
              <Select
                value={formData.city || ''}
                onValueChange={handleCityChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('assets:propertyForm.cityPlaceholder', 'Il seciniz')} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TURKISH_CITIES.map((city) => (
                    <SelectItem key={city.code} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">{t('assets:propertyForm.district', 'Ilce')}</Label>
              <Input
                id="district"
                placeholder={t('assets:propertyForm.districtPlaceholder', 'Ilce (opsiyonel)')}
                value={formData.district || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value || undefined }))}
              />
            </div>
          </div>

          {/* 2025 Vergi Degeri */}
          <div className="space-y-2">
            <Label htmlFor="value2025">{t('assets:propertyForm.taxValue2025')}</Label>
            <Input
              id="value2025"
              type="text"
              inputMode="decimal"
              placeholder="1.000.000"
              value={formData.valuePreviousYear ? formatNumber(formData.valuePreviousYear) : ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                valuePreviousYear: parseTurkishNumber(e.target.value)
              }))}
              required
            />
            {formData.valuePreviousYear > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('assets:propertyForm.ceilingValue2026', { value: formatAssetCurrency(calculated2026Value) })}
                <span className="text-orange-500 ml-1">{t('assets:propertyForm.ceilingMax')}</span>
              </p>
            )}
          </div>

          {/* Metrekare */}
          <div className="space-y-2">
            <Label htmlFor="sqMeters">{t('assets:propertyForm.sqMeters')}</Label>
            <Input
              id="sqMeters"
              type="number"
              placeholder="120"
              value={formData.sqMeters || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                sqMeters: parseInt(e.target.value) || undefined
              }))}
            />
          </div>

          {/* Kira Durumu */}
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="isRented">{t('assets:propertyForm.isRented')}</Label>
              <Switch
                id="isRented"
                checked={formData.isRented}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRented: checked }))}
              />
            </div>

            {formData.isRented && (
              <div className="space-y-3">
                {/* Aylik Kira Tutari */}
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">{t('assets:propertyForm.monthlyRentAmount', 'Aylik Kira Tutari')}</Label>
                  <Input
                    id="monthlyRent"
                    type="text"
                    inputMode="decimal"
                    placeholder="6.000"
                    value={monthlyRentDisplay}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
                      setMonthlyRentDisplay(cleaned);
                    }}
                    onBlur={() => {
                      if (monthlyRentDisplay) {
                        const parsed = parseTurkishNumber(monthlyRentDisplay);
                        if (parsed > 0) {
                          setMonthlyRentDisplay(formatNumber(parsed));
                          const annual = parsed * 12;
                          setAnnualRentDisplay(formatNumber(annual));
                          setFormData(prev => ({ ...prev, monthlyRentAmount: parsed, annualRentIncome: annual }));
                        }
                      } else {
                        setFormData(prev => ({ ...prev, monthlyRentAmount: undefined }));
                      }
                    }}
                  />
                </div>

                {/* Yillik Kira Geliri */}
                <div className="space-y-2">
                  <Label htmlFor="rentIncome">{t('assets:propertyForm.annualRent')}</Label>
                  <Input
                    id="rentIncome"
                    type="text"
                    inputMode="decimal"
                    placeholder="72.000"
                    value={annualRentDisplay}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
                      setAnnualRentDisplay(cleaned);
                    }}
                    onBlur={() => {
                      if (annualRentDisplay) {
                        const parsed = parseTurkishNumber(annualRentDisplay);
                        if (parsed > 0) {
                          setAnnualRentDisplay(formatNumber(parsed));
                          setFormData(prev => ({ ...prev, annualRentIncome: parsed }));
                        }
                      } else {
                        setFormData(prev => ({ ...prev, annualRentIncome: undefined }));
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('assets:propertyForm.rentExemption')}
                  </p>
                </div>

                {/* Kira Gunu */}
                <div className="space-y-2">
                  <Label>{t('assets:propertyForm.rentalDayOfMonth', 'Kira Odeme Gunu')}</Label>
                  <Select
                    value={formData.rentalDayOfMonth?.toString() || ''}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      rentalDayOfMonth: parseInt(value) || undefined,
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('assets:propertyForm.rentalDayPlaceholder', 'Gun seciniz')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sozlesme Tarihleri */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="contractStart">{t('assets:propertyForm.contractStartDate', 'Sozlesme Baslangic')}</Label>
                    <Input
                      id="contractStart"
                      type="date"
                      value={formData.contractStartDate || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contractStartDate: e.target.value || undefined,
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractEnd">{t('assets:propertyForm.contractEndDate', 'Sozlesme Bitis')}</Label>
                    <Input
                      id="contractEnd"
                      type="date"
                      value={formData.contractEndDate || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contractEndDate: e.target.value || undefined,
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Muafiyet Kontrolleri */}
          {formData.type === 'konut' && (
            <div className="rounded-lg border p-3 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">{t('assets:propertyForm.exemptionChecks')}</p>

              <div className="flex items-center justify-between">
                <Label htmlFor="isRetired" className="text-sm">{t('assets:propertyForm.isRetired')}</Label>
                <Switch
                  id="isRetired"
                  checked={formData.isRetired}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRetired: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isSingle" className="text-sm">{t('assets:propertyForm.isSingleProperty')}</Label>
                <Switch
                  id="isSingle"
                  checked={formData.isSingleProperty}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isSingleProperty: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="hasOther" className="text-sm">{t('assets:propertyForm.hasOtherIncome')}</Label>
                <Switch
                  id="hasOther"
                  checked={formData.hasOtherIncome}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasOtherIncome: checked }))}
                />
              </div>

              {formData.isRetired && formData.isSingleProperty && !formData.hasOtherIncome && (
                <p className="text-xs text-green-600">
                  {t('assets:propertyForm.exemptionEligible')}
                </p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full">
            {initialData ? t('common:actions.update') : t('common:actions.add')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
