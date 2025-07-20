// reCAPTCHA Configuration
// For mobile builds, we need to hardcode the public site key since environment variables
// are not available at runtime in Capacitor apps

const RECAPTCHA_CONFIG = {
  // Web reCAPTCHA Site Key - for Vercel/Render deployment
  WEB_SITE_KEY: process.env.REACT_APP_RECAPTCHA_WEB_SITE_KEY || null,
  
  // Mobile reCAPTCHA Site Key - for Android app
  MOBILE_SITE_KEY: process.env.REACT_APP_RECAPTCHA_MOBILE_SITE_KEY || null,
  
  // Configuration for different environments
  THEME: 'light',
  SIZE: 'normal',
  
  // Mobile specific settings - use compact size for mobile
  MOBILE_SIZE: 'compact',
  
  // API endpoint to fetch reCAPTCHA config for mobile apps
  CONFIG_ENDPOINT: '/api/captcha/config'
};

export default RECAPTCHA_CONFIG;