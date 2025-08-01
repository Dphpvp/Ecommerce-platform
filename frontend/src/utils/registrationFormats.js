/**
 * Test different registration data formats to find what backend expects
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

export const testRegistrationFormats = async (registerData) => {
  console.log('🧪 Testing different registration data formats...');
  
  const baseData = {
    username: registerData.username.trim(),
    email: registerData.email.trim().toLowerCase(),
    password: registerData.password,
    first_name: registerData.firstName.trim(),
    last_name: registerData.lastName.trim(),
    phone: registerData.phone ? registerData.phone.trim() : ''
  };

  // Format 1: With password_confirmation
  const format1 = {
    ...baseData,
    password_confirmation: registerData.confirmPassword
  };

  // Format 2: With confirm_password
  const format2 = {
    ...baseData,
    confirm_password: registerData.confirmPassword
  };

  // Format 3: Without confirmation field
  const format3 = {
    ...baseData
  };

  // Format 4: With different phone handling
  const format4 = {
    ...baseData,
    phone: registerData.phone || null
  };

  const formats = [
    { name: 'Format 1 (password_confirmation)', data: format1 },
    { name: 'Format 2 (confirm_password)', data: format2 },
    { name: 'Format 3 (no confirmation)', data: format3 },
    { name: 'Format 4 (phone as null)', data: format4 }
  ];

  for (const format of formats) {
    console.log(`🔍 Testing ${format.name}:`, {
      ...format.data,
      password: '[HIDDEN]',
      password_confirmation: format.data.password_confirmation ? '[HIDDEN]' : undefined,
      confirm_password: format.data.confirm_password ? '[HIDDEN]' : undefined
    });

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(format.data)
      });

      console.log(`📊 ${format.name} result:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.log(`❌ ${format.name} error:`, errorData);
          
          // If we get specific validation errors, log them
          if (response.status === 422 && errorData.errors) {
            console.log(`🔍 ${format.name} validation errors:`, errorData.errors);
          }
        } catch (e) {
          const errorText = await response.text();
          console.log(`❌ ${format.name} error text:`, errorText);
        }
      } else {
        console.log(`✅ ${format.name} SUCCESS!`);
        const successData = await response.json();
        console.log(`📄 ${format.name} response:`, successData);
        return format.data; // Return the successful format
      }
    } catch (error) {
      console.error(`🚨 ${format.name} failed:`, error.message);
    }
  }

  return null; // No format worked
};

export default { testRegistrationFormats };