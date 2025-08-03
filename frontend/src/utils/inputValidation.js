/**
 * Secure Input Validation and Sanitization Utility
 * Prevents XSS, injection attacks, and validates user input
 */

export class InputValidator {
  constructor() {
    // Common patterns for validation
    this.patterns = {
      email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      username: /^[a-zA-Z0-9_-]{3,30}$/,
      phone: /^\+?[\d\s\-\(\)]{7,20}$/,
      strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
    };

    // Dangerous patterns to block
    this.dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ];

    // SQL injection patterns
    this.sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(--|#|\/\*|\*\/)/g,
      /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
      /('|(\\')|('')|(\\")|('\\))/g
    ];

    // Common XSS payloads
    this.xssPatterns = [
      /<[^>]*script[^>]*>/gi,
      /<[^>]*on\w+[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /<[^>]*style[^>]*=.*expression[^>]*>/gi
    ];
  }

  /**
   * Sanitize HTML input to prevent XSS
   */
  sanitizeHtml(input) {
    if (typeof input !== 'string') return '';

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/\\/g, '&#x5C;');
  }

  /**
   * Sanitize text input
   */
  sanitizeText(input, maxLength = 1000) {
    if (typeof input !== 'string') return '';

    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Limit length
    sanitized = sanitized.substring(0, maxLength);
    
    // Trim whitespace
    sanitized = sanitized.trim();

    // Check for dangerous patterns
    if (this.containsDangerousContent(sanitized)) {
      console.warn('Dangerous content detected and removed');
      return this.removeDangerousContent(sanitized);
    }

    return sanitized;
  }

  /**
   * Validate email address
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' };
    }

    email = email.trim().toLowerCase();
    
    if (email.length > 254) {
      return { valid: false, error: 'Email address too long' };
    }

    if (!this.patterns.email.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    // Check for dangerous content
    if (this.containsDangerousContent(email)) {
      return { valid: false, error: 'Invalid email content' };
    }

    return { valid: true, value: email };
  }

  /**
   * Validate username
   */
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username is required' };
    }

    username = username.trim();

    if (username.length < 3 || username.length > 30) {
      return { valid: false, error: 'Username must be 3-30 characters' };
    }

    if (!this.patterns.username.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, underscore, and hyphen' };
    }

    // Check for dangerous content
    if (this.containsDangerousContent(username)) {
      return { valid: false, error: 'Invalid username content' };
    }

    return { valid: true, value: username };
  }

  /**
   * Validate password strength
   */
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }

    if (password.length > 128) {
      return { valid: false, error: 'Password too long' };
    }

    // Check for common weak passwords
    const weakPasswords = [
      'password', '123456', 'qwerty', 'admin', 'letmein',
      'welcome', 'monkey', '1234567890', 'password123'
    ];

    if (weakPasswords.includes(password.toLowerCase())) {
      return { valid: false, error: 'Password is too common' };
    }

    // Check strength requirements
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);

    const strength = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (strength < 3) {
      return { 
        valid: false, 
        error: 'Password must contain at least 3 of: lowercase, uppercase, number, special character' 
      };
    }

    return { valid: true, strength: strength };
  }

  /**
   * Validate phone number
   */
  validatePhone(phone) {
    if (!phone) return { valid: true }; // Optional field

    if (typeof phone !== 'string') {
      return { valid: false, error: 'Invalid phone format' };
    }

    phone = phone.trim();

    if (!this.patterns.phone.test(phone)) {
      return { valid: false, error: 'Invalid phone number format' };
    }

    return { valid: true, value: phone };
  }

  /**
   * Validate URL
   */
  validateUrl(url) {
    if (!url || typeof url !== 'string') {
      return { valid: false, error: 'URL is required' };
    }

    url = url.trim();

    if (!this.patterns.url.test(url)) {
      return { valid: false, error: 'Invalid URL format' };
    }

    // Additional security check
    if (url.includes('javascript:') || url.includes('data:')) {
      return { valid: false, error: 'Unsafe URL scheme' };
    }

    return { valid: true, value: url };
  }

  /**
   * Check if content contains dangerous patterns
   */
  containsDangerousContent(input) {
    if (typeof input !== 'string') return false;

    // Check for XSS patterns
    for (const pattern of this.xssPatterns) {
      if (pattern.test(input)) return true;
    }

    // Check for SQL injection patterns
    for (const pattern of this.sqlPatterns) {
      if (pattern.test(input)) return true;
    }

    // Check for dangerous HTML patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(input)) return true;
    }

    return false;
  }

  /**
   * Remove dangerous content
   */
  removeDangerousContent(input) {
    if (typeof input !== 'string') return '';

    let sanitized = input;

    // Remove XSS patterns
    for (const pattern of this.xssPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    // Remove SQL injection patterns
    for (const pattern of this.sqlPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    // Remove dangerous HTML patterns
    for (const pattern of this.dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    return sanitized.trim();
  }

  /**
   * Validate and sanitize login credentials
   */
  validateLoginCredentials(credentials) {
    const errors = {};
    const sanitized = {};

    // Validate identifier (email or username)
    if (!credentials.identifier) {
      errors.identifier = 'Email or username is required';
    } else {
      const identifier = this.sanitizeText(credentials.identifier, 254);
      
      // Try to determine if it's an email or username
      if (identifier.includes('@')) {
        const emailValidation = this.validateEmail(identifier);
        if (!emailValidation.valid) {
          errors.identifier = emailValidation.error;
        } else {
          sanitized.identifier = emailValidation.value;
        }
      } else {
        const usernameValidation = this.validateUsername(identifier);
        if (!usernameValidation.valid) {
          errors.identifier = usernameValidation.error;
        } else {
          sanitized.identifier = usernameValidation.value;
        }
      }
    }

    // Validate password (don't sanitize, just validate)
    if (!credentials.password) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = this.validatePassword(credentials.password);
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.error;
      } else {
        sanitized.password = credentials.password; // Don't modify password
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Validate and sanitize registration data
   */
  validateRegistrationData(data) {
    const errors = {};
    const sanitized = {};

    // Username
    const usernameValidation = this.validateUsername(data.username);
    if (!usernameValidation.valid) {
      errors.username = usernameValidation.error;
    } else {
      sanitized.username = usernameValidation.value;
    }

    // Email
    const emailValidation = this.validateEmail(data.email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.error;
    } else {
      sanitized.email = emailValidation.value;
    }

    // Password
    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.error;
    } else {
      sanitized.password = data.password;
    }

    // Full name
    if (!data.full_name) {
      errors.full_name = 'Full name is required';
    } else {
      sanitized.full_name = this.sanitizeText(data.full_name, 100);
      if (sanitized.full_name.length < 2) {
        errors.full_name = 'Full name must be at least 2 characters';
      }
    }

    // Phone (optional)
    if (data.phone) {
      const phoneValidation = this.validatePhone(data.phone);
      if (!phoneValidation.valid) {
        errors.phone = phoneValidation.error;
      } else {
        sanitized.phone = phoneValidation.value;
      }
    }

    // Address (optional)
    if (data.address) {
      sanitized.address = this.sanitizeText(data.address, 500);
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      sanitized
    };
  }
}

// Export singleton instance
export default new InputValidator();