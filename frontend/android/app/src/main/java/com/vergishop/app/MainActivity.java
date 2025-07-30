package com.vergishop.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.net.http.SslError;
import android.webkit.SslErrorHandler;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import androidx.webkit.WebViewFeature;
import androidx.webkit.WebSettingsCompat;

import com.getcapacitor.BridgeActivity;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "VergiShop";
    private boolean doubleBackToExitPressedOnce = false;
    private static final int DOUBLE_TAP_INTERVAL = 2000; // 2 seconds
    private static final int NOTIFICATION_PERMISSION_REQUEST = 1001;
    private static final String NOTIFICATION_CHANNEL_ID = "vergishop_notifications";
    private static final String NOTIFICATION_CHANNEL_NAME = "VergiShop Notifications";
    private static final String NOTIFICATION_CHANNEL_DESCRIPTION = "Notifications for orders, promotions, and updates";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Setup notification channels and request permissions
        setupNotifications();
        
        // Check Google Play Services availability
        checkGooglePlayServices();
        
        // Configure WebView after Capacitor initialization
        WebView webView = getBridge().getWebView();
        configureWebViewForRecaptcha(webView);
    }
    
    private void configureWebViewForRecaptcha(WebView webView) {
        if (webView == null) {
            Log.e(TAG, "WebView is null, cannot configure");
            return;
        }
        
        WebSettings settings = webView.getSettings();
        
        // CRITICAL: Enable DOM storage for reCAPTCHA v2
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setJavaScriptEnabled(true);
        
        // Database path for persistent storage
        String databasePath = getApplicationContext()
            .getDir("database", Context.MODE_PRIVATE).getPath();
        settings.setDatabasePath(databasePath);
        
        // Cache and cookie configuration
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Cookie management for Google services
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }
        
        // Mixed content handling for reCAPTCHA domains
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }
        
        // Enhanced settings for reCAPTCHA compatibility and proper pinch-to-zoom
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(true);
        settings.setSupportZoom(true);
        settings.setDisplayZoomControls(false); // Hide default zoom controls, use pinch-to-zoom
        
        // Prevent black spaces during zoom
        settings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            settings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING);
        }
        
        // Security settings
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            settings.setAllowFileAccessFromFileURLs(false);
            settings.setAllowUniversalAccessFromFileURLs(false);
        }
        
        // Google services compatibility
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSaveFormData(false);
        settings.setSavePassword(false);
        settings.setGeolocationEnabled(false);
        
        // Performance optimizations
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        
        // Modern WebView features
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SAFE_BROWSING_ENABLE)) {
            WebSettingsCompat.setSafeBrowsingEnabled(settings, true);
        }
        
        if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
            WebSettingsCompat.setForceDark(settings, WebSettingsCompat.FORCE_DARK_AUTO);
        }
        
        // Enable debugging only in debug builds for security
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        }
        
        // JavaScript interface for reCAPTCHA callbacks
        webView.addJavascriptInterface(new RecaptchaInterface(), "RecaptchaInterface");
        
        setupRecaptchaWebViewClient(webView);
        
        Log.i(TAG, "WebView configured for enhanced reCAPTCHA support");
    }
    
    private void setupRecaptchaWebViewClient(WebView webView) {
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                // Allow reCAPTCHA domains
                if (url.contains("google.com") || url.contains("recaptcha") || 
                    url.contains("gstatic.com") || url.contains("googleusercontent.com")) {
                    return false; // Let WebView handle these URLs
                }
                return super.shouldOverrideUrlLoading(view, request);
            }
            
            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                String url = error.getUrl();
                if (url != null && (url.contains("google.com") || url.contains("recaptcha") || 
                                  url.contains("gstatic.com"))) {
                    Log.w(TAG, "Allowing SSL error for reCAPTCHA domain: " + url);
                    handler.proceed(); // Allow reCAPTCHA SSL
                } else {
                    super.onReceivedSslError(view, handler, error);
                }
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Page finished loading: " + url);
            }
        });
        
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    // Grant permissions for reCAPTCHA functionality
                    request.grant(request.getResources());
                }
            }
            
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                if (consoleMessage != null) {
                    Log.d(TAG, "Console: " + consoleMessage.message() + 
                              " at " + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber());
                }
                return super.onConsoleMessage(consoleMessage);
            }
        });
    }
    
    public class RecaptchaInterface {
        @JavascriptInterface
        public void onRecaptchaSuccess(String token) {
            Log.d(TAG, "reCAPTCHA Success - Token received: " + token.substring(0, Math.min(20, token.length())) + "...");
            // Token can be sent to backend for verification
        }
        
        @JavascriptInterface
        public void onRecaptchaError(String error) {
            Log.e(TAG, "reCAPTCHA Error: " + error);
        }
        
        @JavascriptInterface
        public void onRecaptchaExpired() {
            Log.w(TAG, "reCAPTCHA Expired");
        }
        
        @JavascriptInterface
        public void logMessage(String message) {
            Log.d(TAG, "JS Log: " + message);
        }
    }
    
    private void checkGooglePlayServices() {
        GoogleApiAvailability apiAvailability = GoogleApiAvailability.getInstance();
        int resultCode = apiAvailability.isGooglePlayServicesAvailable(this);
        
        if (resultCode != ConnectionResult.SUCCESS) {
            Log.w(TAG, "Google Play Services not available: " + resultCode);
            if (apiAvailability.isUserResolvableError(resultCode)) {
                apiAvailability.getErrorDialog(this, resultCode, 9000).show();
            }
        } else {
            Log.i(TAG, "Google Play Services available");
        }
    }
    
    @Override
    public void onResume() {
        super.onResume();
        checkGooglePlayServices();
    }
    
    @Override
    public void onBackPressed() {
        WebView webView = getBridge().getWebView();
        
        // First check if web view can go back
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        
        // If we're at the root, implement double tap to exit
        if (doubleBackToExitPressedOnce) {
            super.onBackPressed();
            return;
        }
        
        this.doubleBackToExitPressedOnce = true;
        Toast.makeText(this, "Press back again to exit", Toast.LENGTH_SHORT).show();
        
        // Reset the double tap flag after interval
        new android.os.Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                doubleBackToExitPressedOnce = false;
            }
        }, DOUBLE_TAP_INTERVAL);
    }
    
    private void setupNotifications() {
        Log.i(TAG, "Setting up notifications");
        
        // Create notification channel for Android 8.0 and above
        createNotificationChannel();
        
        // Request notification permission for Android 13 and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestNotificationPermission();
        } else {
            Log.i(TAG, "Notification permission not required for this Android version");
        }
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            
            // Check if channel already exists
            if (notificationManager.getNotificationChannel(NOTIFICATION_CHANNEL_ID) != null) {
                Log.i(TAG, "Notification channel already exists");
                return;
            }
            
            NotificationChannel channel = new NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            );
            
            channel.setDescription(NOTIFICATION_CHANNEL_DESCRIPTION);
            channel.enableLights(true);
            channel.setLightColor(getResources().getColor(R.color.notification_primary));
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 250, 250, 250});
            channel.setShowBadge(true);
            
            notificationManager.createNotificationChannel(channel);
            Log.i(TAG, "Notification channel created successfully");
        }
    }
    
    private void requestNotificationPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) 
            != PackageManager.PERMISSION_GRANTED) {
            
            Log.i(TAG, "Requesting notification permission");
            
            if (ActivityCompat.shouldShowRequestPermissionRationale(this, Manifest.permission.POST_NOTIFICATIONS)) {
                // Show explanation to user
                Toast.makeText(this, "Enable notifications to receive order updates and promotions", Toast.LENGTH_LONG).show();
            }
            
            ActivityCompat.requestPermissions(this, 
                new String[]{Manifest.permission.POST_NOTIFICATIONS}, 
                NOTIFICATION_PERMISSION_REQUEST);
        } else {
            Log.i(TAG, "Notification permission already granted");
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == NOTIFICATION_PERMISSION_REQUEST) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.i(TAG, "Notification permission granted");
                Toast.makeText(this, "Notifications enabled! You'll receive order updates and promotions.", Toast.LENGTH_SHORT).show();
            } else {
                Log.w(TAG, "Notification permission denied");
                Toast.makeText(this, "Notifications disabled. You can enable them later in Settings.", Toast.LENGTH_LONG).show();
            }
        }
    }
}