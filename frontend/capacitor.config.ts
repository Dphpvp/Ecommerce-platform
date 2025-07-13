import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vergishop.app',
  appName: 'VergiShop',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;