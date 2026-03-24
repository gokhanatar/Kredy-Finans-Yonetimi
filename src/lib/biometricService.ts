import { Capacitor } from '@capacitor/core';

type NativeBiometricPlugin = {
  isAvailable: () => Promise<{ isAvailable: boolean; biometryType: number }>;
  verifyIdentity: (options: { reason: string }) => Promise<void>;
};

let plugin: NativeBiometricPlugin | null = null;
let pluginLoadFailed = false;

async function getPlugin(): Promise<NativeBiometricPlugin | null> {
  if (pluginLoadFailed) return null;
  if (plugin) return plugin;
  try {
    const mod = await import('@capgo/capacitor-native-biometric');
    if (mod?.NativeBiometric) {
      plugin = mod.NativeBiometric as NativeBiometricPlugin;
      return plugin;
    }
    pluginLoadFailed = true;
    return null;
  } catch {
    pluginLoadFailed = true;
    return null;
  }
}

export type BiometryType = 'face' | 'fingerprint' | 'none';

export interface BiometricAvailability {
  isAvailable: boolean;
  biometryType: BiometryType;
}

export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  if (!Capacitor.isNativePlatform()) {
    return { isAvailable: false, biometryType: 'none' };
  }
  try {
    const bio = await getPlugin();
    if (!bio) return { isAvailable: false, biometryType: 'none' as BiometryType };
    const result = await bio.isAvailable();
    let biometryType: BiometryType = 'none';
    if (result.biometryType === 1 || result.biometryType === 3) {
      biometryType = 'fingerprint';
    } else if (result.biometryType === 2 || result.biometryType === 4) {
      biometryType = 'face';
    }
    return {
      isAvailable: result.isAvailable,
      biometryType: result.isAvailable ? biometryType : 'none',
    };
  } catch {
    return { isAvailable: false, biometryType: 'none' };
  }
}

export async function authenticateWithBiometric(reason: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const bio = await getPlugin();
    if (!bio) return false;
    await bio.verifyIdentity({ reason });
    return true;
  } catch {
    return false;
  }
}
