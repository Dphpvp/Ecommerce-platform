import os

# reCAPTCHA Configuration - DISABLED
# All reCAPTCHA functionality temporarily disabled - will be reimplemented fresh for web-only

# RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")  # DISABLED
# RECAPTCHA_MOBILE_SECRET_KEY = os.getenv("RECAPTCHA_MOBILE_SECRET_KEY")  # DISABLED
# RECAPTCHA_SITE_KEY = os.getenv("REACT_APP_RECAPTCHA_SITE_KEY")  # DISABLED
# RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"  # DISABLED

# Placeholder values to prevent import errors
RECAPTCHA_SECRET_KEY = None
RECAPTCHA_MOBILE_SECRET_KEY = None  
RECAPTCHA_SITE_KEY = None
RECAPTCHA_VERIFY_URL = None

# Verification settings - DISABLED
VERIFICATION_TIMEOUT = 10.0  # seconds
ALLOW_LOCALHOST = os.getenv("ENVIRONMENT") == "development"

# Error messages - DISABLED
CAPTCHA_ERROR_MESSAGES = {}