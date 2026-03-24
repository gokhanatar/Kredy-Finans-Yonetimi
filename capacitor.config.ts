import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finansatlas.app',
  appName: 'Kredy - Bütçe & Finans',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F172A',
      showSpinner: false,
      launchAutoHide: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#3B82F6',
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0F172A',
  },
  ios: {
    backgroundColor: '#0F172A',
    contentInset: 'automatic',
    preferredContentMode: 'recommended',
  },
};

export default config;
