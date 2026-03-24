import { useCallback, useMemo } from 'react';
import { 
  Property, 
  Vehicle, 
  Business,
  ASSET_TAX_CONSTANTS,
  VEHICLE_TAX_CONSTANTS,
} from '@/types/assetTypes';
import {
  calculateNextPropertyTaxDate,
  calculateNextMTVDate,
  checkInspectionStatus,
  checkDisabledSaleRestriction,
  checkLuxuryPropertyTax,
  checkRentalDeclaration,
  checkAnnualFeeRequired,
} from '@/lib/assetTaxUtils';
import { differenceInDays, format } from 'date-fns';
import { tr } from 'date-fns/locale';

export interface AssetNotification {
  id: string;
  type: 'property_tax' | 'mtv' | 'inspection' | 'rental_income' | 'luxury_property' | 'sale_ban' | 'annual_fee';
  title: string;
  message: string;
  date: Date;
  daysRemaining: number;
  severity: 'info' | 'warning' | 'danger';
  assetId?: string;
  assetName?: string;
}

export function useAssetTaxNotifications(
  properties: Property[],
  vehicles: Vehicle[],
  businesses: Business[]
) {
  // Emlak vergisi bildirimleri
  const propertyTaxNotifications = useMemo((): AssetNotification[] => {
    if (properties.length === 0) return [];
    
    const nextTax = calculateNextPropertyTaxDate();
    const notifications: AssetNotification[] = [];
    
    // Genel emlak vergisi hatırlatması
    if (nextTax.daysRemaining <= 30) {
      notifications.push({
        id: `property-tax-${nextTax.installment}`,
        type: 'property_tax',
        title: `Emlak Vergisi ${nextTax.installment}. Taksit`,
        message: nextTax.isWithinPaymentPeriod 
          ? `Son ödeme tarihi ${format(nextTax.date, 'd MMMM', { locale: tr })} - ${nextTax.daysRemaining} gün kaldı`
          : `Ödeme dönemi ${format(nextTax.date, 'd MMMM', { locale: tr })}'a kadar`,
        date: nextTax.date,
        daysRemaining: nextTax.daysRemaining,
        severity: nextTax.daysRemaining <= 7 ? 'danger' : nextTax.daysRemaining <= 14 ? 'warning' : 'info',
      });
    }
    
    // Değerli konut vergisi kontrolü
    properties.forEach(property => {
      const luxuryCheck = checkLuxuryPropertyTax(property);
      if (luxuryCheck.isSubject) {
        const daysUntil = differenceInDays(luxuryCheck.declarationDate, new Date());
        if (daysUntil > 0 && daysUntil <= 30) {
          notifications.push({
            id: `luxury-${property.id}`,
            type: 'luxury_property',
            title: 'Değerli Konut Vergisi',
            message: `${property.name} için beyanname tarihi ${format(luxuryCheck.declarationDate, 'd MMMM', { locale: tr })}`,
            date: luxuryCheck.declarationDate,
            daysRemaining: daysUntil,
            severity: daysUntil <= 7 ? 'danger' : 'warning',
            assetId: property.id,
            assetName: property.name,
          });
        }
      }
    });
    
    return notifications;
  }, [properties]);
  
  // Kira geliri bildirimleri
  const rentalIncomeNotifications = useMemo((): AssetNotification[] => {
    const rentedProperties = properties.filter(p => p.isRented && p.annualRentIncome);
    if (rentedProperties.length === 0) return [];
    
    const notifications: AssetNotification[] = [];
    const currentYear = new Date().getFullYear();
    const declarationDeadline = new Date(currentYear, 2, 31); // 31 Mart
    const daysUntil = differenceInDays(declarationDeadline, new Date());
    
    // Mart ayında beyan dönemi
    if (daysUntil > 0 && daysUntil <= 45) {
      rentedProperties.forEach(property => {
        const declaration = checkRentalDeclaration(
          property.annualRentIncome || 0, 
          property.type as 'konut' | 'isyeri'
        );
        
        if (declaration.required) {
          notifications.push({
            id: `rental-${property.id}`,
            type: 'rental_income',
            title: 'Kira Geliri Beyanı',
            message: declaration.warning 
              ? `${property.name}: ${declaration.warning}` 
              : `${property.name} için kira beyanı son tarihi ${format(declarationDeadline, 'd MMMM', { locale: tr })}`,
            date: declarationDeadline,
            daysRemaining: daysUntil,
            severity: daysUntil <= 7 ? 'danger' : daysUntil <= 14 ? 'warning' : 'info',
            assetId: property.id,
            assetName: property.name,
          });
        }
      });
    }
    
    return notifications;
  }, [properties]);
  
  // MTV bildirimleri
  const mtvNotifications = useMemo((): AssetNotification[] => {
    if (vehicles.length === 0) return [];
    
    const nextMTV = calculateNextMTVDate();
    
    if (nextMTV.daysRemaining <= 14) {
      return [{
        id: `mtv-${nextMTV.installment}`,
        type: 'mtv',
        title: `MTV ${nextMTV.installment}. Taksit`,
        message: `Son ödeme tarihi ${format(nextMTV.date, 'd MMMM', { locale: tr })} - ${nextMTV.daysRemaining} gün kaldı`,
        date: nextMTV.date,
        daysRemaining: nextMTV.daysRemaining,
        severity: nextMTV.daysRemaining <= 3 ? 'danger' : nextMTV.daysRemaining <= 7 ? 'warning' : 'info',
      }];
    }
    
    return [];
  }, [vehicles]);
  
  // Muayene bildirimleri — kademeli hatırlatma takvimi
  const inspectionNotifications = useMemo((): AssetNotification[] => {
    const notifications: AssetNotification[] = [];

    vehicles.forEach(vehicle => {
      const status = checkInspectionStatus(vehicle);
      const days = status.daysRemaining;
      const vehicleLabel = `${vehicle.name}${vehicle.plate ? ' - ' + vehicle.plate : ''}`;

      if (status.isOverdue) {
        // Süresi geçmiş — acil
        const overdueDays = Math.abs(days);
        notifications.push({
          id: `inspection-overdue-${vehicle.id}`,
          type: 'inspection',
          title: 'Araç Muayenesi Gecikmiş',
          message: `Araç muayenesi ${overdueDays} gün gecikmiş — ${vehicleLabel}. Ceza almamak için randevu al.`,
          date: status.nextDate,
          daysRemaining: days,
          severity: 'danger',
          assetId: vehicle.id,
          assetName: vehicle.name,
        });
      } else if (days <= 1 && days >= 0) {
        // 1 gün kala — acil
        notifications.push({
          id: `inspection-urgent-${vehicle.id}`,
          type: 'inspection',
          title: 'Muayene Yarın',
          message: `${vehicleLabel} muayenesi yarın. Randevunu kontrol et.`,
          date: status.nextDate,
          daysRemaining: days,
          severity: 'danger',
          assetId: vehicle.id,
          assetName: vehicle.name,
        });
      } else if (days <= 7) {
        // 7 gün içinde — günlük hatırlatma, danger
        notifications.push({
          id: `inspection-daily-${vehicle.id}`,
          type: 'inspection',
          title: 'Araç Muayenesi Yaklaşıyor',
          message: `${vehicleLabel} muayenesine ${days} gün kaldı.`,
          date: status.nextDate,
          daysRemaining: days,
          severity: 'danger',
          assetId: vehicle.id,
          assetName: vehicle.name,
        });
      } else if (days <= 14) {
        // 14 gün içinde — haftalık hatırlatma, warning
        notifications.push({
          id: `inspection-weekly-${vehicle.id}`,
          type: 'inspection',
          title: 'Araç Muayenesi Yaklaşıyor',
          message: `${vehicleLabel} muayenesine ${days} gün kaldı.`,
          date: status.nextDate,
          daysRemaining: days,
          severity: 'warning',
          assetId: vehicle.id,
          assetName: vehicle.name,
        });
      } else if (days <= 21) {
        // 21 gün içinde — ikinci bildirim, info
        notifications.push({
          id: `inspection-second-${vehicle.id}`,
          type: 'inspection',
          title: 'Araç Muayenesi Hatırlatması',
          message: `${vehicleLabel} muayenesine ${days} gün kaldı.`,
          date: status.nextDate,
          daysRemaining: days,
          severity: 'info',
          assetId: vehicle.id,
          assetName: vehicle.name,
        });
      } else if (days <= 30) {
        // 30 gün içinde — ilk bildirim, info
        notifications.push({
          id: `inspection-first-${vehicle.id}`,
          type: 'inspection',
          title: 'Araç Muayenesi Bildirimi',
          message: `${vehicleLabel} muayenesine ${days} gün kaldı.`,
          date: status.nextDate,
          daysRemaining: days,
          severity: 'info',
          assetId: vehicle.id,
          assetName: vehicle.name,
        });
      }
    });

    return notifications;
  }, [vehicles]);
  
  // Engelli araç satış yasağı bildirimleri
  const saleBanNotifications = useMemo((): AssetNotification[] => {
    const notifications: AssetNotification[] = [];
    
    vehicles
      .filter(v => v.isDisabledExempt)
      .forEach(vehicle => {
        const restriction = checkDisabledSaleRestriction(vehicle);
        
        if (restriction.isBanned && restriction.penalty) {
          notifications.push({
            id: `sale-ban-${vehicle.id}`,
            type: 'sale_ban',
            title: 'Engelli Araç Satış Yasağı',
            message: restriction.penalty,
            date: restriction.banEndDate,
            daysRemaining: restriction.yearsRemaining * 365,
            severity: 'warning',
            assetId: vehicle.id,
            assetName: vehicle.name,
          });
        }
      });
    
    return notifications;
  }, [vehicles]);
  
  // İş yeri yıllık harç bildirimleri
  const annualFeeNotifications = useMemo((): AssetNotification[] => {
    const currentMonth = new Date().getMonth();
    
    // Sadece Ocak ayında göster
    if (currentMonth !== 0) return [];
    
    return businesses
      .filter(b => checkAnnualFeeRequired(b))
      .map(business => ({
        id: `annual-fee-${business.id}`,
        type: 'annual_fee' as const,
        title: 'Yıllık Harç Ödemesi',
        message: `${business.name} için yıllık ruhsat/yetki belgesi harcı`,
        date: new Date(new Date().getFullYear(), 0, 31),
        daysRemaining: differenceInDays(new Date(new Date().getFullYear(), 0, 31), new Date()),
        severity: 'warning' as const,
        assetId: business.id,
        assetName: business.name,
      }));
  }, [businesses]);
  
  // Tüm bildirimleri birleştir ve sırala
  const allNotifications = useMemo((): AssetNotification[] => {
    return [
      ...propertyTaxNotifications,
      ...rentalIncomeNotifications,
      ...mtvNotifications,
      ...inspectionNotifications,
      ...saleBanNotifications,
      ...annualFeeNotifications,
    ].sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [
    propertyTaxNotifications,
    rentalIncomeNotifications,
    mtvNotifications,
    inspectionNotifications,
    saleBanNotifications,
    annualFeeNotifications,
  ]);
  
  // Yaklaşan kritik bildirimleri getir
  const getUpcomingCritical = useCallback((days: number = 7): AssetNotification[] => {
    return allNotifications.filter(n => n.daysRemaining <= days && n.daysRemaining >= 0);
  }, [allNotifications]);
  
  return {
    allNotifications,
    propertyTaxNotifications,
    rentalIncomeNotifications,
    mtvNotifications,
    inspectionNotifications,
    saleBanNotifications,
    annualFeeNotifications,
    getUpcomingCritical,
    
    // Tarih hesaplama fonksiyonları
    calculateNextPropertyTaxDate,
    calculateNextMTVDate,
  };
}
