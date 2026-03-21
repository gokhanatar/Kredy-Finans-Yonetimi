
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useLocalStorage } from './useLocalStorage';
import { PurchaseData } from '@/types/purchase';
 
export function usePurchaseHistory() {
  const [purchases, setPurchases] = useLocalStorage<PurchaseData[]>('kredi-pusula-purchases', []);
 
  const addPurchase = (purchase: Omit<PurchaseData, 'id'>) => {
    const newPurchase: PurchaseData = {
      ...purchase,
      id: crypto.randomUUID(),
    };
    setPurchases((prev) => [newPurchase, ...prev]);
    return newPurchase;
  };
 
  const deletePurchase = (id: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id));
  };
 
  const getPurchasesByCard = (cardId: string) => {
    return purchases.filter((p) => p.cardId === cardId);
  };
 
  const getPurchasesByCategory = (category: string) => {
    return purchases.filter((p) => p.category === category);
  };
 
  const getTotalSpentThisMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return purchases
      .filter((p) => new Date(p.date) >= startOfMonth)
      .reduce((sum, p) => sum + p.amount, 0);
  };
 
  return {
    purchases,
    addPurchase,
    deletePurchase,
    getPurchasesByCard,
    getPurchasesByCategory,
    getTotalSpentThisMonth,
  };
}
 