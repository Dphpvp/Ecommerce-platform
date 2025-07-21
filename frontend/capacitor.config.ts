import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vergishop.app',
  appName: 'VergiShop',
  webDir: 'build',
  server: {
    url: "https://vergishop.vercel.app",
    cleartext: false,
    allowNavigation: [
      "*.google.com",
      "*.gstatic.com", 
      "*.googleusercontent.com",
      "*.recaptcha.net",
      "vergishop.vercel.app",
      "vs1.vercel.app",
      "*.vercel.app",
      "*.onrender.com"
    ],
    androidScheme: "https"
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#ffffff',
      showSpinner: true,
      spinnerColor: '#007bff'
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff'
    },
    CapacitorHttp: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    },
    Toast: {
      duration: 'short'
    },
    App: {
      handleUrlOpen: true
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: process.env.REACT_APP_GOOGLE_SERVER_CLIENT_ID || '',
      forceCodeForRefreshToken: true
    }
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
    minWebViewVersion: 60,
    backgroundColor: "#ffffff",
    captureInput: false,
    initialFocus: true
  },
  ios: {
    scheme: 'VergiShop',
    contentInset: 'automatic'
  }
};

export default config;