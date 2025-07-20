package com.vergishop.app;

import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.webkit.WebViewFeature;
import androidx.webkit.WebSettingsCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.safetynet.SafetyNet;
import com.google.android.recaptcha.Recaptcha;
import com.google.android.recaptcha.RecaptchaAction;
import com.google.android.recaptcha.RecaptchaClient;
import com.google.android.recaptcha.RecaptchaException;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "VergiShop";
    private RecaptchaClient recaptchaClient;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register native reCAPTCHA plugin
        registerPlugin(RecaptchaPlugin.class);
        
        // Check Google Play Services availability
        checkGooglePlayServices();
        
        // Initialize native reCAPTCHA client
        initializeRecaptchaClient();
        
        // Configure WebView for enhanced reCAPTCHA and Google Auth support
        configureWebView();
    }
    
    private void checkGooglePlayServices() {
        GoogleApiAvailability apiAvailability = GoogleApiAvailability.getInstance();
        int resultCode = apiAvailability.isGooglePlayServicesAvailable(this);
        
        if (resultCode != ConnectionResult.SUCCESS) {
            android.util.Log.w(TAG, "Google Play Services not available: " + resultCode);
            if (apiAvailability.isUserResolvableError(resultCode)) {
                // User can resolve this error
                apiAvailability.getErrorDialog(this, resultCode, 9000).show();
            }
        } else {
            android.util.Log.i(TAG, "Google Play Services available");
        }
    }
    
    private void configureWebView() {
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings webSettings = webView.getSettings();
            
            // Core WebView settings for modern web apps
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setDatabaseEnabled(true);
            webSettings.setAllowContentAccess(true);
            webSettings.setAllowFileAccess(true);
            
            // Enhanced security settings for captcha
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.JELLY_BEAN) {
                webSettings.setAllowFileAccessFromFileURLs(false);
                webSettings.setAllowUniversalAccessFromFileURLs(false);
            }
            
            // Network and caching settings
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
            webSettings.setGeolocationEnabled(false);
            
            // Enhanced reCAPTCHA support
            webSettings.setUserAgentString(webSettings.getUserAgentString() + " VergiShop-Mobile/2.0 (Android)");
            webSettings.setLoadWithOverviewMode(true);
            webSettings.setUseWideViewPort(true);
            webSettings.setBuiltInZoomControls(false);
            webSettings.setSupportZoom(false);
            webSettings.setDisplayZoomControls(false);
            
            // Google services compatibility
            webSettings.setMediaPlaybackRequiresUserGesture(false);
            webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
            webSettings.setSaveFormData(false);
            webSettings.setSavePassword(false);
            
            // Enhanced cookie management for Google services
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
                cookieManager.setAcceptThirdPartyCookies(webView, true);
                cookieManager.setAcceptCookie(true);
            }
            
            // Modern WebView features
            if (WebViewFeature.isFeatureSupported(WebViewFeature.SAFE_BROWSING_ENABLE)) {
                WebSettingsCompat.setSafeBrowsingEnabled(webSettings, true);
            }
            
            if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
                // Auto dark mode support
                WebSettingsCompat.setForceDark(webSettings, WebSettingsCompat.FORCE_DARK_AUTO);
            }
            
            // Performance optimizations
            webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH);
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
            
            // Enable debugging only in debug builds
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
                boolean isDebuggable = (getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0;
                WebView.setWebContentsDebuggingEnabled(isDebuggable);
            }
            
            android.util.Log.i(TAG, "WebView configured for enhanced captcha and auth support");
        }
    }
    
    private void initializeRecaptchaClient() {
        // reCAPTCHA key will be provided by the WebView when needed
        // This avoids hardcoding keys in the APK
        android.util.Log.i(TAG, "Native reCAPTCHA client ready for initialization");
    }
    
    // Method to execute reCAPTCHA action (can be called from WebView)
    public void executeRecaptchaAction(String action, RecaptchaActionCallback callback) {
        if (recaptchaClient == null) {
            callback.onError("reCAPTCHA client not initialized");
            return;
        }
        
        new Thread(() -> {
            try {
                RecaptchaAction recaptchaAction;
                switch (action.toLowerCase()) {
                    case "login":
                        recaptchaAction = RecaptchaAction.LOGIN;
                        break;
                    case "signup":
                        recaptchaAction = RecaptchaAction.SIGNUP;
                        break;
                    default:
                        recaptchaAction = RecaptchaAction.custom(action);
                        break;
                }
                
                // Execute reCAPTCHA with 10 second timeout
                String token = recaptchaClient.execute(recaptchaAction, 10000L);
                callback.onSuccess(token);
                android.util.Log.i(TAG, "reCAPTCHA token generated successfully");
                
            } catch (RecaptchaException e) {
                android.util.Log.e(TAG, "reCAPTCHA execution failed", e);
                callback.onError("reCAPTCHA execution failed: " + e.getMessage());
            }
        }).start();
    }
    
    // Interface for reCAPTCHA callbacks
    public interface RecaptchaActionCallback {
        void onSuccess(String token);
        void onError(String error);
    }
    
    @Override
    public void onResume() {
        super.onResume();
        // Ensure Google Play Services are still available
        checkGooglePlayServices();
    }
}
