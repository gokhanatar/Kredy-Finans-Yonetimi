
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
154
155
156
157
158
159
160
161
162
163
164
165
166
167
168
169
170
171
172
173
174
175
176
177
178
179
180
181
182
183
184
185
186
187
188
189 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 // Gecikme Takip Hook'u
 
import { useMemo, useCallback } from 'react';
import { CreditCard } from '@/types/finance';
import { Loan, OverdueItem } from '@/types/loan';
import { 
  calculateCardDailyInterest, 
  calculateLoanDailyInterest,
  generateOverdueMessage,
  checkOverdueStatus
} from '@/lib/overdueUtils';
import { addDays, startOfDay, setDate, isBefore } from 'date-fns';
 
interface UseOverdueTrackingProps {
  cards: CreditCard[];
  loans: Loan[];
  onMarkCardPaid?: (cardId: string) => void;
  onMarkLoanPaid?: (loanId: string) => void;
}
 
export function useOverdueTracking({
  cards,
  loans,
  onMarkCardPaid,
  onMarkLoanPaid
}: UseOverdueTrackingProps) {
  
  // Geciken kart ödemeleri hesaplama
  const overdueCards = useMemo((): OverdueItem[] => {
    const today = startOfDay(new Date());
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return cards
      .filter((card) => card.currentDebt > 0)
      .map((card) => {
        // Son ödeme tarihini hesapla
        const dueDate = setDate(new Date(currentYear, currentMonth, 1), card.dueDate);
        
        // Eğer bu ayki son ödeme tarihi geçtiyse, kontrol et
        if (isBefore(dueDate, today)) {
          // Geçmiş ayın son ödeme tarihi mi kontrol et
          const calculation = calculateCardDailyInterest(
            card.currentDebt,
            dueDate,
            false // Ödenmemiş varsayıyoruz - gerçek uygulamada ödeme durumu takip edilmeli
          );
          
          if (calculation.isOverdue) {
            return {
              id: card.id,
              type: 'credit_card' as const,
              name: `${card.bankName} ${card.cardName}`,
              bankName: card.bankName,
              amount: card.currentDebt,
              dueDate: dueDate.toISOString(),
              overdueDays: calculation.overdueDays,
              dailyInterestRate: calculation.dailyRate,
              dailyInterestAmount: calculation.dailyAmount,
              totalOverdueInterest: calculation.totalInterest,
              isPaid: false
            };
          }
        }
        
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [cards]);
 
  // Geciken kredi ödemeleri hesaplama
  const overdueLoans = useMemo((): OverdueItem[] => {
    return loans
      .filter((loan) => loan.isOverdue && !loan.isPaid)
      .map((loan) => {
        const calculation = calculateLoanDailyInterest(
          loan.monthlyPayment,
          loan.overdueInterestRate,
          loan.overdueDays
        );
        
        return {
          id: loan.id,
          type: 'loan' as const,
          name: loan.name,
          bankName: loan.bankName,
          amount: loan.monthlyPayment,
          dueDate: new Date().toISOString(), // Gerçek vade tarihi loan'dan alınmalı
          overdueDays: loan.overdueDays,
          dailyInterestRate: calculation.dailyRate,
          dailyInterestAmount: calculation.dailyAmount,
          totalOverdueInterest: loan.totalOverdueInterest,
          isPaid: false
        };
      });
  }, [loans]);
 
  // Tüm gecikmiş ödemeler
  const allOverdueItems = useMemo(() => {
    return [...overdueCards, ...overdueLoans].sort((a, b) => b.overdueDays - a.overdueDays);
  }, [overdueCards, overdueLoans]);
 
  // Toplam geciken tutar
  const totalOverdueAmount = useMemo(() => {
    return allOverdueItems.reduce((sum, item) => sum + item.amount, 0);
  }, [allOverdueItems]);
 
  // Toplam binen faiz
  const totalOverdueInterest = useMemo(() => {
    return allOverdueItems.reduce((sum, item) => sum + item.totalOverdueInterest, 0);
  }, [allOverdueItems]);
 
  // Bugün binen toplam faiz
  const todaysTotalInterest = useMemo(() => {
    return allOverdueItems.reduce((sum, item) => sum + item.dailyInterestAmount, 0);
  }, [allOverdueItems]);
 
  // Ödendi olarak işaretle
  const markAsPaid = useCallback((id: string, type: 'credit_card' | 'loan') => {
    if (type === 'credit_card' && onMarkCardPaid) {
      onMarkCardPaid(id);
    } else if (type === 'loan' && onMarkLoanPaid) {
      onMarkLoanPaid(id);
    }
  }, [onMarkCardPaid, onMarkLoanPaid]);
 
  // Günlük bildirim mesajları oluştur
  const getDailyMessages = useCallback((): string[] => {
    const messages: string[] = [];
    
    allOverdueItems.forEach((item) => {
      messages.push(
        generateOverdueMessage(
          item.name,
          item.type,
          item.overdueDays,
          item.dailyInterestAmount,
          item.totalOverdueInterest
        )
      );
    });
 
    if (allOverdueItems.length > 1) {
      const totalDaily = todaysTotalInterest.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      messages.push(
        `⚠️ Toplam ${allOverdueItems.length} ödemeniz gecikmiş durumda. Bugün toplam ${totalDaily} TL faiz bindi.`
      );
    }
 
    return messages;
  }, [allOverdueItems, todaysTotalInterest]);
 
  // Özet bilgi
  const summary = useMemo(() => ({
    hasOverdue: allOverdueItems.length > 0,
    overdueCount: allOverdueItems.length,
    cardCount: overdueCards.length,
    loanCount: overdueLoans.length,
    totalAmount: totalOverdueAmount,
    totalInterest: totalOverdueInterest,
    todaysInterest: todaysTotalInterest,
    maxOverdueDays: allOverdueItems.length > 0 
      ? Math.max(...allOverdueItems.map(i => i.overdueDays))
      : 0,
    severity: allOverdueItems.length === 0 
      ? 'none' as const
      : allOverdueItems.some(i => i.overdueDays > 30)
        ? 'critical' as const
        : allOverdueItems.some(i => i.overdueDays > 7)
          ? 'danger' as const
          : 'warning' as const
  }), [allOverdueItems, overdueCards, overdueLoans, totalOverdueAmount, totalOverdueInterest, todaysTotalInterest]);
 
  return {
    overdueCards,
    overdueLoans,
    allOverdueItems,
    totalOverdueAmount,
    totalOverdueInterest,
    todaysTotalInterest,
    markAsPaid,
    getDailyMessages,
    summary
  };
}
 