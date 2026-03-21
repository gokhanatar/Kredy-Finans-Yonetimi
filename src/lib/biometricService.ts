
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { Capacitor } from '@capacitor/core';
 
type NativeBiometricPlugin = {
  isAvailable: () => Promise<{ isAvailable: boolean; biometryType: number }>;
  verifyIdentity: (options: { reason: string }) => Promise<void>;
};
 
let plugin: NativeBiometricPlugin | null = null;
 
async function getPlugin(): Promise<NativeBiometricPlugin> {
  if (!plugin) {
    const mod = await import('@capgo/capacitor-native-biometric');
    plugin = mod.NativeBiometric as NativeBiometricPlugin;
  }
  return plugin;
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
    await bio.verifyIdentity({ reason });
    return true;
  } catch {
    return false;
  }
}
 