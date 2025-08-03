/**
 * Simplified secure fetch utility
 * Maintains strong security with HTTPS + session cookies + CSRF without complex request signing
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

export const simpleFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  return fetch(url, {
    credentials: 'include', // For web cookies
    headers,
    body: options.body,
    ...options
  });
};

export default simpleFetch;