/**
 * Simple fetch utility to avoid CORS preflight issues
 * Uses only basic headers that don't trigger preflight requests
 */

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

  const finalOptions = {
    ...defaultOptions,
    headers: cleanHeaders
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