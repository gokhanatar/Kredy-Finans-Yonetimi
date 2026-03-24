import { FamilyTransaction } from '@/types/familyFinance';

// ============= TİPLER =============

export interface BudgetSuggestionItem {
  category: string;
  suggestedAmount: number;
  averageSpend: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface SavingsSuggestion {
  monthlyIncome: number;
  totalExpenses: number;
  suggestedSavings: number;
  savingsPercent: number;
  tips: string[];
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
 * Son N ay için ay anahtarlarını oluşturur (en eski -> en yeni sıralı).
 * Mevcut ayı dahil etmez (tamamlanmamış olabilir).
 */
function getCompletedMonthKeys(months: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = months; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    keys.push(`${year}-${month}`);
  }
  return keys;
}

// ============= ANA FONKSİYONLAR =============

/**
 * Son N aydaki harcama verilerine dayanarak kategori bazlı bütçe önerisi sunar.
 *
 * Algoritma:
 * - Her kategori için son N ay ortalamasını hesaplar
 * - Ortalamaya %10 güvenlik payı ekler (suggestedAmount = average × 1.1)
 * - Güven skoru: 3 ay veri varsa "high", 2 ay "medium", 1 ay "low"
 *
 * @param transactions - Tüm işlemler
 * @param months - Değerlendirilecek ay sayısı (varsayılan: 3)
 * @returns Kategori bazlı bütçe önerileri
 */
export function suggestBudget(
  transactions: FamilyTransaction[],
  months: number = 3
): BudgetSuggestionItem[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  if (expenses.length === 0) return [];

  const completedMonths = getCompletedMonthKeys(months);

  // Kategori × ay matrisini oluştur
  const categoryMonthly: Record<string, Record<string, number>> = {};

  for (const t of expenses) {
    const monthKey = getMonthKey(t.date);
    // Sadece değerlendirme aralığındaki ayları al
    if (!completedMonths.includes(monthKey)) continue;

    if (!categoryMonthly[t.category]) categoryMonthly[t.category] = {};
    if (!categoryMonthly[t.category][monthKey]) categoryMonthly[t.category][monthKey] = 0;
    categoryMonthly[t.category][monthKey] += t.amount;
  }

  const suggestions: BudgetSuggestionItem[] = [];

  for (const [category, monthlyData] of Object.entries(categoryMonthly)) {
    const monthsWithData = Object.keys(monthlyData);
    const monthCount = monthsWithData.length;

    if (monthCount === 0) continue;

    const totalSpend = Object.values(monthlyData).reduce((sum, v) => sum + v, 0);
    const averageSpend = totalSpend / monthCount;

    // %10 güvenlik payı
    const SAFETY_MARGIN = 1.1;
    const suggestedAmount = Math.ceil(averageSpend * SAFETY_MARGIN);

    // Güven skoru: veri miktarına göre
    let confidence: BudgetSuggestionItem['confidence'] = 'low';
    if (monthCount >= 3) {
      confidence = 'high';
    } else if (monthCount >= 2) {
      confidence = 'medium';
    }

    suggestions.push({
      category,
      suggestedAmount,
      averageSpend: Math.round(averageSpend * 100) / 100,
      confidence,
    });
  }

  // En yüksek önerilen bütçeden en düşüğe sırala
  return suggestions.sort((a, b) => b.suggestedAmount - a.suggestedAmount);
}

/**
 * 50/30/20 kuralına dayalı tasarruf önerisi sunar.
 *
 * 50/30/20 Kuralı:
 * - %50 ihtiyaçlar (kira, fatura, market, ulaşım)
 * - %30 istekler (eğlence, giyim, yemek dışarıda)
 * - %20 tasarruf ve borç ödeme
 *
 * @param income - Aylık gelir
 * @param expenses - Aylık toplam gider
 * @returns Tasarruf önerisi ve ipuçları
 */
export function suggestSavings(
  income: number,
  expenses: number
): SavingsSuggestion {
  const tips: string[] = [];

  // Negatif veya sıfır gelir kontrolü
  if (income <= 0) {
    return {
      monthlyIncome: income,
      totalExpenses: expenses,
      suggestedSavings: 0,
      savingsPercent: 0,
      tips: ['Gelir bilgisi girilmemiş. Doğru öneri için aylık gelirinizi girin.'],
    };
  }

  const expenseRatio = (expenses / income) * 100;
  const currentSavings = income - expenses;
  const currentSavingsPercent = (currentSavings / income) * 100;

  // 50/30/20 kuralına göre ideal tasarruf
  const idealSavings = income * 0.20;
  const idealNeedsMax = income * 0.50;
  const idealWantsMax = income * 0.30;

  // Önerilen tasarruf: ideal ile mevcut arasında
  let suggestedSavings: number;
  let savingsPercent: number;

  if (currentSavings >= idealSavings) {
    // Zaten ideal tasarrufun üzerinde
    suggestedSavings = idealSavings;
    savingsPercent = 20;
    tips.push('Harika! 50/30/20 kuralına uygun tasarruf yapıyorsunuz.');

    if (currentSavingsPercent > 30) {
      tips.push(
        `Gelirinizin %${currentSavingsPercent.toFixed(0)}'ini biriktiriyorsunuz. Yatırım seçeneklerini değerlendirebilirsiniz.`
      );
    }
  } else if (currentSavings > 0) {
    // Tasarruf var ama idealin altında
    suggestedSavings = idealSavings;
    savingsPercent = 20;

    const gap = idealSavings - currentSavings;
    tips.push(
      `Şu anda gelirinizin %${currentSavingsPercent.toFixed(0)}'ini biriktiriyorsunuz. Hedefiniz %20 olmalı.`
    );
    tips.push(
      `Aylık ${gap.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL daha biriktirmeniz gerekiyor.`
    );
  } else {
    // Harcamalar geliri aşıyor
    suggestedSavings = idealSavings;
    savingsPercent = 20;

    tips.push(
      `Harcamalarınız gelirinizi ${Math.abs(currentSavings).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL aşıyor. Bütçeni gözden geçir.`
    );
  }

  // 50/30/20 bazlı ipuçları
  if (expenses > idealNeedsMax + idealWantsMax) {
    tips.push(
      `50/30/20 kuralına göre harcamalarınız en fazla ${(idealNeedsMax + idealWantsMax).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL olmalı.`
    );
  }

  // Harcama oranına göre ek ipuçları
  if (expenseRatio > 90) {
    tips.push('Sabit giderlerinizi gözden geçirin. Abonelikler, gereksiz faturalar iptal edilebilir.');
    tips.push('Acil durum fonu oluşturmak için en az 3 aylık gideriniz kadar birikim hedefleyin.');
  } else if (expenseRatio > 80) {
    tips.push('İhtiyaç ve istek harcamalarınızı ayırmayı deneyin. İsteklerden kısarak tasarrufu artırabilirsiniz.');
  } else if (expenseRatio > 50) {
    tips.push(
      `Harcamalarınız gelirinizin %${expenseRatio.toFixed(0)}'i. İdeal aralıkta olmaya yakınsınız.`
    );
  }

  // Genel tasarruf ipuçları
  if (tips.length < 3) {
    tips.push('Otomatik tasarruf: Maaş günü tasarruf hesabına otomatik transfer ayarlayın.');
  }

  return {
    monthlyIncome: income,
    totalExpenses: expenses,
    suggestedSavings: Math.round(suggestedSavings),
    savingsPercent,
    tips,
  };
}
