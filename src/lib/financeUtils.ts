import {
  CreditCard,
  FinancialHealth,
  GoldenWindowCard,
  DebtRollingSimulation,
  RestructuringSimulation,
  DetailedInstallmentCategory,
  FINANCIAL_CONSTANTS,
  TAKSIT_LIMITS,
  DETAILED_INSTALLMENT_LIMITS,
  TransactionCategory,
} from "@/types/finance";

// ============= 2026 BDDK Kademeli Faiz Hesaplama =============

/**
 * Borç tutarına göre kademeli faiz oranını hesaplar (2026 BDDK düzenlemesi)
 * @param debtAmount - Dönem borcu tutarı (TL)
 * @param isLate - Gecikme faizi mi? (varsayılan: false = akdi faiz)
 * @returns Aylık faiz oranı (%)
 */
export function calculateTieredInterestRate(debtAmount: number, isLate: boolean = false): number {
  const { TIERED_INTEREST_RATES } = FINANCIAL_CONSTANTS;
  
  if (debtAmount < 30000) {
    return isLate ? TIERED_INTEREST_RATES.UNDER_30K.late : TIERED_INTEREST_RATES.UNDER_30K.contractual;
  } else if (debtAmount <= 180000) {
    return isLate ? TIERED_INTEREST_RATES.BETWEEN_30K_180K.late : TIERED_INTEREST_RATES.BETWEEN_30K_180K.contractual;
  } else {
    return isLate ? TIERED_INTEREST_RATES.OVER_180K.late : TIERED_INTEREST_RATES.OVER_180K.contractual;
  }
}

/**
 * Vergi dahil efektif faiz oranını hesaplar (KKDF + BSMV)
 * @param baseRate - Baz faiz oranı (%)
 * @returns Vergi dahil efektif oran (%)
 */
export function calculateEffectiveInterestRate(baseRate: number): number {
  const { KKDF_RATE, BSMV_RATE } = FINANCIAL_CONSTANTS;
  const taxMultiplier = 1 + (KKDF_RATE / 100) + (BSMV_RATE / 100); // 1.30
  return baseRate * taxMultiplier;
}

/**
 * Toplam faiz maliyetini hesaplar (anapara üzerinden)
 * @param principal - Anapara (TL)
 * @param monthlyRate - Aylık faiz oranı (%)
 * @param months - Vade (ay)
 * @returns Toplam faiz maliyeti (TL)
 */
export function calculateTotalInterestCost(principal: number, monthlyRate: number, months: number): number {
  if (months <= 0) return 0;

  const effectiveRate = calculateEffectiveInterestRate(monthlyRate) / 100;
  const r = effectiveRate;
  const n = months;

  // Zero interest: no cost
  if (r === 0) return 0;

  // PMT formülü ile aylık ödeme
  const monthlyPayment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = monthlyPayment * months;

  return totalPayment - principal;
}

/**
 * Limit tahsis kurallarına göre maksimum limiti hesaplar
 * @param monthlyIncome - Aylık gelir (TL)
 * @param yearsWithBank - Banka ile geçen yıl sayısı
 * @returns Maksimum tahsis edilebilecek limit (TL)
 */
export function calculateMaxAllowedLimit(monthlyIncome: number, yearsWithBank: number): number {
  const { LIMIT_RULES } = FINANCIAL_CONSTANTS;
  
  if (yearsWithBank < 1) {
    return monthlyIncome * LIMIT_RULES.FIRST_YEAR_MULTIPLIER;
  } else {
    return monthlyIncome * LIMIT_RULES.SECOND_YEAR_MULTIPLIER;
  }
}

/**
 * Kart kapatma riski kontrolü yapar
 * @param yearlyMinPaymentFails - Yıl içinde asgari ödeme yapılmayan ay sayısı
 * @param consecutiveMinPaymentFails - Art arda asgari ödeme yapılmayan ay sayısı
 * @returns Risk durumu ve açıklama
 */
export function checkCardClosureRisk(
  yearlyMinPaymentFails: number,
  consecutiveMinPaymentFails: number
): { riskLevel: 'none' | 'cash_blocked' | 'fully_blocked'; message: string } {
  const { CARD_CLOSURE_RULES } = FINANCIAL_CONSTANTS;
  
  if (consecutiveMinPaymentFails >= CARD_CLOSURE_RULES.CONSECUTIVE_MIN_PAYMENT_FAILS) {
    return {
      riskLevel: 'fully_blocked',
      message: `⛔ Art arda ${consecutiveMinPaymentFails} kez asgari ödeme yapılmadı. Kart tamamen kapatılabilir!`,
    };
  }
  
  if (yearlyMinPaymentFails >= CARD_CLOSURE_RULES.YEARLY_MIN_PAYMENT_FAILS) {
    return {
      riskLevel: 'cash_blocked',
      message: `⚠️ Bu yıl ${yearlyMinPaymentFails} kez asgari ödeme yapılmadı. Nakit kullanım kapatılabilir!`,
    };
  }
  
  return {
    riskLevel: 'none',
    message: '✅ Kart durumunuz normal.',
  };
}


// Calculate days until payment from statement date
export function calculateDaysUntilPayment(statementDate: number): number {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Payment is typically 10 days after statement
  // Use Date constructor which handles month overflow automatically
  // e.g. new Date(2026, 0, 41) → Feb 10
  const paymentDate = new Date(currentYear, currentMonth, statementDate + 10);
  const diffTime = paymentDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays < 0 ? diffDays + 30 : diffDays;
}

// Golden Window Algorithm - Find the best card for today's purchase
// Altın pencere: Hesap kesim tarihinden sonraki 5 gün boyunca sürer.
// Bu dönemde yapılan harcamalar bir sonraki ekstre dönemine girer → en uzun vade.
// Yıldız sistemi: Gün 1 = 5⭐ (en iyi), Gün 2 = 4⭐, ... Gün 5 = 1⭐
export function calculateGoldenWindow(cards: CreditCard[]): GoldenWindowCard[] {
  const today = new Date();
  const currentDay = today.getDate();

  return cards
    .map((card) => {
      // Use actual days in previous month instead of hard-coded 30
      const daysInPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      const daysSinceStatement =
        currentDay >= card.statementDate
          ? currentDay - card.statementDate
          : daysInPrevMonth - card.statementDate + currentDay;

      // Golden window is 1-5 days after statement date (5 full days)
      const isGoldenWindow = daysSinceStatement >= 1 && daysSinceStatement <= 5;
      const daysUntilPayment = calculateDaysUntilPayment(card.statementDate);

      // Star rating: 5 on day 1, 4 on day 2, ..., 1 on day 5, 0 outside
      const goldenRating = isGoldenWindow ? Math.max(1, 6 - daysSinceStatement) : 0;
      // Days remaining in golden window (including today)
      const goldenDaysRemaining = isGoldenWindow ? 5 - daysSinceStatement + 1 : 0;

      let recommendation = "";
      if (isGoldenWindow) {
        if (goldenDaysRemaining === 1) {
          recommendation = `⭐ Son gün! Altın pencerenin son günü. Bugün harcama yaparsan ödeme ${daysUntilPayment} gün sonra.`;
        } else {
          recommendation = `${'⭐'.repeat(goldenRating)} Altın Pencere aktif! ${goldenDaysRemaining} gün daha devam edecek. Bugün harcama yaparsan ödeme ${daysUntilPayment} gün sonra.`;
        }
      } else if (daysSinceStatement < 1) {
        recommendation = `⏳ Yarına bekle, hesap kesimi bugün. Yarın altın pencere başlıyor!`;
      } else {
        // Use actual days in current month instead of hard-coded 30
        const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const daysToNextGolden = card.statementDate > currentDay
          ? card.statementDate - currentDay + 1
          : daysInCurrentMonth - currentDay + card.statementDate + 1;
        recommendation = `Ödeme ${daysUntilPayment} gün sonra. Altın pencereye ${daysToNextGolden} gün.`;
      }

      return {
        card,
        daysUntilPayment,
        isGoldenWindow,
        goldenRating,
        goldenDaysRemaining,
        recommendation,
      };
    })
    .sort((a, b) => {
      // Prioritize golden window cards (higher rating first), then by days until payment
      if (a.isGoldenWindow && !b.isGoldenWindow) return -1;
      if (!a.isGoldenWindow && b.isGoldenWindow) return 1;
      if (a.isGoldenWindow && b.isGoldenWindow) return b.goldenRating - a.goldenRating;
      return b.daysUntilPayment - a.daysUntilPayment;
    });
}

// Calculate minimum payment based on 2026 regulations
export function calculateMinimumPayment(card: CreditCard): number {
  const rate =
    card.limit >= FINANCIAL_CONSTANTS.HIGH_LIMIT_THRESHOLD
      ? FINANCIAL_CONSTANTS.HIGH_LIMIT_MIN_PAYMENT
      : FINANCIAL_CONSTANTS.LOW_LIMIT_MIN_PAYMENT;

  return (card.currentDebt * rate) / 100;
}

// Debt Rolling Simulation
export function simulateDebtRolling(
  sourceCard: CreditCard,
  targetCard: CreditCard,
  amount: number,
  months: number = 12
): DebtRollingSimulation {
  const { CASH_ADVANCE_RATE, KKDF_RATE, BSMV_RATE, TRANSACTION_FEE } =
    FINANCIAL_CONSTANTS;

  // Calculate fees
  const cashAdvanceFee = (amount * CASH_ADVANCE_RATE) / 100;
  const kkdfAmount = (cashAdvanceFee * KKDF_RATE) / 100;
  const bsmvAmount = (cashAdvanceFee * BSMV_RATE) / 100;
  const transactionFeeAmount = (amount * TRANSACTION_FEE) / 100;

  const totalCost =
    cashAdvanceFee + kkdfAmount + bsmvAmount + transactionFeeAmount;
  const totalPayment = amount + totalCost;
  const monthlyPayment = totalPayment / months;

  // Calculate warnings
  const warnings: string[] = [];
  const newUtilization =
    ((targetCard.currentDebt + amount) / targetCard.limit) * 100;

  if (newUtilization > FINANCIAL_CONSTANTS.UTILIZATION_DANGER_THRESHOLD) {
    warnings.push(
      `⚠️ Hedef kartın limit kullanım oranı %${newUtilization.toFixed(0)}'e çıkacak. Findeks puanınızı olumsuz etkileyebilir.`
    );
  }

  if (amount > targetCard.availableLimit * 0.8) {
    warnings.push(
      `⚠️ Bu işlem hedef kartın kullanılabilir limitinin %80'inden fazlasını kullanacak.`
    );
  }

  // Determine risk level
  let riskLevel: "low" | "medium" | "high" = "low";
  if (warnings.length >= 2 || newUtilization > 80) {
    riskLevel = "high";
  } else if (warnings.length === 1 || newUtilization > 50) {
    riskLevel = "medium";
  }

  return {
    sourceCardId: sourceCard.id,
    targetCardId: targetCard.id,
    amount,
    cashAdvanceFee,
    kkdfRate: kkdfAmount,
    bsmvRate: bsmvAmount,
    transactionFee: transactionFeeAmount,
    totalCost,
    monthlyPayment,
    totalPayment,
    riskLevel,
    warnings,
  };
}

// Calculate overall financial health
export function calculateFinancialHealth(cards: CreditCard[]): FinancialHealth {
  const totalDebt = cards.reduce((sum, card) => sum + card.currentDebt, 0);
  const totalLimit = cards.reduce((sum, card) => sum + card.limit, 0);
  const totalAvailable = cards.reduce(
    (sum, card) => sum + card.availableLimit,
    0
  );
  const utilizationRate = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;

  // Determine Findeks risk
  let findeksRisk: "low" | "medium" | "high" = "low";
  if (utilizationRate > FINANCIAL_CONSTANTS.UTILIZATION_DANGER_THRESHOLD) {
    findeksRisk = "high";
  } else if (
    utilizationRate > FINANCIAL_CONSTANTS.UTILIZATION_WARNING_THRESHOLD
  ) {
    findeksRisk = "medium";
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (findeksRisk === "high") {
    recommendations.push(
      "Limit kullanım oranınız çok yüksek. Borcunuzu birden fazla karta dağıtmayı düşünün."
    );
  }

  const highUtilizationCards = cards.filter(
    (card) =>
      (card.currentDebt / card.limit) * 100 >
      FINANCIAL_CONSTANTS.UTILIZATION_DANGER_THRESHOLD
  );

  if (highUtilizationCards.length > 0) {
    recommendations.push(
      `${highUtilizationCards.length} kartınızda limit kullanımı %70'in üzerinde.`
    );
  }

  const goldenWindows = calculateGoldenWindow(cards).filter(
    (gw) => gw.isGoldenWindow
  );
  if (goldenWindows.length > 0) {
    recommendations.push(
      `${goldenWindows[0].card.cardName} kartınız altın pencerede! Bugün harcama için ideal.`
    );
  }

  return {
    totalDebt,
    totalLimit,
    totalAvailable,
    utilizationRate,
    findeksRisk,
    upcomingPayments: [],
    recommendations,
  };
}

// Get installment limit for category
export function getInstallmentLimit(
  category: TransactionCategory,
  amount: number,
  cardType: "bireysel" | "ticari"
): { maxInstallments: number; message: string } {
  const limit = TAKSIT_LIMITS.find((t) => t.category === category);

  if (!limit) {
    return { maxInstallments: 0, message: "Kategori bulunamadı." };
  }

  if (limit.maxInstallments === 0) {
    return {
      maxInstallments: 0,
      message: `${limit.label} kategorisinde taksit yapılamaz.`,
    };
  }

  if (limit.minAmount && amount < limit.minAmount) {
    return {
      maxInstallments: limit.maxInstallments,
      message: `${limit.label} için ${limit.minAmount.toLocaleString("tr-TR")} TL üzeri harcamalarda maksimum ${limit.maxInstallments} taksit.`,
    };
  }

  // Commercial cards can have more installments
  const maxInstallments =
    cardType === "ticari"
      ? Math.min(limit.maxInstallments * 2, 18)
      : limit.maxInstallments;

  return {
    maxInstallments,
    message: `${cardType === "ticari" ? "Ticari" : "Bireysel"} kartınızla maksimum ${maxInstallments} taksit yapabilirsiniz.`,
  };
}

// Format currency — kuruş varsa göster, yoksa gösterme
export function formatCurrency(amount: number): string {
  const hasDecimals = amount % 1 !== 0;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format number — para birimi olmadan binlik noktalı format (100000 → 100.000)
export function formatNumber(value: number): string {
  const hasDecimals = value % 1 !== 0;
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

// Parse Turkish formatted number string → number ("100.000,50" → 100000.5)
export function parseTurkishNumber(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  // Remove dots (thousands separator), replace comma with dot (decimal separator)
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Format a number for display in input fields (Turkish format)
export function formatInputDisplay(value: number): string {
  if (value === 0) return '';
  return formatNumber(value);
}

// Format percentage
export function formatPercentage(value: number): string {
  return `%${value.toFixed(1)}`;
}

// Get status color class
export function getStatusColor(
  utilizationRate: number
): "success" | "warning" | "danger" {
  if (utilizationRate <= 30) return "success";
  if (utilizationRate <= 70) return "warning";
  return "danger";
}

// ============= NEW FUNCTIONS FOR RESTRUCTURING & INSTALLMENT =============

// Simulate BDDK 60-month restructuring
export function simulateRestructuring(
  totalDebt: number,
  cardLimit: number,
  termMonths: number
): RestructuringSimulation {
  const { TCMB_REFERENCE_RATE, BANK_MARGIN, KKDF_RATE, BSMV_RATE, HIGH_LIMIT_THRESHOLD, HIGH_LIMIT_MIN_PAYMENT, LOW_LIMIT_MIN_PAYMENT, RESTRUCTURE_LIMIT_FREEZE_THRESHOLD } = FINANCIAL_CONSTANTS;
  
  // Guard: zero term → pay all at once
  if (termMonths <= 0) {
    return {
      totalDebt,
      cardLimit,
      termMonths: 0,
      monthlyInterestRate: 0,
      effectiveRate: 0,
      monthlyPayment: totalDebt,
      totalPayment: totalDebt,
      totalInterestCost: 0,
      minimumPaymentRate: 0,
      riskLevel: 'low',
      warnings: [],
      findeksImpact: '',
    };
  }

  // Calculate effective interest rate
  const baseRate = TCMB_REFERENCE_RATE + BANK_MARGIN; // %3.11 + %0.5 = %3.61
  const monthlyInterestRate = baseRate / 100;

  // Add KKDF and BSMV taxes to interest
  const taxMultiplier = 1 + (KKDF_RATE / 100) + (BSMV_RATE / 100); // 1.30
  const effectiveRate = monthlyInterestRate * taxMultiplier;

  // PMT formula: P * [r(1+r)^n] / [(1+r)^n - 1]
  const r = effectiveRate;
  const n = termMonths;
  // Zero interest: simple division
  const monthlyPayment = r === 0
    ? totalDebt / n
    : totalDebt * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  
  const totalPayment = monthlyPayment * termMonths;
  const totalInterestCost = totalPayment - totalDebt;
  
  // Minimum payment rate based on limit
  const minimumPaymentRate = cardLimit >= HIGH_LIMIT_THRESHOLD ? HIGH_LIMIT_MIN_PAYMENT : LOW_LIMIT_MIN_PAYMENT;
  
  // Warnings
  const warnings: string[] = [];
  
  // Limit freeze warning
  warnings.push(`⚠️ Yapılandırma süresince kart limitiniz, borcunuz %${RESTRUCTURE_LIMIT_FREEZE_THRESHOLD}'nin altına düşene kadar artmayacaktır.`);
  
  // Utilization warning
  const utilizationRate = (totalDebt / cardLimit) * 100;
  if (utilizationRate > 70) {
    warnings.push(`📊 Limit kullanım oranınız %${utilizationRate.toFixed(0)} - Findeks puanınızı olumsuz etkileyebilir.`);
  }
  
  // Long term warning
  if (termMonths > 36) {
    warnings.push(`⏳ ${termMonths} ay uzun bir vade. Toplam faiz maliyetiniz ${formatCurrency(totalInterestCost)} olacak.`);
  }
  
  // Risk level
  let riskLevel: "low" | "medium" | "high" = "low";
  if (utilizationRate > 70 || termMonths > 48) {
    riskLevel = "high";
  } else if (utilizationRate > 40 || termMonths > 24) {
    riskLevel = "medium";
  }
  
  // Findeks impact
  let findeksImpact = "";
  if (riskLevel === "high") {
    findeksImpact = "Yapılandırma Findeks puanınızı olumsuz etkileyebilir. Düzenli ödeme ile 6 ay içinde toparlanabilir.";
  } else if (riskLevel === "medium") {
    findeksImpact = "Düzenli ödemelerle Findeks puanınız korunacaktır.";
  } else {
    findeksImpact = "Yapılandırma Findeks puanınızı olumlu etkileyebilir.";
  }
  
  return {
    totalDebt,
    cardLimit,
    termMonths,
    monthlyInterestRate: baseRate,
    effectiveRate: effectiveRate * 100,
    monthlyPayment,
    totalPayment,
    totalInterestCost,
    minimumPaymentRate,
    riskLevel,
    warnings,
    findeksImpact,
  };
}

// Get detailed installment limit for a category
export function getDetailedInstallmentLimit(
  categoryId: string,
  amount: number,
  cardType: "bireysel" | "ticari"
): {
  maxInstallments: number;
  category: DetailedInstallmentCategory | undefined;
  message: string;
  alternativeMessage?: string;
  isProhibited: boolean;
} {
  const category = DETAILED_INSTALLMENT_LIMITS.find((c) => c.id === categoryId);
  
  if (!category) {
    return {
      maxInstallments: 0,
      category: undefined,
      message: "Kategori bulunamadı.",
      isProhibited: false,
    };
  }
  
  if (category.isProhibited) {
    return {
      maxInstallments: 0,
      category,
      message: `${category.icon} ${category.label} kategorisinde taksit yapılamaz!`,
      isProhibited: true,
    };
  }
  
  // Check minimum amount condition
  if (category.minAmount && amount < category.minAmount) {
    const maxInstallments = cardType === "bireysel" ? category.bireyselMax : category.ticariMax;
    return {
      maxInstallments,
      category,
      message: `${category.icon} ${category.label}: ${formatCurrency(category.minAmount)} altı tutarlar için standart taksit uygulanır.`,
      isProhibited: false,
    };
  }
  
  const maxInstallments = cardType === "bireysel" ? category.bireyselMax : category.ticariMax;
  const otherTypeMax = cardType === "bireysel" ? category.ticariMax : category.bireyselMax;
  
  let alternativeMessage: string | undefined;
  if (cardType === "bireysel" && otherTypeMax > maxInstallments) {
    alternativeMessage = `💡 Ticari kartla ${otherTypeMax} taksit yapabilirsiniz!`;
  }
  
  let conditionText = "";
  if (category.specialCondition) {
    conditionText = ` (${category.specialCondition})`;
  }
  
  return {
    maxInstallments,
    category,
    message: `${category.icon} ${category.label}${conditionText}: Maksimum ${maxInstallments} taksit`,
    alternativeMessage,
    isProhibited: false,
  };
}

// Calculate all installment options for display
export function calculateInstallmentOptions(
  amount: number,
  cardType: "bireysel" | "ticari"
): Array<{
  category: DetailedInstallmentCategory;
  maxInstallments: number;
  monthlyPayment: number;
  isProhibited: boolean;
}> {
  return DETAILED_INSTALLMENT_LIMITS.map((category) => {
    const limit = getDetailedInstallmentLimit(category.id, amount, cardType);
    const monthlyPayment = limit.maxInstallments > 0 ? amount / limit.maxInstallments : 0;
    
    return {
      category,
      maxInstallments: limit.maxInstallments,
      monthlyPayment,
      isProhibited: limit.isProhibited,
    };
  });
}
