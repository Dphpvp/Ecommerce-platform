# Firebase Setup for Google Auth

## Required Steps:

### 1. Firebase Console Setup
1. Go to https://console.firebase.google.com/
2. Create project or select existing project
3. Click "Add App" → Android
4. Enter package name: `com.vergishop.app`
5. Download `google-services.json`

### 2. Install google-services.json
1. Copy the downloaded `google-services.json` 
2. Replace `frontend/android/app/google-services.json.example`
3. Rename it to just `google-services.json`

### 3. Get OAuth Client IDs
In Firebase Console → Authentication → Sign-in method → Google:
1. **Web client ID** - use this for `REACT_APP_GOOGLE_CLIENT_ID` in Vercel
2. **Android client ID** - automatically configured via google-services.json

### 4. Add SHA-1 Fingerprint (Required for Android)

#### For Debug Build:
```bash
# Windows (in frontend/android directory)
./gradlew signingReport

# Look for "SHA1" under "Variant: debug"
```

#### For Release Build:
```bash
# Generate release keystore (if you don't have one)
keytool -genkey -v -keystore release-key.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000

# Get SHA-1 from your release keystore
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

Add the SHA-1 fingerprint to:
Firebase Console → Project Settings → Your Android App → Add Fingerprint

### 5. Environment Variables

**Vercel (Frontend):**
```
REACT_APP_GOOGLE_CLIENT_ID=your_web_client_id_from_firebase
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
REACT_APP_API_BASE_URL=https://ecommerce-platform-nizy.onrender.com/api
```

**Render (Backend):**
```
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

### 6. Build and Test
```bash
# Build for Android
npm run build:android

# Run on device/emulator
npx cap run android
```

## Important Notes:
- The `google-services.json` file contains your Android client configuration
- Web and Android use different OAuth client IDs from the same Firebase project
- SHA-1 fingerprint is required for Google Sign-In to work on Android
- Debug and release builds need different SHA-1 fingerprints