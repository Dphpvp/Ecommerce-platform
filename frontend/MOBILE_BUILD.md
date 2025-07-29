# Mobile Android APK Build Guide

## Prerequisites
- Node.js 16+ installed
- Android Studio with SDK 33+
- Java JDK 17+
- Capacitor CLI: `npm install -g @capacitor/cli`

## Production APK Build Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Build React App for Production
```bash
npm run build
```

### 3. Sync Capacitor
```bash
npx cap sync android
```

### 4. Open Android Studio
```bash
npx cap open android
```

### 5. Configure for Production in Android Studio
- Set `buildType` to `release`
- Ensure `productionBuildType "release"` is set
- Configure signing certificate

### 6. Build APK
- In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
- Or via command line: `./gradlew assembleRelease` (from android/ directory)

## Configuration Changes Made

### Capacitor Config Updates
- **Database Connectivity**: Removed development server URL for production builds
- **HTTP Configuration**: Enhanced timeout and retry settings
- **Cookie Handling**: Improved cross-origin cookie management
- **Network Security**: Disabled cleartext traffic for production

### Mobile UI Improvements
- **Logo Size**: Increased to 56px for better visibility
- **App Name**: Added animated gradient styling (blue → purple → pink)
- **Navigation**: Mobile-optimized with slide-out menu
- **Touch Targets**: 44px minimum for accessibility

## Testing Checklist

### Database Connectivity
- [ ] API requests work without development server
- [ ] Authentication flows properly
- [ ] Data persistence works offline
- [ ] Google OAuth functions correctly

### UI/UX
- [ ] Logo displays at proper size
- [ ] App name shows gradient animation
- [ ] Navigation menu slides smoothly
- [ ] Touch targets are appropriately sized
- [ ] All buttons and links are accessible

### Performance
- [ ] App launches in under 3 seconds
- [ ] Navigation is smooth (60fps)
- [ ] Images load efficiently
- [ ] No memory leaks during extended use

## Environment Variables for Production

Ensure these are set in your build environment:
```
REACT_APP_API_BASE_URL=https://ecommerce-platform-nizy.onrender.com/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_SERVER_CLIENT_ID=your_google_server_client_id
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_key
NODE_ENV=production
```

## Troubleshooting

### Database Connection Issues
- Verify API_BASE_URL points to production server
- Check network security config in AndroidManifest.xml
- Ensure HTTPS is properly configured

### UI Not Showing Mobile Version
- Clear app data and reinstall
- Verify platform detection is working
- Check browser dev tools for mobile view

### Build Failures
- Clean project: `npx cap clean android`
- Remove node_modules and reinstall
- Update Capacitor: `npm update @capacitor/android`

## File Locations
- **APK Output**: `android/app/build/outputs/apk/release/`
- **Logs**: `adb logcat | grep VergiShop`
- **Config**: `capacitor.config.ts`