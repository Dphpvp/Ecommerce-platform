/**
 * Test backend endpoints to see what's available
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

export const testEndpoints = async () => {
  console.log('🧪 Testing backend endpoints...');
  
  const endpoints = [
    '/auth',
    '/auth/register', 
    '/auth/login',
    '/csrf-token',
    '/health',
    '/'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const url = `${API_BASE}${endpoint}`;
      console.log(`🔍 Testing: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      console.log(`📊 ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      });
      
      if (response.status !== 404) {
        try {
          const text = await response.text();
          console.log(`📄 ${endpoint} response:`, text.substring(0, 200));
        } catch (e) {
          console.log(`📄 ${endpoint} response: [Could not read body]`);
        }
      }
      
    } catch (error) {
      console.error(`❌ ${endpoint} failed:`, error.message);
    }
  }
};

export const testRegisterEndpoint = async () => {
  console.log('🧪 Testing register endpoint with minimal data...');
  
  const testData = {
    username: 'testuser123',
    email: 'test@example.com',
    password: 'TestPass123'
  };
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Register endpoint test:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    const responseText = await response.text();
    console.log('📄 Register response:', responseText);
    
    return { status: response.status, data: responseText };
    
  } catch (error) {
    console.error('❌ Register endpoint test failed:', error);
    return null;
  }
};

export default { testEndpoints, testRegisterEndpoint };