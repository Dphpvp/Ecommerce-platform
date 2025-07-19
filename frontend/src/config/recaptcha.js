// reCAPTCHA Configuration
// For mobile builds, we need to hardcode the public site key since environment variables
// are not available at runtime in Capacitor apps

const RECAPTCHA_CONFIG = {
  // Your public reCAPTCHA site key (this is safe to expose publicly)
  SITE_KEY: process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeaQ2ErAAAAALD_0aWs2IUQzCJvz9o7mfTSzplx', // Replace with your real site key
  
  // Fallback site key for development/testing
  // Replace the fallback key above with your actual public reCAPTCHA site key
  // Get it from: https://www.google.com/recaptcha/admin
};

export default RECAPTCHA_CONFIG;