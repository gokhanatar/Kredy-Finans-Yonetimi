// Kullanıcı Profil Hook'u

import { useLocalStorage } from './useLocalStorage';
import { UserProfile, DEFAULT_USER_PROFILE } from '@/types/user';
import { useCallback } from 'react';

export function useUserProfile() {
  const [profile, setProfile] = useLocalStorage<UserProfile>(
    'kredi-pusula-user-profile',
    DEFAULT_USER_PROFILE
  );

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, [setProfile]);

  const resetProfile = useCallback(() => {
    setProfile(DEFAULT_USER_PROFILE);
  }, [setProfile]);

  const exportData = useCallback(() => {
    const data = {
      profile,
      cards: localStorage.getItem('kredi-pusula-cards'),
      loans: localStorage.getItem('kredi-pusula-loans'),
      purchases: localStorage.getItem('kredi-pusula-purchases'),
      assets: localStorage.getItem('kredi-pusula-assets'),
      notificationSettings: localStorage.getItem('kredi-pusula-notification-settings'),
      investments: localStorage.getItem('kredi-pusula-investments'),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kredi-pusula-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [profile]);

  const clearAllData = useCallback(() => {
    // Kullanıcının girdiği TÜM verileri sil.
    // SİLİNMEYENLER: Pro/abonelik durumu, trial bilgileri, PIN kilidi, auto-sync ayarı
    const keysToRemove = [
      'kredi-pusula-cards',
      'kredi-pusula-family-cards',
      'kredi-pusula-card-installments',
      'kredi-pusula-loans',
      'kredi-pusula-loan-payments',
      'kredi-pusula-purchases',
      'kredi-pusula-assets',
      'kredi-pusula-properties',
      'kredi-pusula-vehicles',
      'kredi-pusula-businesses',
      'kredi-pusula-notification-settings',
      'kredi-pusula-user-profile',
      'kredi-pusula-onboarding-completed',
      // Family finance keys
      'kredi-pusula-accounts',
      'kredi-pusula-family-transactions',
      'kredi-pusula-subscriptions',
      'kredi-pusula-personal-subscriptions',
      'kredi-pusula-recurring-expenses',
      'kredi-pusula-budgets',
      'kredi-pusula-goals',
      'kredi-pusula-shared-wallets',
      'kredi-pusula-networth-history',
      'kredi-pusula-privacy-mode',
      'kredi-pusula-currency-rates',
      'kredi-pusula-category-limits',
      // Investment keys
      'kredi-pusula-investments',
      'kredi-pusula-investment-prices',
      // Transaction history
      'kredi-pusula-transaction-history',
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    setProfile(DEFAULT_USER_PROFILE);
  }, [setProfile]);

  return {
    profile,
    updateProfile,
    resetProfile,
    exportData,
    clearAllData,
  };
}
