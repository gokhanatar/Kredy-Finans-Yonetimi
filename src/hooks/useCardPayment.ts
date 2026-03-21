
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useCallback } from 'react';
import { useFamilySyncedStorage } from './useFamilySyncedStorage';
import { useTransactionHistory } from './useTransactionHistory';
import type { CreditCard } from '@/types/finance';
 
export function useCardPayment(storageKey = 'kredi-pusula-cards') {
  const [cards, setCards] = useFamilySyncedStorage<CreditCard[]>(storageKey, []);
  const { addEntry } = useTransactionHistory();
 
  const getCard = useCallback((id: string) => {
    return cards.find((c) => c.id === id);
  }, [cards]);
 
  const recordCardPayment = useCallback((cardId: string, amount: number) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
 
    const newDebt = Math.max(0, card.currentDebt - amount);
    const newAvailable = card.limit - newDebt;
 
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, currentDebt: newDebt, availableLimit: newAvailable }
          : c
      )
    );
 
    addEntry({
      type: 'card_payment',
      title: `${card.bankName} ${card.cardName} odeme`,
      description: `Kart odemesi kaydedildi`,
      amount,
      category: 'card_payment',
      date: new Date().toISOString(),
    });
  }, [cards, setCards, addEntry]);
 
  return { cards, getCard, recordCardPayment };
}
 