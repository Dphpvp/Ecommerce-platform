/**
 * Test utility to debug CSRF token issues
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

export const testCSRFEndpoint = async () => {
  console.log('🧪 Testing CSRF endpoint...');
  
  try {
    console.log('📡 Fetching from:', `${API_BASE}/csrf-token`);
    
    const response = await fetch(`${API_BASE}/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log('📊 CSRF Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ CSRF Data:', data);
      return data.csrf_token;
    } else {
      const errorText = await response.text();
      console.log('❌ CSRF Error:', errorText);
      return null;
    }
  } catch (error) {
    console.error('🚨 CSRF Fetch Failed:', error);
    return null;
  }
};

export const testRegistrationWithoutCSRF = async (registrationData) => {
  console.log('🧪 Testing registration without CSRF...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });
    
    console.log('📊 Registration Response (no CSRF):', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    const responseText = await response.text();
    console.log('📄 Response Body:', responseText);
    
    return { response, data: responseText };
  } catch (error) {
    console.error('🚨 Registration Test Failed:', error);
    return null;
  }
};

export const testRegistrationWithCSRFHeader = async (registrationData, csrfToken) => {
  console.log('🧪 Testing registration with CSRF header...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(registrationData)
    });
    
    console.log('📊 Registration Response (CSRF header):', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    const responseText = await response.text();
    console.log('📄 Response Body:', responseText);
    
    return { response, data: responseText };
  } catch (error) {
    console.error('🚨 Registration Test Failed:', error);
    return null;
  }
};

export const testRegistrationWithCSRFBody = async (registrationData, csrfToken) => {
  console.log('🧪 Testing registration with CSRF in body...');
  
  const dataWithCSRF = {
    ...registrationData,
    csrf_token: csrfToken
  };
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataWithCSRF)
    });
    
    console.log('📊 Registration Response (CSRF body):', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    const responseText = await response.text();
    console.log('📄 Response Body:', responseText);
    
    return { response, data: responseText };
  } catch (error) {
    console.error('🚨 Registration Test Failed:', error);
    return null;
  }
};

export default {
  testCSRFEndpoint,
  testRegistrationWithoutCSRF,
  testRegistrationWithCSRFHeader,
  testRegistrationWithCSRFBody
};