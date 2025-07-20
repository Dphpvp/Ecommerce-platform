# VergiShop Google Credentials Setup Guide

## 🔐 Environment Variables Setup

### **Render (Backend) Environment Variables:**
```
RECAPTCHA_SECRET_KEY=6LxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO           # Web reCAPTCHA secret key
RECAPTCHA_MOBILE_SECRET_KEY=6LxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO    # Mobile reCAPTCHA secret key  
GOOGLE_CLIENT_ID=1234567890-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **Vercel (Frontend) Environment Variables:**
```
REACT_APP_API_BASE_URL=https://ecommerce-platform-nizy.onrender.com/api
REACT_APP_RECAPTCHA_WEB_SITE_KEY=6LxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO      # Web reCAPTCHA site key
REACT_APP_RECAPTCHA_MOBILE_SITE_KEY=6LxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO   # Mobile reCAPTCHA site key
REACT_APP_GOOGLE_CLIENT_ID=1234567890-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
REACT_APP_SESSION_SECRET=your-random-session-secret
```

## 📋 Google Console Setup

### **Google reCAPTCHA Console** (https://www.google.com/recaptcha/admin)

**Create TWO reCAPTCHA Keys:**

**1. Web Platform Key:**
- Platform: Web
- Domains: `ecommerce-platform-nizy.onrender.com`, `vergishop.vercel.app`, `vs1.vercel.app`
- Use site key for `REACT_APP_RECAPTCHA_WEB_SITE_KEY`
- Use secret key for `RECAPTCHA_SECRET_KEY`

**2. Android Platform Key:**
- Platform: Android  
- Package name: `com.vergishop.app`
- Use site key for `REACT_APP_RECAPTCHA_MOBILE_SITE_KEY`
- Use secret key for `RECAPTCHA_MOBILE_SECRET_KEY`

### **Google Cloud Console** (https://console.cloud.google.com/)
**Authorized JavaScript origins:**
- `https://ecommerce-platform-nizy.onrender.com`
- `https://vergishop.vercel.app`
- `https://vs1.vercel.app`

## 🚀 Deployment Steps

1. **Set up Google credentials** (above)
2. **Add environment variables** to Render and Vercel
3. **Deploy to both platforms**
4. **Test login functionality**

## 🧪 Testing

### **Features to test:**
- ✅ reCAPTCHA loads on login/register pages
- ✅ Google "Sign in with Google" button appears
- ✅ Regular login form works with reCAPTCHA
- ✅ Google OAuth login works
- ✅ All functionality works on both domains

### **Common issues:**
- **reCAPTCHA not loading:** Check site key and domain configuration
- **Google login not working:** Check client ID and authorized origins
- **CORS errors:** Ensure all domains are properly configured

## 📱 Mobile App

The Android app will connect to your Render backend and should work with the same credentials since it uses the web view for login.