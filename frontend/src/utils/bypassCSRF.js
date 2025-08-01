/**
 * Bypass CSRF utility for registration when CSRF endpoint is not available
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

export const registerWithoutCSRF = async (registrationData) => {
  console.log('🚀 Attempting registration without CSRF protection...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });
    
    console.log('📊 Registration response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { detail: await response.text() };
      }
      
      console.error('❌ Registration failed:', errorData);
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Registration successful:', data);
    return data;
    
  } catch (error) {
    console.error('🚨 Registration error:', error);
    throw error;
  }
};

export default registerWithoutCSRF;