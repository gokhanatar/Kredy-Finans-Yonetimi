import { FamilyTransaction } from '@/types/familyFinance';

// ============= TİPLER =============

export interface SpendingTrend {
  category: string;
  currentMonth: number;
  previousMonth: number;
  changePercent: number;
  direction: 'up' | 'down' | 'stable' | 'new';
}

export interface SpendingAnomaly {
  transaction: FamilyTransaction;
  reason: string;
  severity: 'info' | 'warning' | 'alert';
}

export interface MonthlyComparison {
  month: string; // YYYY-MM format
  total: number;
  categories: Record<string, number>;
}

export interface SpendingInsight {
  type: 'increase' | 'decrease' | 'anomaly' | 'tip';
  category?: string;
  message: string;
  value?: number;
  changePercent?: number;
}

// ============= YARDIMCI FONKSİYONLAR =============

/**
 * İşlemin ay anahtarını döndürür (YYYY-MM formatında)
 */
function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Son N ay için ay anahtarlarını oluşturur (en eski -> en yeni sıralı)
 */
function getLastNMonthKeys(months: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(getMonthKey(d.toISOString()));
  }
  return keys;
}

/**
 * Sadece gider (expense) işlemlerini filtreler
 */
function filterExpenses(transactions: FamilyTransaction[]): FamilyTransaction[] {
  return transactions.filter((t) => t.type === 'expense');
}

/**
 * İşlemleri ay ve kategoriye göre gruplar
 * Döndürülen yapı: { "YYYY-MM": { "category": totalAmount } }
 */
function groupByMonthAndCategory(
  transactions: FamilyTransaction[]
): Record<string, Record<string, number>> {
  const grouped: Record<string, Record<string, number>> = {};

  for (const t of transactions) {
    const monthKey = getMonthKey(t.date);
    if (!grouped[monthKey]) grouped[monthKey] = {};
    if (!grouped[monthKey][t.category]) grouped[monthKey][t.category] = 0;
    grouped[monthKey][t.category] += t.amount;
  }

  return grouped;
}

/**
 * İşlemleri kategoriye göre gruplar
 * Döndürülen yapı: { "category": FamilyTransaction[] }
 */
function groupByCategory(
  transactions: FamilyTransaction[]
): Record<string, FamilyTransaction[]> {
  const grouped: Record<string, FamilyTransaction[]> = {};

  for (const t of transactions) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }

  return grouped;
}

/**
 * Standart sapma hesaplar
 */
function calculateStdDev(values: number[]): { mean: number; stdDev: number } {
  if (values.length <= 1) return { mean: values[0] || 0, stdDev: 0 };

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  // Bessel's correction: divide by (n - 1) for sample std dev
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1);
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}

// ============= ANA FONKSİYONLAR =============

/**
 * Kategori bazında harcama trendlerini analiz eder.
 * Son N ay (varsayılan 3) karşılaştırması yapar.
 *
 * @param transactions - Tüm işlemler
 * @param months - Karşılaştırılacak ay sayısı (varsayılan: 3)
 * @returns Kategori bazlı harcama trendleri
 */
export function analyzeSpendingTrends(
  transactions: FamilyTransaction[],
  months: number = 3
): SpendingTrend[] {
  const expenses = filterExpenses(transactions);
  if (expenses.length === 0) return [];

  const grouped = groupByMonthAndCategory(expenses);
  const monthKeys = getLastNMonthKeys(months);

  // En az 2 ay gerekli
  if (monthKeys.length < 2) return [];

  const currentMonthKey = monthKeys[monthKeys.length - 1];
  const previousMonthKey = monthKeys[monthKeys.length - 2];

  const currentData = grouped[currentMonthKey] || {};
  const previousData = grouped[previousMonthKey] || {};

  // Tüm kategorileri birleştir
  const allCategories = new Set([
    ...Object.keys(currentData),
    ...Object.keys(previousData),
  ]);

  const trends: SpendingTrend[] = [];

  for (const category of allCategories) {
    const currentMonth = currentData[category] || 0;
    const previousMonth = previousData[category] || 0;

    let changePercent = 0;
    let direction: SpendingTrend['direction'] = 'stable';

    if (previousMonth > 0) {
      changePercent = ((currentMonth - previousMonth) / previousMonth) * 100;
    } else if (currentMonth > 0) {
      // Önceki ayda harcama yok, bu ayda var → yeni kategori, %0 artış
      changePercent = 0;
      direction = 'new';
    }

    if (changePercent > 5) {
      direction = 'up';
    } else if (changePercent < -5) {
      direction = 'down';
    }

    trends.push({
      category,
      currentMonth,
      previousMonth,
      changePercent: Math.round(changePercent * 100) / 100,
      direction,
    });
  }

  // En büyük değişimden en küçüğe sırala
  return trends.sort(
    (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
  );
}

/**
 * Kategori ortalamasından 2 standart sapmadan fazla sapan
 * işlemleri tespit eder.
 *
 * @param transactions - Tüm işlemler
 * @returns Anomali tespit edilen işlemler
 */
export function detectAnomalies(
  transactions: FamilyTransaction[]
): SpendingAnomaly[] {
  const expenses = filterExpenses(transactions);
  if (expenses.length === 0) return [];

  const byCategory = groupByCategory(expenses);
  const anomalies: SpendingAnomaly[] = [];

  for (const [category, categoryTransactions] of Object.entries(byCategory)) {
    // Kategori başına en az 3 işlem gerekli (anlamlı istatistik için)
    if (categoryTransactions.length < 3) continue;

    const amounts = categoryTransactions.map((t) => t.amount);
    const { mean, stdDev } = calculateStdDev(amounts);

    // stdDev sıfır ise (tüm tutarlar aynı) anomali yok
    if (stdDev === 0) continue;

    for (const t of categoryTransactions) {
      const zScore = (t.amount - mean) / stdDev;

      if (Math.abs(zScore) > 2) {
        let severity: SpendingAnomaly['severity'] = 'info';
        let reason = '';

        if (zScore > 3) {
          severity = 'alert';
          reason = `Bu işlem (${t.amount.toLocaleString('tr-TR')} TL) ${category} kategorisindeki ortalamanın (${mean.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL) çok üzerinde.`;
        } else if (zScore > 2) {
          severity = 'warning';
          reason = `Bu işlem (${t.amount.toLocaleString('tr-TR')} TL) ${category} kategorisindeki ortalamadan belirgin şekilde yüksek.`;
        } else if (zScore < -2) {
          severity = 'info';
          reason = `Bu işlem (${t.amount.toLocaleString('tr-TR')} TL) ${category} kategorisindeki ortalamadan düşük.`;
        }

        anomalies.push({ transaction: t, reason, severity });
      }
    }
  }

  // Önem derecesine göre sırala: alert > warning > info
  const severityOrder: Record<string, number> = { alert: 0, warning: 1, info: 2 };
  return anomalies.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

/**
 * Aylık harcama toplamlarını kategori bazında karşılaştırır.
 *
 * @param transactions - Tüm işlemler
 * @param months - Gösterilecek ay sayısı (varsayılan: 6)
 * @returns Aylık karşılaştırma verileri (eski -> yeni sıralı)
 */
export function getMonthlyComparison(
  transactions: FamilyTransaction[],
  months: number = 6
): MonthlyComparison[] {
  const expenses = filterExpenses(transactions);
  if (expenses.length === 0) return [];

  const grouped = groupByMonthAndCategory(expenses);
  const monthKeys = getLastNMonthKeys(months);

  const comparisons: MonthlyComparison[] = [];

  for (const monthKey of monthKeys) {
    const categories = grouped[monthKey] || {};
    const total = Object.values(categories).reduce((sum, v) => sum + v, 0);

    comparisons.push({
      month: monthKey,
      total,
      categories: { ...categories },
    });
  }

  return comparisons;
}

/**
 * İşlem verilerinden okunabilir harcama analizleri ve ipuçları üretir.
 * - %20'den fazla artış: uyarı
 * - %20'den fazla azalış: tebrik
 * - Genel tasarruf ipuçları
 *
 * @param transactions - Tüm işlemler
 * @returns Harcama analizleri listesi
 */
export function generateInsights(
  transactions: FamilyTransaction[]
): SpendingInsight[] {
  const insights: SpendingInsight[] = [];
  const expenses = filterExpenses(transactions);
  if (expenses.length === 0) return insights;

  // 1. Trend bazlı analizler
  const trends = analyzeSpendingTrends(transactions, 3);

  for (const trend of trends) {
    if (trend.direction === 'up' && trend.changePercent > 20) {
      insights.push({
        type: 'increase',
        category: trend.category,
        message: `${trend.category} kategorisinde harcamalar geçen aya göre %${Math.abs(trend.changePercent).toFixed(0)} arttı.`,
        value: trend.currentMonth,
        changePercent: trend.changePercent,
      });
    } else if (trend.direction === 'down' && trend.changePercent < -20) {
      insights.push({
        type: 'decrease',
        category: trend.category,
        message: `${trend.category} kategorisinde harcamalar %${Math.abs(trend.changePercent).toFixed(0)} azaldı. Tasarruf ediyorsunuz!`,
        value: trend.currentMonth,
        changePercent: trend.changePercent,
      });
    }
  }

  // 2. Anomali bazlı analizler
  const anomalies = detectAnomalies(transactions);

  for (const anomaly of anomalies) {
    if (anomaly.severity === 'alert' || anomaly.severity === 'warning') {
      insights.push({
        type: 'anomaly',
        category: anomaly.transaction.category,
        message: anomaly.reason,
        value: anomaly.transaction.amount,
      });
    }
  }

  // 3. Genel ipuçları
  const monthlyComparisons = getMonthlyComparison(transactions, 3);
  const recentMonths = monthlyComparisons.filter((m) => m.total > 0);

  if (recentMonths.length >= 2) {
    const avgMonthly =
      recentMonths.reduce((sum, m) => sum + m.total, 0) / recentMonths.length;
    const lastMonth = recentMonths[recentMonths.length - 1];

    if (lastMonth.total > avgMonthly * 1.3) {
      insights.push({
        type: 'tip',
        message: `Bu ay toplam harcamanız (${lastMonth.total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL) son 3 aylık ortalamanın %30 üzerinde. Bütçenizi gözden geçirmenizi öneririz.`,
        value: lastMonth.total,
      });
    }

    // En yüksek harcama kategorisi ipucu
    if (lastMonth.categories && Object.keys(lastMonth.categories).length > 0) {
      const topCategory = Object.entries(lastMonth.categories).sort(
        ([, a], [, b]) => b - a
      )[0];

      if (topCategory) {
        const [catName, catAmount] = topCategory;
        const categoryPercent = (catAmount / lastMonth.total) * 100;

        if (categoryPercent > 40) {
          insights.push({
            type: 'tip',
            category: catName,
            message: `Harcamalarınızın %${categoryPercent.toFixed(0)}'i ${catName} kategorisinde. Bu kategoriyi çeşitlendirmek bütçe sağlığınızı iyileştirebilir.`,
            value: catAmount,
            changePercent: categoryPercent,
          });
        }
      }
    }
  }

  // 4. Düzenli küçük harcama ipucu
  const grouped = groupByCategory(expenses);
  for (const [category, categoryTransactions] of Object.entries(grouped)) {
    // Son 30 gündeki küçük ama sık harcamalar
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSmall = categoryTransactions.filter((t) => {
      const d = new Date(t.date);
      return d >= thirtyDaysAgo && t.amount < 100;
    });

    if (recentSmall.length >= 10) {
      const totalSmall = recentSmall.reduce((sum, t) => sum + t.amount, 0);
      insights.push({
        type: 'tip',
        category,
        message: `${category} kategorisinde son 30 günde ${recentSmall.length} küçük harcama yaptınız (toplam ${totalSmall.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL). Küçük harcamalar birikebilir!`,
        value: totalSmall,
      });
    }
  }

  return insights;
}
