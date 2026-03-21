import { useLocalStorage } from './useLocalStorage';

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  hidePersonalFinance?: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
};

export function useUserProfile() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('kredi-pusula-user-profile', DEFAULT_PROFILE);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  return { profile, updateProfile };
}
