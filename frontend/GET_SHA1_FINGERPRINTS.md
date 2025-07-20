# How to Get SHA-1 Fingerprints for Firebase

## Method 1: Get Debug SHA-1 (Easiest - for testing)

### Windows:
```bash
# Navigate to your android project
cd frontend/android

# Run gradle command to get signing report
./gradlew signingReport
```

### Alternative if gradlew doesn't work:
```bash
# Use keytool to get debug keystore SHA-1
keytool -list -v -alias androiddebugkey -keystore %USERPROFILE%\.android\debug.keystore
# Password is: android
```

Look for output like:
```
SHA1: A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6:Q7:R8:S9:T0
```

## Method 2: Get Release SHA-1 (for production)

### If you don't have a release keystore yet:
```bash
# Create release keystore
keytool -genkey -v -keystore release-key.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000

# Fill in the details when prompted:
# - First and last name: Your name
# - Organization unit: Your company/team
# - Organization: Your company
# - City: Your city
# - State: Your state
# - Country code: US (or your country)
# - Password: Create a strong password (SAVE THIS!)
```

### Get SHA-1 from your release keystore:
```bash
keytool -list -v -keystore release-key.keystore -alias release
# Enter the password you created above
```

## Method 3: Use Android Studio (if you have it)

1. Open your project in Android Studio
2. Click **Gradle** panel (right side)
3. Navigate to: **app** → **Tasks** → **android** → **signingReport**
4. Double-click **signingReport**
5. Check the **Run** tab for SHA-1 fingerprints

## Adding SHA-1 to Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click ⚙️ **Project Settings**
4. Scroll down to **Your apps** section
5. Find your Android app (`com.vergishop.app`)
6. Click **Add fingerprint**
7. Paste your SHA-1 fingerprint
8. Click **Save**

## Important Notes:

- **Debug SHA-1**: Use for development/testing
- **Release SHA-1**: Use for production APK
- **Add both**: You can add multiple fingerprints to the same Firebase app
- **No spaces**: Remove any spaces from the SHA-1 when pasting into Firebase

## Verification:
After adding SHA-1 fingerprints, Google Sign-In should work on your Android app. If it doesn't work:
1. Make sure `google-services.json` is in the correct location
2. Verify the package name matches exactly: `com.vergishop.app`
3. Clean and rebuild your Android project