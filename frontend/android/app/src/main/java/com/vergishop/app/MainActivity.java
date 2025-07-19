package com.vergishop.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure WebView for reCAPTCHA and Google Auth support
        if (bridge != null && bridge.getWebView() != null) {
            WebSettings webSettings = bridge.getWebView().getSettings();
            
            // Core WebView settings
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setDatabaseEnabled(true);
            webSettings.setAllowContentAccess(true);
            webSettings.setAllowFileAccess(true);
            webSettings.setAllowFileAccessFromFileURLs(true);
            webSettings.setAllowUniversalAccessFromFileURLs(true);
            
            // Network and security settings
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
            webSettings.setGeolocationEnabled(false);
            
            // reCAPTCHA specific settings
            webSettings.setUserAgentString(webSettings.getUserAgentString() + " VergiShop-Mobile/1.0");
            webSettings.setLoadWithOverviewMode(true);
            webSettings.setUseWideViewPort(true);
            webSettings.setBuiltInZoomControls(false);
            webSettings.setSupportZoom(false);
            
            // Additional settings for Google reCAPTCHA
            webSettings.setMediaPlaybackRequiresUserGesture(false);
            webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
            
            // Enable third-party cookies for Google services
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(bridge.getWebView(), true);
            }
            
            // Enable debugging (remove in production)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
                android.webkit.WebView.setWebContentsDebuggingEnabled(true);
            }
        }
    }
}
