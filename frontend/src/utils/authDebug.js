/**
 * Debug utility for authentication issues
 */

export const debugLogin = (loginData) => {
  console.group('🔍 LOGIN DEBUG');
  console.log('Frontend Data:', {
    identifier: loginData.username,
    password: '***' + loginData.password.slice(-3),
    passwordLength: loginData.password.length,
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(loginData.password),
    hasNumbers: /\d/.test(loginData.password),
    hasUppercase: /[A-Z]/.test(loginData.password),
    hasLowercase: /[a-z]/.test(loginData.password)
  });
  
  console.log('Request Payload:', {
    identifier: loginData.username,
    password: '[HIDDEN]',
    recaptcha_response: 'NO_CAPTCHA_YET'
  });
  
  console.log('Validation Checks:', {
    usernameValid: !!loginData.username && loginData.username.length > 0,
    passwordValid: !!loginData.password && loginData.password.length >= 8,
    identifierType: loginData.username.includes('@') ? 'email' : 'username'
  });
  
  console.groupEnd();
};

export const debugLoginResponse = (response, data) => {
  console.group('🔍 LOGIN RESPONSE DEBUG');
  console.log('Response Status:', response.status);
  console.log('Response OK:', response.ok);
  console.log('Response Data:', {
    hasUser: !!data.user,
    hasToken: !!(data.access_token || data.token),
    hasRefreshToken: !!data.refresh_token,
    userInfo: data.user ? {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      isAdmin: data.user.is_admin,
      isVerified: data.user.is_verified
    } : null,
    errorMessage: data.detail || data.message || 'No error message',
    errors: data.errors
  });
  console.groupEnd();
};

export default { debugLogin, debugLoginResponse };