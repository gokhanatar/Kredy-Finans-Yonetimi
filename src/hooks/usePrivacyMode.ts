import { usePrivacyModeContext } from '@/contexts/PrivacyModeContext';

export function usePrivacyMode() {
  return usePrivacyModeContext();
}
