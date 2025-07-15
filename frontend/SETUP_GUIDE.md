# VergiShop Google Credentials Setup Guide

## 🔐 Environment Variables Setup

### **Render (Backend) Environment Variables:**
```
RECAPTCHA_SECRET_KEY=6LxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO
GOOGLE_CLIENT_ID=1234567890-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **Vercel (Frontend) Environment Variables:**
```
REACT_APP_API_BASE_URL=https://ecommerce-platform-nizy.onrender.com/api
REACT_APP_RECAPTCHA_SITE_KEY=6LxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO
REACT_APP_GOOGLE_CLIENT_ID=1234567890-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
REACT_APP_SESSION_SECRET=your-random-session-secret
```

## 📋 Google Console Setup

### **Google reCAPTCHA Console** (https://www.google.com/recaptcha/admin)
**Domains to add:**
- `ecommerce-platform-nizy.onrender.com`
- `vergishop.vercel.app`
- `vs1.vercel.app`

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