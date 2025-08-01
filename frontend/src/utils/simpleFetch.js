/**
 * Simple fetch utility to avoid CORS preflight issues
 * Uses only basic headers that don't trigger preflight requests
 */

import simpleCSRF from './simpleCSRF';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

export const simpleFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  // Use minimal headers to avoid CORS preflight
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  };

  // Remove any additional headers that might cause preflight
  const cleanHeaders = {
    'Content-Type': 'application/json'
  };

  // Add Authorization header if token exists
  const token = localStorage.getItem('auth_token');
  if (token) {
    cleanHeaders['Authorization'] = `Bearer ${token}`;
  }

  let requestBody = options.body;

  // For POST requests, include CSRF token in the body instead of headers
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(defaultOptions.method?.toUpperCase())) {
    try {
      console.log('🔄 Fetching CSRF token for request...');
      const csrfToken = await simpleCSRF.getToken();
      console.log('📋 CSRF token received:', csrfToken ? 'YES' : 'NO');
      
      if (csrfToken) {
        if (requestBody) {
          // Parse existing body and add CSRF token
          const bodyData = JSON.parse(requestBody);
          bodyData.csrf_token = csrfToken;
          requestBody = JSON.stringify(bodyData);
          console.log('🔒 Added CSRF token to existing request body');
        } else {
          // Create new body with just CSRF token
          requestBody = JSON.stringify({ csrf_token: csrfToken });
          console.log('🔒 Created new request body with CSRF token');
        }
      } else {
        console.warn('⚠️ No CSRF token available');
      }
    } catch (error) {
      console.error('❌ Could not add CSRF token to body:', error);
    }
  }

  const finalOptions = {
    ...defaultOptions,
    headers: cleanHeaders,
    body: requestBody
  };

  console.log('🌐 Making simple fetch request:', {
    url,
    method: finalOptions.method,
    headers: finalOptions.headers
  });

  try {
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        errorData = { detail: await response.text() };
      }
      
      console.error('Simple fetch error:', {
        url,
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      // Throw error with detailed information
      const error = new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    const responseData = await response.json();
    console.log('✅ Simple fetch success:', {
      url,
      method: finalOptions.method,
      hasData: !!responseData
    });
    
    return responseData;
  } catch (error) {
    console.error('🚨 Simple fetch failed:', {
      url,
      method: finalOptions.method,
      error: error.message,
      status: error.status
    });
    throw error;
  }
};

export default simpleFetch;