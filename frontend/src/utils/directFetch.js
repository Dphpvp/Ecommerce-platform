/**
 * Direct fetch utility with CSRF token handling
 * Attempts multiple strategies to handle CSRF requirements
 */

import simpleCSRF from './simpleCSRF';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

export const directFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  console.log('🚀 Direct fetch request to:', url);
  
  // Strategy 1: Try with CSRF token in body (our current approach)
  try {
    console.log('📋 Attempting Strategy 1: CSRF in body');
    return await fetchWithCSRFInBody(url, options);
  } catch (error) {
    console.warn('Strategy 1 failed:', error.message);
    
    // Strategy 2: Try with CSRF token in header
    try {
      console.log('📋 Attempting Strategy 2: CSRF in header');
      return await fetchWithCSRFInHeader(url, options);
    } catch (error2) {
      console.warn('Strategy 2 failed:', error2.message);
      
      // Strategy 3: Try without CSRF token (backend might not require it)
      try {
        console.log('📋 Attempting Strategy 3: No CSRF token');
        return await fetchWithoutCSRF(url, options);
      } catch (error3) {
        console.error('All strategies failed:', error3.message);
        throw error3;
      }
    }
  }
};

// Strategy 1: CSRF in body
const fetchWithCSRFInBody = async (url, options) => {
  const csrfToken = await simpleCSRF.getToken();
  let requestBody = options.body;
  
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase()) && csrfToken) {
    if (requestBody) {
      const bodyData = JSON.parse(requestBody);
      bodyData.csrf_token = csrfToken;
      requestBody = JSON.stringify(bodyData);
    } else {
      requestBody = JSON.stringify({ csrf_token: csrfToken });
    }
    console.log('🔒 Added CSRF token to body');
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: requestBody
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }
  
  return await response.json();
};

// Strategy 2: CSRF in header (might trigger CORS preflight)
const fetchWithCSRFInHeader = async (url, options) => {
  const csrfToken = await simpleCSRF.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase()) && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
    console.log('🔒 Added CSRF token to header');
  }
  
  const response = await fetch(url, {
    ...options,
    headers: headers
  });
  
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { detail: `HTTP ${response.status}` };
    }
    
    console.log('📋 Strategy 2 detailed error:', {
      status: response.status,
      statusText: response.statusText,
      errorData: errorData,
      requestUrl: url,
      requestHeaders: headers,
      requestBody: options.body
    });
    
    // If 422, it's a validation error - log more details
    if (response.status === 422) {
      console.log('🔍 422 Validation Error Details:', {
        errors: errorData.errors || errorData.detail || errorData.message,
        fullErrorResponse: errorData
      });
    }
    
    throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
  }
  
  return await response.json();
};

// Strategy 3: No CSRF token
const fetchWithoutCSRF = async (url, options) => {
  console.log('⚠️ Making request without CSRF token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }
  
  return await response.json();
};

export default directFetch;