// ============= TİPLER =============

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // aylık faiz oranı (%)
  minimumPayment: number;
}

export interface StrategyResult {
  method: 'snowball' | 'avalanche';
  totalInterest: number;
  monthsToPayoff: number;
  monthlyPlan: MonthlyPayment[];
  payoffOrder: string[];
}

export interface MonthlyPayment {
  month: number;
  payments: { debtId: string; amount: number; remainingBalance: number }[];
  totalPaid: number;
}

export interface StrategyComparison {
  snowball: StrategyResult;
  avalanche: StrategyResult;
  interestDifference: number;
  timeDifference: number;
  recommendation: 'snowball' | 'avalanche';
  recommendationReason: string;
}

// ============= SABİTLER =============

/** Sonsuz döngü koruması: maksimum simülasyon ayı */
const MAX_SIMULATION_MONTHS = 600; // 50 yıl

// ============= YARDIMCI FONKSİYONLAR =============

/**
 * Borçları belirtilen sıraya göre sıralayan ve simülasyonu çalıştıran
 * genel borç ödeme motoru.
 *
 * @param sortedDebts - Öncelik sırasına göre sıralı borçlar
 * @param extraPayment - Minimum ödemelerin üzerinde ek aylık ödeme
 * @param method - Strateji adı
 * @returns Simülasyon sonucu
 */
function simulatePayoff(
  sortedDebts: Debt[],
  extraPayment: number,
  method: 'snowball' | 'avalanche'
): StrategyResult {
  // Her borcun güncel bakiyesini takip et
  const balances: Record<string, number> = {};
  for (const debt of sortedDebts) {
    balances[debt.id] = debt.balance;
  }

  const monthlyPlan: MonthlyPayment[] = [];
  const payoffOrder: string[] = [];
  let totalInterest = 0;
  let month = 0;

  // Tüm minimum ödemelerin toplamı
  const totalMinPayment = sortedDebts.reduce(
    (sum, d) => sum + d.minimumPayment,
    0
  );

  // Tüm borçlar ödenene kadar veya maksimum aya kadar simüle et
  while (month < MAX_SIMULATION_MONTHS) {
    // Ödenmemiş borç var mı kontrol et
    const activeDebts = sortedDebts.filter((d) => balances[d.id] > 0.01);
    if (activeDebts.length === 0) break;

    month++;

    // 1. Faiz uygula
    for (const debt of activeDebts) {
      const monthlyRate = debt.interestRate / 100;
      const interest = balances[debt.id] * monthlyRate;
      balances[debt.id] += interest;
      totalInterest += interest;
    }

    // 2. Minimum ödemeleri yap
    const payments: MonthlyPayment['payments'] = [];
    let remainingExtra = extraPayment;

    // Ödenen borçlardan kurtarılan minimum ödeme miktarı da ek ödemeye eklenir
    let freedMinPayment = 0;
    for (const debt of sortedDebts) {
      if (balances[debt.id] <= 0.01) {
        freedMinPayment += debt.minimumPayment;
      }
    }
    remainingExtra += freedMinPayment;

    for (const debt of activeDebts) {
      const balance = balances[debt.id];
      if (balance <= 0.01) continue;

      // Minimum ödeme, bakiyeden fazla olamaz
      const minPayment = Math.min(debt.minimumPayment, balance);
      balances[debt.id] -= minPayment;

      payments.push({
        debtId: debt.id,
        amount: minPayment,
        remainingBalance: balances[debt.id],
      });
    }

    // 3. Ek ödemeyi öncelikli borca yönlendir
    for (const debt of activeDebts) {
      if (remainingExtra <= 0.01) break;
      if (balances[debt.id] <= 0.01) continue;

      const extraAmount = Math.min(remainingExtra, balances[debt.id]);
      balances[debt.id] -= extraAmount;
      remainingExtra -= extraAmount;

      // Mevcut ödemeyi güncelle
      const existingPayment = payments.find((p) => p.debtId === debt.id);
      if (existingPayment) {
        existingPayment.amount += extraAmount;
        existingPayment.remainingBalance = balances[debt.id];
      }
    }

    // 4. Ödenen borçları kaydet
    for (const debt of activeDebts) {
      if (balances[debt.id] <= 0.01 && !payoffOrder.includes(debt.id)) {
        balances[debt.id] = 0;
        payoffOrder.push(debt.id);
      }
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    monthlyPlan.push({ month, payments, totalPaid });
  }

  return {
    method,
    totalInterest: Math.round(totalInterest * 100) / 100,
    monthsToPayoff: month,
    monthlyPlan,
    payoffOrder,
  };
}

// ============= ANA FONKSİYONLAR =============

/**
 * Kartopu (Snowball) stratejisi: En düşük bakiyeli borcu önce öde.
 *
 * Psikolojik motivasyon sağlar - küçük borçlar hızlıca kapanır.
 * Her kapanan borcun minimum ödemesi bir sonraki borca eklenir.
 *
 * @param debts - Borç listesi
 * @param extraPayment - Minimum ödemelerin üzerinde aylık ek ödeme (TL)
 * @returns Simülasyon sonucu
 */
export function calculateSnowball(
  debts: Debt[],
  extraPayment: number
): StrategyResult {
  if (debts.length === 0) {
    return {
      method: 'snowball',
      totalInterest: 0,
      monthsToPayoff: 0,
      monthlyPlan: [],
      payoffOrder: [],
    };
  }

  // Bakiyeye göre küçükten büyüğe sırala
  const sorted = [...debts].sort((a, b) => a.balance - b.balance);
  return simulatePayoff(sorted, extraPayment, 'snowball');
}

/**
 * Çığ (Avalanche) stratejisi: En yüksek faizli borcu önce öde.
 *
 * Matematiksel olarak en az toplam faiz ödeyen yöntem.
 * Yüksek faizli borç önce kapanır, toplam maliyet düşer.
 *
 * @param debts - Borç listesi
 * @param extraPayment - Minimum ödemelerin üzerinde aylık ek ödeme (TL)
 * @returns Simülasyon sonucu
 */
export function calculateAvalanche(
  debts: Debt[],
  extraPayment: number
): StrategyResult {
  if (debts.length === 0) {
    return {
      method: 'avalanche',
      totalInterest: 0,
      monthsToPayoff: 0,
      monthlyPlan: [],
      payoffOrder: [],
    };
  }

  // Faiz oranına göre yüksekten düşüğe sırala
  const sorted = [...debts].sort((a, b) => b.interestRate - a.interestRate);
  return simulatePayoff(sorted, extraPayment, 'avalanche');
}

/**
 * İki stratejiyi karşılaştırır ve öneri sunar.
 *
 * Karar mantığı:
 * - Faiz farkı %10'dan fazlaysa: avalanche (matematiksel avantaj belirgin)
 * - Borç sayısı az ve bakiyeler yakınsa: snowball (psikolojik avantaj)
 * - Aksi halde: avalanche (varsayılan olarak tasarruf önerilir)
 *
 * @param debts - Borç listesi
 * @param extraPayment - Minimum ödemelerin üzerinde aylık ek ödeme (TL)
 * @returns İki strateji karşılaştırması ve öneri
 */
export function compareStrategies(
  debts: Debt[],
  extraPayment: number
): StrategyComparison {
  const snowball = calculateSnowball(debts, extraPayment);
  const avalanche = calculateAvalanche(debts, extraPayment);

  const interestDifference = snowball.totalInterest - avalanche.totalInterest;
  const timeDifference = snowball.monthsToPayoff - avalanche.monthsToPayoff;

  // Öneri mantığı
  let recommendation: StrategyComparison['recommendation'];
  let recommendationReason: string;

  if (interestDifference <= 0) {
    // Kartopu zaten daha az veya eşit faiz ödüyor (nadir durum)
    recommendation = 'snowball';
    recommendationReason =
      'Kartopu yöntemi hem psikolojik motivasyon sağlıyor hem de faiz maliyeti açısından avantajlı.';
  } else {
    // Avalanche daha az faiz öder (normal durum)
    const interestSavingsPercent =
      snowball.totalInterest > 0
        ? (interestDifference / snowball.totalInterest) * 100
        : 0;

    if (interestSavingsPercent > 10) {
      // Faiz tasarrufu belirgin: avalanche öner
      recommendation = 'avalanche';
      recommendationReason = `Çığ yöntemiyle ${interestDifference.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL daha az faiz ödersiniz (%${interestSavingsPercent.toFixed(0)} tasarruf). Matematiksel olarak en avantajlı yöntem.`;
    } else if (debts.length <= 3) {
      // Az borç, küçük fark: kartopu öner (motivasyon)
      recommendation = 'snowball';
      recommendationReason = `Faiz farkı küçük (${interestDifference.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL). Az sayıda borcunuz var, kartopu yöntemiyle küçük borçları hızla kapatarak motivasyonunuzu artırabilirsiniz.`;
    } else {
      // Çok borç, orta fark: avalanche öner
      recommendation = 'avalanche';
      recommendationReason = `Çığ yöntemiyle ${interestDifference.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL faiz tasarrufu sağlarsınız. Yüksek faizli borçları önce kapatmak uzun vadede avantajlı.`;
    }
  }

  return {
    snowball,
    avalanche,
    interestDifference: Math.round(interestDifference * 100) / 100,
    timeDifference,
    recommendation,
    recommendationReason,
  };
}
