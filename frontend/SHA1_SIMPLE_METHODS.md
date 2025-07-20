# Simple Ways to Get SHA-1 Fingerprint

## Method 1: Using PowerShell (Windows)

Open PowerShell and try:

```powershell
# Method 1a: Direct path
& "C:\Program Files\Java\jdk-11.0.20\bin\keytool.exe" -list -v -alias androiddebugkey -keystore "$env:USERPROFILE\.android\debug.keystore"

# Method 1b: If Java is in PATH
keytool -list -v -alias androiddebugkey -keystore "$env:USERPROFILE\.android\debug.keystore"
```

Password: `android`

## Method 2: Find Your Java Installation

1. Open Command Prompt
2. Type: `where java`
3. This shows where Java is installed
4. Navigate to that folder's `bin` directory
5. Use the full path to keytool

Example:
```cmd
"C:\Program Files\Java\jdk-17.0.8\bin\keytool.exe" -list -v -alias androiddebugkey -keystore "%USERPROFILE%\.android\debug.keystore"
```

## Method 3: Check if Debug Keystore Exists

The debug keystore should be at:
```
C:\Users\razva\.android\debug.keystore
```

If it doesn't exist, Android Studio will create it when you build the first time.

## Method 4: Generate Debug Keystore Manually

If the debug keystore doesn't exist:

```cmd
keytool -genkey -v -keystore "%USERPROFILE%\.android\debug.keystore" -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
```

Then get SHA-1:
```cmd
keytool -list -v -alias androiddebugkey -keystore "%USERPROFILE%\.android\debug.keystore" -storepass android
```

## Method 5: Using Android Studio

If you have Android Studio:

1. Open Android Studio
2. Open your project (`frontend/android`)
3. Open Terminal in Android Studio (bottom panel)
4. Run: `./gradlew signingReport`

## Method 6: Visual Studio Code Terminal

If you have VS Code:

1. Open VS Code in your project folder
2. Open Terminal (Ctrl + `)
3. Navigate to android folder: `cd frontend/android`
4. Run: `./gradlew signingReport`

## Method 7: Manual File Check

1. Check if this file exists: `C:\Users\razva\.android\debug.keystore`
2. If not, build your Android project first:
   ```
   cd frontend/android
   ./gradlew assembleDebug
   ```
3. Then try the keytool command again

## Common Issues:

### "keytool is not recognized"
- Java JDK is not installed or not in PATH
- Download Java JDK from Oracle or OpenJDK
- Add Java bin folder to your PATH environment variable

### "debug.keystore not found"
- Build your Android project first
- Android Studio will generate it automatically

### "gradlew: command not found"
- Make sure you're in the `frontend/android` directory
- Try `.\gradlew` instead of `./gradlew`

## What You're Looking For:

The output should contain:
```
Certificate fingerprints:
         SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

Copy that SHA1 value and add it to Firebase!