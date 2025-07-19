// reCAPTCHA Configuration
// For mobile builds, we need to hardcode the public site key since environment variables
// are not available at runtime in Capacitor apps

const RECAPTCHA_CONFIG = {
  // Your public reCAPTCHA site key (this is safe to expose publicly)
  // You need to set REACT_APP_RECAPTCHA_SITE_KEY in your Vercel environment variables
  SITE_KEY: process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LfX8z8qAAAAAP-Xk8bF7K9mD2NzV1wQhYjZ5L6M', // Test key
  
  // Configuration for different environments
  THEME: 'light',
  SIZE: 'normal',
  
  // Mobile specific settings - use compact size for mobile
  MOBILE_SIZE: 'compact'
};

export default RECAPTCHA_CONFIG;