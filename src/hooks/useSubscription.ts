
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useState, useCallback } from 'react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { startTrial as doStartTrial, getTrialInfo, TRIAL_DAYS, hasUsedTrial } from '@/lib/purchases';
import { toast } from '@/hooks/use-toast';
 
export function useSubscription() {
  const { isPremium, isTrialActive, trialDaysLeft, checkPremiumAccess } = useSubscriptionContext();
  const [isLoading, setIsLoading] = useState(false);
 
  const trialInfo = getTrialInfo();
 
  const startTrial = useCallback(async () => {
    if (hasUsedTrial()) {
      toast({
        title: 'Deneme Daha Önce Kullanıldı',
        description: 'Ücretsiz deneme hakkınızı daha önce kullandınız.',
        variant: 'destructive',
      });
      return;
    }
 
    setIsLoading(true);
    doStartTrial();
    await checkPremiumAccess();
    setIsLoading(false);
 
    toast({
      title: `${TRIAL_DAYS} Gün Ücretsiz Deneme Başladı!`,
      description: 'Tüm premium özelliklere erişebilirsiniz.',
    });
  }, [checkPremiumAccess]);
 
  return {
    isPremium,
    isLoading,
    isTrialActive,
    trialDaysLeft,
    trialInfo,
    startTrial,
    refresh: checkPremiumAccess,
  };
}
 