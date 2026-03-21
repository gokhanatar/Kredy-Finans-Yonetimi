
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121
122
123
124
125
126
127
128
129
130
131
132
133
134
135
136
137
138
139
140
141
142
143
144
145
146
147
148
149
150
151
152
153
1541x
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
 
1x
1x
1x
1x
1x
1x
1x
1x
 
1x
1x
1x
1x
1x
1x
1x
1x
 
1x
1x
1x
1x
1x
1x
 
1x
1x
 
1x
1x
1x
 // Kredi ve Gecikme Takip Tipleri
 
export type LoanType = 'konut' | 'ihtiyac' | 'tasit' | 'kobi' | 'diger';
 
export interface Loan {
  id: string;
  name: string;
  bankName: string;
  loanType: LoanType;
  principalAmount: number;
  interestRate: number; // Aylık faiz oranı (%)
  termMonths: number;
  monthlyPayment: number;
  startDate: string; // ISO string
  dueDay: number; // 1-31
  remainingBalance: number;
  remainingInstallments: number;
  
  // Gecikme takibi
  lastPaymentDate?: string;
  isOverdue: boolean;
  overdueDays: number;
  overdueInterestRate: number; // Aylık gecikme faiz oranı (%)
  totalOverdueInterest: number;
  isPaid: boolean;
}
 
export interface LoanPaymentHistory {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  paymentDate?: string;
  amount: number;
  principal: number;
  interest: number;
  status: 'pending' | 'paid' | 'overdue';
  overdueDays: number;
  overdueInterest: number;
}
 
export interface OverdueItem {
  id: string;
  type: 'loan' | 'credit_card';
  name: string;
  bankName: string;
  amount: number;
  dueDate: string;
  overdueDays: number;
  dailyInterestRate: number;
  dailyInterestAmount: number;
  totalOverdueInterest: number;
  isPaid: boolean;
}
 
// Kredi hesaplama sonuçları
export interface LoanCalculationResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  effectiveRate: number; // KKDF + BSMV dahil efektif faiz
  amortizationSchedule: AmortizationRow[];
}
 
export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  cumulativeInterest: number;
  cumulativePayment: number;
}
 
// Gecikme hesaplama sonuçları
export interface OverdueCalculation {
  isOverdue: boolean;
  overdueDays: number;
  dailyRate: number;
  dailyAmount: number;
  totalInterest: number;
  totalWithInterest: number;
  severity: 'none' | 'warning' | 'danger' | 'critical';
}
 
// Banka seçenekleri
export const BANK_LIST = [
  'Yapı Kredi',
  'Garanti BBVA',
  'İş Bankası',
  'Akbank',
  'Ziraat Bankası',
  'Halkbank',
  'Vakıfbank',
  'QNB Finansbank',
  'Denizbank',
  'TEB',
  'ING',
  'HSBC',
  // Özel Mevduat Bankaları
  'Şekerbank',
  'Anadolubank',
  'Fibabanka',
  'Odeabank',
  'Turkish Bank',
  'Alternatifbank',
  'Burgan Bank',
  'ICBC Turkey',
  // Katılım Bankaları
  'Kuveyt Türk',
  'Türkiye Finans',
  'Albaraka Türk',
  'Ziraat Katılım',
  'Vakıf Katılım',
  'Emlak Katılım',
  'Hayat Finans',
  // Dijital Bankalar / Fintek
  'Enpara.com',
  'Papara',
  'Diğer'
] as const;
 
// Kredi türü etiketleri
export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  konut: 'Konut Kredisi',
  ihtiyac: 'İhtiyaç Kredisi',
  tasit: 'Taşıt Kredisi',
  kobi: 'KOBİ Kredisi',
  diger: 'Diğer Kredi'
};
 
// Varsayılan faiz oranları (2026)
export const DEFAULT_INTEREST_RATES: Record<LoanType, number> = {
  konut: 2.89,
  ihtiyac: 4.25,
  tasit: 3.75,
  kobi: 3.50,
  diger: 4.25
};
 
// Kredi sabitleri
export const LOAN_CONSTANTS = {
  MIN_TERM_MONTHS: 6,
  MAX_TERM_MONTHS: 120,
  KKDF_RATE: 15, // %15
  BSMV_RATE: 15, // %15
  
  // Gecikme faizi çarpanı (1.30 = %30 fazlası)
  OVERDUE_RATE_MULTIPLIER: 1.30,
  
  // Günlük faiz hesaplama için ay içi gün sayısı
  DAYS_IN_MONTH: 30,
};
 