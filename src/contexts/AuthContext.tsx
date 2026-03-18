import { createContext, useContext, ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  checkBiometricAvailability,
  authenticateWithBiometric,
  type BiometryType,
} from '@/lib/biometricService';

interface AuthContextType {
  isLocked: boolean;
  isPinSet: boolean;
  unlock: (pin: string) => boolean;
  setPin: (pin: string) => void;
  removePin: () => void;
  lock: () => void;
  isBiometricAvailable: boolean;
  isBiometricEnabled: boolean;
  biometryType: BiometryType;
  enableBiometric: () => void;
  disableBiometric: () => void;
  unlockWithBiometric: () => Promise<boolean>;
  pinHint1: string | null;
  pinHint2: string | null;
  setPinWithHints: (pin: string, hint1: string, hint2?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PIN_STORAGE_KEY = 'kredi-pusula-pin-hash';
const BIOMETRIC_ENABLED_KEY = 'kredi-pusula-biometric-enabled';
const PIN_HINT1_KEY = 'kredi-pusula-pin-hint1';
const PIN_HINT2_KEY = 'kredi-pusula-pin-hint2';

function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `kp_${Math.abs(hash).toString(36)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [isPinSet, setIsPinSet] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>('none');
  const [pinHint1, setPinHint1] = useState<string | null>(null);
  const [pinHint2, setPinHint2] = useState<string | null>(null);
  const isPinSetRef = useRef(false);

  // Initialize PIN state + biometric availability
  useEffect(() => {
    const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
    const pinExists = !!storedHash;
    setIsPinSet(pinExists);
    isPinSetRef.current = pinExists;
    if (pinExists) {
      setIsLocked(true);
    }

    const bioEnabled = localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
    setIsBiometricEnabled(bioEnabled);

    setPinHint1(localStorage.getItem(PIN_HINT1_KEY));
    setPinHint2(localStorage.getItem(PIN_HINT2_KEY));

    checkBiometricAvailability().then(({ isAvailable, biometryType: bt }) => {
      setIsBiometricAvailable(isAvailable);
      setBiometryType(bt);
    });
  }, []);

  // Auto-lock on app background (native only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let listener: { remove: () => void } | null = null;

    import('@capacitor/app').then(({ App }) => {
      if (cancelled) return;
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive && isPinSetRef.current) {
          setIsLocked(true);
        }
      }).then((l) => {
        if (cancelled) {
          l.remove();
        } else {
          listener = l;
        }
      });
    });

    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, []);

  const unlock = useCallback((pin: string): boolean => {
    const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
    if (!storedHash) {
      setIsLocked(false);
      return true;
    }
    if (hashPin(pin) === storedHash) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  const setPin = useCallback((pin: string) => {
    localStorage.setItem(PIN_STORAGE_KEY, hashPin(pin));
    setIsPinSet(true);
    isPinSetRef.current = true;
    setIsLocked(false);
  }, []);

  const setPinWithHints = useCallback((pin: string, hint1: string, hint2?: string) => {
    setPin(pin);
    localStorage.setItem(PIN_HINT1_KEY, hint1);
    setPinHint1(hint1);
    if (hint2) {
      localStorage.setItem(PIN_HINT2_KEY, hint2);
      setPinHint2(hint2);
    } else {
      localStorage.removeItem(PIN_HINT2_KEY);
      setPinHint2(null);
    }
  }, [setPin]);

  const removePin = useCallback(() => {
    localStorage.removeItem(PIN_STORAGE_KEY);
    localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    localStorage.removeItem(PIN_HINT1_KEY);
    localStorage.removeItem(PIN_HINT2_KEY);
    setIsPinSet(false);
    isPinSetRef.current = false;
    setIsLocked(false);
    setIsBiometricEnabled(false);
    setPinHint1(null);
    setPinHint2(null);
  }, []);

  const lock = useCallback(() => {
    if (isPinSetRef.current) {
      setIsLocked(true);
    }
  }, []);

  const enableBiometric = useCallback(() => {
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    setIsBiometricEnabled(true);
  }, []);

  const disableBiometric = useCallback(() => {
    localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    setIsBiometricEnabled(false);
  }, []);

  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    const success = await authenticateWithBiometric('Kredy kilidini açın');
    if (success) {
      setIsLocked(false);
    }
    return success;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLocked,
        isPinSet,
        unlock,
        setPin,
        removePin,
        lock,
        isBiometricAvailable,
        isBiometricEnabled,
        biometryType,
        enableBiometric,
        disableBiometric,
        unlockWithBiometric,
        pinHint1,
        pinHint2,
        setPinWithHints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
