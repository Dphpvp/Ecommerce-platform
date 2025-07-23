package com.vergishop.app;

import android.content.Context;
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

import androidx.webkit.WebViewFeature;
import androidx.webkit.WebSettingsCompat;

import com.getcapacitor.BridgeActivity;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "VergiShop";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
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
        
        // Enhanced settings for reCAPTCHA compatibility
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setSupportZoom(false);
        settings.setDisplayZoomControls(false);
        
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
}