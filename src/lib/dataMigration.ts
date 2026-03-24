/**
 * Data Migration v2: Kişisel & Aile Finansı Ayrımı
 *
 * Mevcut verileri personal scope'a kopyalar.
 * Eski key'lerdeki veriler korunur (aile key'leri olarak devam eder).
 */

const MIGRATION_FLAG = 'kredi-pusula-migration-v2-done';

// Eski key → yeni personal key eşleştirmesi
const MIGRATION_MAP: Record<string, string> = {
  'kredi-pusula-family-transactions': 'kredi-pusula-personal-transactions',
  'kredi-pusula-budgets': 'kredi-pusula-personal-budgets',
  'kredi-pusula-goals': 'kredi-pusula-personal-goals',
  'kredi-pusula-recurring-incomes': 'kredi-pusula-personal-recurring-incomes',
  'kredi-pusula-recurring-expenses': 'kredi-pusula-personal-recurring-expenses',
  'kredi-pusula-subscriptions': 'kredi-pusula-personal-subscriptions',
  'kredi-pusula-accounts': 'kredi-pusula-personal-accounts',
  'kredi-pusula-shared-wallets': 'kredi-pusula-personal-shared-wallets',
  'kredi-pusula-networth-history': 'kredi-pusula-personal-networth-history',
};

export function runDataMigrationV2(): void {
  try {
    // Zaten migration yapılmışsa atla
    if (localStorage.getItem(MIGRATION_FLAG)) return;

    for (const [oldKey, newPersonalKey] of Object.entries(MIGRATION_MAP)) {
      const existingData = localStorage.getItem(oldKey);
      const personalData = localStorage.getItem(newPersonalKey);

      // Sadece personal key boşsa ve eski key'de veri varsa kopyala
      if (existingData && !personalData) {
        localStorage.setItem(newPersonalKey, existingData);
      }
    }

    // Migration tamamlandı
    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
  } catch (err) {
    console.warn('[Migration] v2 migration failed:', err);
  }
}
