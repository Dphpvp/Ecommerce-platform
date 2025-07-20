// reCAPTCHA Configuration
// For mobile builds, we need to hardcode the public site key since environment variables
// are not available at runtime in Capacitor apps

const RECAPTCHA_CONFIG = {
  // reCAPTCHA Site Key - fetched from Vercel environment at build time
  // For Android: Key will be fetched from your backend API at runtime (more secure)
  SITE_KEY: process.env.REACT_APP_RECAPTCHA_SITE_KEY || null,
  
  // Configuration for different environments
  THEME: 'light',
  SIZE: 'normal',
  
  // Mobile specific settings - use compact size for mobile
  MOBILE_SIZE: 'compact',
  
  // API endpoint to fetch reCAPTCHA config for mobile apps
  CONFIG_ENDPOINT: '/api/captcha/config'
};

export default RECAPTCHA_CONFIG;