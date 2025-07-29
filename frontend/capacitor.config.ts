import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vergishop.app',
  appName: 'VergiShop',
  webDir: 'build',
  server: {
    // Production server configuration for APK builds
    url: process.env.NODE_ENV === 'production' ? undefined : "https://vergishop.vercel.app",
    cleartext: false,
    allowNavigation: [
      "*.google.com",
      "*.gstatic.com", 
      "*.googleusercontent.com",
      "*.recaptcha.net",
      "vergishop.vercel.app",
      "vs1.vercel.app",
      "*.vercel.app",
      "*.onrender.com",
      "ecommerce-platform-nizy.onrender.com"
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
      enabled: true,
      // Enable better HTTP handling for production APK builds
      default: {
        timeout: 30000,
        retries: 2,
        rejectUnauthorized: true
      }
    },
    CapacitorCookies: {
      enabled: true,
      // Improve cookie handling for cross-origin requests
      sameSite: 'none',
      secure: true
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
    initialFocus: true,
    // Enhanced network configuration for production APK builds
    networkSecurityConfig: {
      cleartextTrafficPermitted: false
    },
    // Ensure proper database and API connectivity
    usesCleartextTraffic: false,
    // Enable hardware acceleration for better performance
    hardwareAccelerated: true
  },
  ios: {
    scheme: 'VergiShop',
    contentInset: 'automatic'
  }
};

export default config;