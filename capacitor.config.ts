import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kewani.mymoney',
  appName: 'MyMoney',
  webDir: 'public',
  server: {
    url: 'https://mymoney-pi.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'never',
  },
};

export default config;
