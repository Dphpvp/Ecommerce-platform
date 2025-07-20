import os

# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")  # Web reCAPTCHA secret key
RECAPTCHA_MOBILE_SECRET_KEY = os.getenv("RECAPTCHA_MOBILE_SECRET_KEY")  # Mobile reCAPTCHA secret key
RECAPTCHA_SITE_KEY = os.getenv("REACT_APP_RECAPTCHA_SITE_KEY")  # For reference (deprecated)
RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

# Verification settings
VERIFICATION_TIMEOUT = 10.0  # seconds
ALLOW_LOCALHOST = os.getenv("ENVIRONMENT") == "development"

# Error messages
CAPTCHA_ERROR_MESSAGES = {
    "missing-input-secret": "The secret parameter is missing",
    "invalid-input-secret": "The secret parameter is invalid or malformed",
    "missing-input-response": "The response parameter is missing",
    "invalid-input-response": "The response parameter is invalid or malformed",
    "bad-request": "The request is invalid or malformed",
    "timeout-or-duplicate": "The response is no longer valid"
}