package com.vergishop.app;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.recaptcha.Recaptcha;
import com.google.android.recaptcha.RecaptchaAction;
import com.google.android.recaptcha.RecaptchaClient;
import com.google.android.recaptcha.RecaptchaException;

@CapacitorPlugin(name = "NativeRecaptcha")
public class RecaptchaPlugin extends Plugin {
    private static final String TAG = "RecaptchaPlugin";
    private RecaptchaClient recaptchaClient;
    
    @PluginMethod
    public void initialize(PluginCall call) {
        String siteKey = call.getString("siteKey");
        
        if (siteKey == null || siteKey.isEmpty()) {
            call.reject("Site key is required");
            return;
        }
        
        Log.i(TAG, "Initializing native reCAPTCHA with key from environment variables");
        
        new Thread(() -> {
            try {
                recaptchaClient = Recaptcha.fetchClient(getContext().getApplicationContext(), siteKey);
                Log.i(TAG, "Native reCAPTCHA client initialized successfully with key: " + 
                     siteKey.substring(0, Math.min(20, siteKey.length())) + "...");
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "reCAPTCHA client initialized");
                call.resolve(result);
                
            } catch (RecaptchaException e) {
                Log.e(TAG, "Failed to initialize reCAPTCHA client", e);
                call.reject("Failed to initialize reCAPTCHA: " + e.getMessage());
            }
        }).start();
    }
    
    @PluginMethod
    public void execute(PluginCall call) {
        String action = call.getString("action", "login");
        Long timeout = call.getLong("timeout", 10000L);
        
        if (recaptchaClient == null) {
            call.reject("reCAPTCHA client not initialized. Call initialize first.");
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
                
                String token = recaptchaClient.execute(recaptchaAction, timeout);
                Log.i(TAG, "reCAPTCHA token generated successfully for action: " + action);
                
                JSObject result = new JSObject();
                result.put("token", token);
                result.put("action", action);
                call.resolve(result);
                
            } catch (RecaptchaException e) {
                Log.e(TAG, "reCAPTCHA execution failed for action: " + action, e);
                call.reject("reCAPTCHA execution failed: " + e.getMessage());
            }
        }).start();
    }
    
    @PluginMethod
    public void isReady(PluginCall call) {
        JSObject result = new JSObject();
        result.put("ready", recaptchaClient != null);
        call.resolve(result);
    }
}