import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'kredi-pusula-onboarding-completed';
const PERMISSIONS_KEY = 'kredi-pusula-permissions-completed';

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [hasCompletedPermissions, setHasCompletedPermissions] = useState<boolean | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(completed === 'true');
    const permCompleted = localStorage.getItem(PERMISSIONS_KEY);
    setHasCompletedPermissions(permCompleted === 'true');
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompletedOnboarding(true);
  }, []);

  const completePermissions = useCallback(() => {
    localStorage.setItem(PERMISSIONS_KEY, 'true');
    setHasCompletedPermissions(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);
    setHasCompletedOnboarding(false);
    setHasCompletedPermissions(false);
  }, []);

  return {
    hasCompletedOnboarding,
    hasCompletedPermissions,
    isLoading: hasCompletedOnboarding === null,
    completeOnboarding,
    completePermissions,
    resetOnboarding,
  };
}
