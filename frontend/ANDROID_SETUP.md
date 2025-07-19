# Android Mobile App Setup Guide

## Google Login Setup for Android

### 1. Install Required Capacitor Plugin

```bash
npm install @codetrix-studio/capacitor-google-auth
npx cap sync android
```

### Important: Common Crash Fixes

**If Google login crashes the app:**

1. **Check Google Play Services**: Ensure Google Play Services is installed and updated on the device
2. **Verify SHA-1 fingerprints**: Add debug and release SHA-1 fingerprints to Firebase project
3. **Check google-services.json**: Ensure the file is in the correct location
4. **Clear app data**: Uninstall and reinstall the app completely

### 2. Update Capacitor Configuration

Add to `capacitor.config.ts`:

```typescript
plugins: {
  GoogleAuth: {
    scopes: ['profile', 'email'],
    serverClientId: 'YOUR_GOOGLE_SERVER_CLIENT_ID',
    forceCodeForRefreshToken: true
  }
}
```

### 3. Update Android Configuration

Add to `android/app/src/main/java/com/vergishop/app/MainActivity.java`:

```java
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Register plugins
    this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
      add(GoogleAuth.class);
    }});
  }
}
```

### 4. Add Google Services Configuration

1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/google-services.json`
3. Update `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}
```

### 5. Environment Variables

Add to `.env`:
```
REACT_APP_GOOGLE_CLIENT_ID=your_web_client_id
REACT_APP_GOOGLE_SERVER_CLIENT_ID=your_server_client_id
```

## Captcha Setup for Android

The mobile captcha system is already implemented and will:

1. **Detect Android Platform**: Automatically identify Android WebView
2. **Generate Mobile Token**: Create platform-specific authentication token
3. **Backend Validation**: Verify mobile tokens on the server
4. **Fallback Support**: Allow mobile platforms without reCAPTCHA

### Mobile Captcha Features:

- ✅ **Android-safe encoding**: Handles WebView limitations
- ✅ **Platform detection**: Automatically detects mobile environment  
- ✅ **Token generation**: Creates secure mobile authentication tokens
- ✅ **Backend integration**: Server validates mobile tokens
- ✅ **Fallback handling**: Works without reCAPTCHA configuration

## Build and Deploy

```bash
# Build the web assets
npm run build

# Sync with Android project
npx cap sync android

# Open Android Studio
npx cap open android
```

## Troubleshooting

### Google Login Issues:
1. Verify `google-services.json` is in correct location
2. Check SHA-1 fingerprints are added to Firebase
3. Ensure correct client IDs in environment variables

### Captcha Issues:
1. **Captcha not showing**: Check console for React errors, ensure MobileCaptcha.css is loaded
2. **Platform detection**: Open Chrome DevTools → Console, check `platformDetection.isMobile`
3. **Token generation**: Verify `mobileCaptcha.generateToken()` returns valid token
4. **Backend validation**: Check server logs for mobile token acceptance

### Debug Commands:
```javascript
// In browser console (Chrome DevTools connected to WebView)
console.log('Platform:', platformDetection.platform);
console.log('Is Mobile:', platformDetection.isMobile); 
console.log('Capacitor:', window.Capacitor);
console.log('Mobile token:', mobileCaptcha.generateToken());
```

### WebView Issues:
1. Enable debugging: `webContentsDebuggingEnabled: true` in capacitor.config.ts
2. Use Chrome DevTools to debug WebView
3. Check platform headers in network requests