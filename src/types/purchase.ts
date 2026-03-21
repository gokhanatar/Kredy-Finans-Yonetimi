
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 export interface PurchaseData {
  id: string;
  cardId: string;
  amount: number;
  category: string;
  description: string;
  merchant?: string;
  installments: number;
  monthlyPayment: number;
  totalAmount: number;
  date: Date;
  isDeferred: boolean;
  deferredMonths: number;
  firstPaymentDate: Date;
}
 
export const CATEGORIES = [
  { value: 'market', label: 'Market / Gıda', icon: 'shopping-cart', maxInstallment: 1, canDefer: false },
  { value: 'electronics', label: 'Elektronik', icon: 'smartphone', maxInstallment: 12, canDefer: true },
  { value: 'clothing', label: 'Giyim', icon: 'shirt', maxInstallment: 9, canDefer: true },
  { value: 'home', label: 'Ev & Mobilya', icon: 'home', maxInstallment: 12, canDefer: true },
  { value: 'appliances', label: 'Beyaz Eşya', icon: 'monitor', maxInstallment: 12, canDefer: true },
  { value: 'health', label: 'Sağlık', icon: 'heart-pulse', maxInstallment: 9, canDefer: true },
  { value: 'education', label: 'Eğitim', icon: 'graduation-cap', maxInstallment: 12, canDefer: true },
  { value: 'travel', label: 'Seyahat', icon: 'plane', maxInstallment: 9, canDefer: true },
  { value: 'fuel', label: 'Akaryakıt', icon: 'fuel', maxInstallment: 1, canDefer: false },
  { value: 'entertainment', label: 'Eğlence', icon: 'film', maxInstallment: 6, canDefer: true },
  { value: 'jewelry', label: 'Kuyum', icon: 'gem', maxInstallment: 6, canDefer: false },
  { value: 'other', label: 'Diğer', icon: 'package', maxInstallment: 9, canDefer: true },
] as const;
 
export const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 9, 12] as const;
 
export const DEFERRED_OPTIONS = [
  { value: 0, label: 'Ertelemesiz' },
  { value: 1, label: '1 Ay Ertelemeli' },
  { value: 2, label: '2 Ay Ertelemeli' },
  { value: 3, label: '3 Ay Ertelemeli' },
] as const;
 