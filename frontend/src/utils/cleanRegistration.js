/**
 * Clean registration utility - built from scratch for backend compliance
 * Handles CORS, CSRF, and exact backend data format
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

// Simple CSRF token fetcher
const getCSRFToken = async () => {
  try {
    console.log('🔒 Fetching CSRF token...');
    const response = await fetch(`${API_BASE}/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ CSRF token obtained:', data.csrf_token?.substring(0, 20) + '...');
      return data.csrf_token;
    }
    
    console.warn('⚠️ CSRF endpoint returned:', response.status);
    return null;
  } catch (error) {
    console.warn('⚠️ CSRF fetch failed:', error.message);
    return null;
  }
};

// Registration function with exact backend format
export const registerUser = async (userData) => {
  console.log('🚀 Starting clean registration process...');
  
  // Prepare data in exact backend format
  const registrationData = {
    username: userData.username.trim().toLowerCase(),
    email: userData.email.trim().toLowerCase(), 
    password: userData.password,
    full_name: userData.full_name.trim(),
    phone: userData.phone.trim(),
    address: userData.address ? userData.address.trim() : ""
  };
  
  console.log('📋 Registration data prepared:', {
    ...registrationData,
    password: '[HIDDEN]'
  });
  
  // Get CSRF token
  const csrfToken = await getCSRFToken();
  
  // Prepare headers
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Add CSRF token to headers if available
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
    console.log('🔒 Added CSRF token to headers');
  }
  
  try {
    console.log('📤 Sending registration request...');
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(registrationData),
      credentials: 'include'
    });
    
    console.log('📊 Registration response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    // Handle response
    let responseData;
    try {
      const responseText = await response.text();
      console.log('📄 Raw response:', responseText);
      
      if (responseText) {
        responseData = JSON.parse(responseText);
      } else {
        responseData = {};
      }
    } catch (parseError) {
      console.error('❌ Failed to parse response:', parseError);
      responseData = { detail: 'Invalid server response' };
    }
    
    if (response.ok) {
      console.log('✅ Registration successful:', responseData);
      return {
        success: true,
        data: responseData,
        message: responseData.message || 'Registration successful! Please check your email.'
      };
    } else {
      console.error('❌ Registration failed:', {
        status: response.status,
        data: responseData
      });
      
      return {
        success: false,
        error: responseData.detail || responseData.message || `HTTP ${response.status}`,
        status: response.status,
        data: responseData
      };
    }
    
  } catch (error) {
    console.error('🚨 Registration request failed:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
      networkError: true
    };
  }
};

export default { registerUser };