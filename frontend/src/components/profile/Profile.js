import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';
import TwoFactorSetup from '../TwoFactor/TwoFactorSetup';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const Profile = () => {
  const { user, makeAuthenticatedRequest, login, refetchUser } = useAuth();
  const { showToast } = useToastContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [availableAvatars, setAvailableAvatars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [sendingDisableCode, setSendingDisableCode] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    profile_image_url: ''
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [disable2FAForm, setDisable2FAForm] = useState({ 
    password: '', 
    code: '' 
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  
  // Saved Addresses state
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    title: '',
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false
  });
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        profile_image_url: user?.profile_image_url || ''
      });
      fetchAddresses();
    }
  }, [user]);

  // Fetch saved addresses
  const fetchAddresses = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/user/addresses`);
      setAddresses(data.addresses || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  // reCAPTCHA functionality removed - will be reimplemented fresh for web-only

  const sendVerificationEmail = async () => {
    setSendingVerification(true);
    try {
      const response = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email })
      });

      if (response.ok) {
        showToast('Verification email sent! Check your inbox.', 'success');
      } else {
        const data = await response.json();
        showToast(data.detail || 'Failed to send verification email', 'error');
      }
    } catch (error) {
      showToast('Failed to send verification email', 'error');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.old_password) {
      errors.old_password = 'Current password is required';
    }
    
    if (!passwordData.new_password) {
      errors.new_password = 'New password is required';
    } else if (passwordData.new_password.length < 10) {
      errors.new_password = 'Password must be at least 10 characters long';
    } else if (!/[A-Z]/.test(passwordData.new_password)) {
      errors.new_password = 'Password must contain at least one uppercase letter';
    } else if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(passwordData.new_password)) {
      errors.new_password = 'Password must contain at least one special character';
    }
    
    if (!passwordData.confirm_password) {
      errors.confirm_password = 'Please confirm your new password';
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }
    
    if (passwordData.old_password && passwordData.new_password && 
        passwordData.old_password === passwordData.new_password) {
      errors.new_password = 'New password must be different from current password';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    // No captcha for now - will implement fresh web-only version later
    
    setPasswordLoading(true);

    try {
      await makeAuthenticatedRequest(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        body: JSON.stringify({
          ...passwordData,
          recaptcha_response: 'NO_CAPTCHA_YET'
        })
      });

      showToast('Password changed successfully!', 'success');
      setIsChangingPassword(false);
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: ''
      });
      setPasswordErrors({});
      
      // No captcha reset needed
    } catch (error) {
      console.error('Password change error:', error);
      showToast(error.message || 'Failed to change password', 'error');
      
      // No captcha reset needed
    } finally {
      setPasswordLoading(false);
    }
  };

  const requestDisableCode = async (e) => {
    e.preventDefault();
    
    if (user?.two_factor_method === 'app') {
      setStep(2);
      return;
    }

    setSendingDisableCode(true);
    try {
      await makeAuthenticatedRequest(`${API_BASE}/auth/send-disable-2fa-code`, {
        method: 'POST',
        body: JSON.stringify({ password: disable2FAForm.password })
      });

      showToast('Verification code sent to your email', 'success');
      setStep(2);
    } catch (error) {
      showToast(error.message || 'Failed to send code', 'error');
    } finally {
      setSendingDisableCode(false);
    }
  };

  const disable2FA = async (e) => {
    e.preventDefault();
    setDisabling2FA(true);

    try {
      await makeAuthenticatedRequest(`${API_BASE}/auth/disable-2fa`, {
        method: 'POST',
        body: JSON.stringify(disable2FAForm)
      });

      showToast('2FA disabled successfully', 'success');
      setDisable2FAForm({ password: '', code: '' });
      setStep(1);
      refetchUser();
    } catch (error) {
      showToast(error.message || 'Failed to disable 2FA', 'error');
    } finally {
      setDisabling2FA(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        profile_image_url: user?.profile_image_url || ''
      });
    }
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      old_password: '',
      new_password: '',
      confirm_password: ''
    });
    setPasswordErrors({});
    
    // No captcha reset needed
  };

  const handleChangeAvatar = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/uploads/avatar/samples`);
      setAvailableAvatars(data.avatars);
      setIsChangingAvatar(true);
    } catch (error) {
      console.error('Avatar loading error:', error);
      showToast('Failed to load avatar options', 'error');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File too large. Max size is 5MB', 'error');
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await makeAuthenticatedRequest(`${API_BASE}/uploads/avatar`, {
        method: 'POST',
        body: formData,
        headers: {}
      });

      const updatedUser = { ...user, profile_image_url: response.avatar_url };
      login(updatedUser);
      
      showToast('Avatar uploaded successfully!', 'success');
      setIsChangingAvatar(false);
    } catch (error) {
      showToast(error.message || 'Upload failed', 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSelectAvatar = async (avatarUrl) => {
    setLoading(true);
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/auth/update-profile`, {
        method: 'PUT',
        body: JSON.stringify({ profile_image_url: avatarUrl })
      });

      login(data.user);
      showToast('Avatar updated successfully!', 'success');
      setIsChangingAvatar(false);
      setFormData(prev => ({ ...prev, profile_image_url: avatarUrl }));
    } catch (error) {
      console.error('Avatar update error:', error);
      showToast('Failed to update avatar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayAvatar = () => {
    if (user?.profile_image_url) {
      return user?.profile_image_url;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'default'}`;
  };

  const canChangePassword = user && !user?.google_id;

  // Address management functions
  const handleAddressInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetAddressForm = () => {
    setAddressForm({
      title: '',
      full_name: '',
      phone: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      is_default: false
    });
    setEditingAddress(null);
  };

  const handleAddAddress = () => {
    resetAddressForm();
    setShowAddressModal(true);
  };

  const handleEditAddress = (address) => {
    setAddressForm(address);
    setEditingAddress(address._id);
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressLoading(true);

    try {
      if (editingAddress) {
        // Update existing address
        await makeAuthenticatedRequest(`${API_BASE}/user/addresses/${editingAddress}`, {
          method: 'PUT',
          body: JSON.stringify(addressForm)
        });
        showToast('Address updated successfully!', 'success');
      } else {
        // Add new address
        await makeAuthenticatedRequest(`${API_BASE}/user/addresses`, {
          method: 'POST',
          body: JSON.stringify(addressForm)
        });
        showToast('Address added successfully!', 'success');
      }
      
      fetchAddresses();
      setShowAddressModal(false);
      resetAddressForm();
    } catch (error) {
      console.error('Address save error:', error);
      showToast(error.message || 'Failed to save address', 'error');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await makeAuthenticatedRequest(`${API_BASE}/user/addresses/${addressId}`, {
        method: 'DELETE'
      });
      showToast('Address deleted successfully!', 'success');
      fetchAddresses();
    } catch (error) {
      console.error('Address delete error:', error);
      showToast(error.message || 'Failed to delete address', 'error');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/user/addresses/${addressId}/set-default`, {
        method: 'PUT'
      });
      showToast('Default address updated!', 'success');
      fetchAddresses();
    } catch (error) {
      console.error('Set default error:', error);
      showToast(error.message || 'Failed to set default address', 'error');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/auth/update-profile`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      login(data.user);
      showToast('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="luxury-profile-page">
      <div className="container">
        <div className="luxury-profile-header">
          <div className="profile-hero-content">
            <div className="profile-badge">My Account</div>
            <h1 className="profile-title">Profile Settings</h1>
            <p className="profile-subtitle">Manage your personal information and account preferences</p>
          </div>
          <div className="profile-hero-decoration"></div>
        </div>
        
        <div className="luxury-avatar-section">
          <div className="avatar-container-luxury">
            <div className="avatar-frame">
              <img 
                src={getDisplayAvatar()} 
                alt="Profile Avatar" 
                className="luxury-profile-avatar"
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'default'}`;
                }}
              />
              <div className="avatar-overlay">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
            <div className="avatar-info">
              <h3 className="user-name">{user?.full_name || user?.username}</h3>
              <p className="user-role">{user?.is_admin ? 'Administrator' : 'Premium Member'}</p>
              <button 
                onClick={handleChangeAvatar}
                className="btn-luxury-outline btn-change-avatar"
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Change Avatar
              </button>
            </div>
          </div>
        </div>

        {isChangingAvatar && (
          <div className="avatar-modal-overlay">
            <div className="avatar-modal">
              <h3>Choose Your Avatar</h3>
              
              <div className="upload-section" style={{ marginBottom: '2rem' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  onClick={triggerFileUpload}
                  disabled={uploadingAvatar}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    marginBottom: '1rem',
                    backgroundColor: '#28a745',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {uploadingAvatar ? (
                    <>⏳ Uploading...</>
                  ) : (
                    <>📁 Upload Custom Avatar</>
                  )}
                </button>
                <p style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
                  Max 5MB • JPG, PNG, GIF, WebP
                </p>
              </div>

              <div style={{ 
                textAlign: 'center', 
                margin: '1rem 0',
                borderBottom: '1px solid #ddd',
                paddingBottom: '1rem'
              }}>
                <span style={{ 
                  backgroundColor: 'white', 
                  padding: '0 1rem', 
                  color: '#666' 
                }}>
                  or choose from samples
                </span>
              </div>
              
              <div className="avatar-grid">
                {availableAvatars.map((avatar, index) => (
                  <img
                    key={index}
                    src={avatar}
                    alt={`Avatar option ${index + 1}`}
                    className="avatar-option"
                    onClick={() => handleSelectAvatar(avatar)}
                    style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                  />
                ))}
              </div>
              
              <button 
                onClick={() => setIsChangingAvatar(false)}
                className="btn btn-outline"
                disabled={loading || uploadingAvatar}
                style={{ marginTop: '1rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="luxury-profile-content">
          <div className="profile-main-card">
            <div className="card-header">
              <div className="card-title-section">
                <h2 className="card-title">Personal Information</h2>
                <p className="card-subtitle">Update your account details and personal information</p>
              </div>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="btn-luxury-outline btn-edit"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
            
            <div className="card-content">
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="luxury-form">
                  <div className="form-group">
                    <label>Full Name:</label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Phone:</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Address:</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your address"
                      rows="3"
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      type="button" 
                      onClick={handleCancelEdit}
                      className="btn btn-outline"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="info-group">
                    <label>Email:</label>
                    <div className="email-info">
                      <span>{user?.email}</span>
                      {user?.email_verified ? (
                        <span className="verification-badge verified">✅ Verified</span>
                      ) : (
                        <div className="unverified-section">
                          <span className="verification-badge unverified">❌ Unverified</span>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button 
                              onClick={sendVerificationEmail}
                              className="btn btn-sm btn-outline"
                              disabled={sendingVerification}
                              style={{ flex: 0 }}
                            >
                              {sendingVerification ? 'Sending...' : 'Resend'}
                            </button>
                            <button 
                              onClick={() => window.location.href = '/verify-email'}
                              className="btn btn-sm btn-primary"
                              style={{ flex: 2 }}
                            >
                              Verify Code
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {user?.is_admin && (
                    <div className="info-group">
                      <label>Role:</label>
                      <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Administrator</span>
                    </div>
                  )}
                  
                  <div className="profile-actions">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="btn btn-primary"
                    >
                      Edit Profile
                    </button>
                    {canChangePassword && (
                      <button 
                        onClick={() => setIsChangingPassword(true)}
                        className="btn btn-outline"
                      >
                        Change Password
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {isChangingPassword && canChangePassword && (
            <div className="password-change-section">
              <h3>Change Password</h3>
              <form onSubmit={handleChangePassword} className="password-change-form">
                <div className="form-group">
                  <label>Current Password:</label>
                  <input
                    type="password"
                    name="old_password"
                    value={passwordData.old_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    className={passwordErrors.old_password ? 'error' : ''}
                  />
                  {passwordErrors.old_password && (
                    <span className="error-text">{passwordErrors.old_password}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>New Password:</label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    placeholder="Min 10 chars, 1 uppercase, 1 special character"
                    className={passwordErrors.new_password ? 'error' : ''}
                  />
                  {passwordErrors.new_password && (
                    <span className="error-text">{passwordErrors.new_password}</span>
                  )}
                  <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '4px' }}>
                    Must contain: 10+ characters, uppercase letter, special character (!@#$%^&*...)
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Confirm New Password:</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    placeholder="Confirm your new password"
                    className={passwordErrors.confirm_password ? 'error' : ''}
                  />
                  {passwordErrors.confirm_password && (
                    <span className="error-text">{passwordErrors.confirm_password}</span>
                  )}
                </div>


                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCancelPasswordChange}
                    className="btn btn-outline"
                    disabled={passwordLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="security-section">
            <h2>🔐 Security Settings</h2>
            <p>Manage your account security and two-factor authentication:</p>
            
            {!user?.two_factor_enabled ? (
              <div className="security-actions">
                <button 
                  onClick={() => setShowTwoFactorSetup(true)}
                  className="btn btn-primary"
                  disabled={!user?.email_verified}
                >
                  🔐 Enable Two-Factor Authentication
                </button>
                {!user?.email_verified && (
                  <p className="security-notice">
                    ⚠️ You must verify your email before enabling 2FA
                  </p>
                )}
              </div>
            ) : (
              <div className="security-actions">
                <p className="security-status">
                  ✅ Two-factor authentication is enabled ({user?.two_factor_method === 'email' ? 'Email' : 'App'})
                </p>
                
                {step === 1 ? (
                  <form onSubmit={requestDisableCode} className="disable-2fa-form">
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={disable2FAForm.password}
                      onChange={(e) => setDisable2FAForm({...disable2FAForm, password: e.target.value})}
                      required
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={sendingDisableCode}
                    >
                      {sendingDisableCode ? 'Sending...' : '📧 Request Code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={disable2FA} className="disable-2fa-form">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={disable2FAForm.password}
                      onChange={(e) => setDisable2FAForm({...disable2FAForm, password: e.target.value})}
                      required
                      disabled
                    />
                    <input
                      type="text"
                      placeholder={user?.two_factor_method === 'email' ? 'Email Code' : 'Authenticator Code'}
                      value={disable2FAForm.code}
                      onChange={(e) => setDisable2FAForm({...disable2FAForm, code: e.target.value})}
                      required
                      autoFocus
                    />
                    {user?.two_factor_method === 'app' && (
                      <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        💡 Use your authenticator app to get the 6-digit code
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="btn btn-outline"
                      >
                        ← Back
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-danger"
                        disabled={disabling2FA}
                        style={{ flex: 1 }}
                      >
                        {disabling2FA ? 'Disabling...' : '🔓 Disable 2FA'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Saved Addresses Section */}
          <div className="addresses-section">
            <div className="addresses-header">
              <div className="card-title-section">
                <h2 className="card-title">📍 Saved Addresses</h2>
                <p className="card-subtitle">Manage your shipping addresses for faster checkout</p>
              </div>
              <button 
                onClick={handleAddAddress}
                className="btn-primary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Address
              </button>
            </div>
            
            <div className="addresses-content">
              <div className="addresses-grid">
                {addresses.map((address) => (
                  <div key={address._id} className={`address-card ${address.is_default ? 'default' : ''}`}>
                    {address.is_default && <div className="default-badge">Default</div>}
                    
                    <div className="address-info">
                      <h4>{address.title}</h4>
                      <p><strong>{address.full_name}</strong></p>
                      <p>{address.phone}</p>
                      <p>
                        {address.address_line_1}
                        {address.address_line_2 && <><br />{address.address_line_2}</>}
                      </p>
                      <p>{address.city}, {address.state} {address.postal_code}</p>
                      <p>{address.country}</p>
                    </div>
                    
                    <div className="address-actions">
                      {!address.is_default && (
                        <button 
                          onClick={() => handleSetDefaultAddress(address._id)}
                          className="btn btn-sm btn-outline"
                        >
                          Set Default
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditAddress(address)}
                        className="btn btn-sm btn-outline"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteAddress(address._id)}
                        className="btn btn-sm btn-outline"
                        style={{ color: '#ef4444', borderColor: '#ef4444' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="add-address-card" onClick={handleAddAddress}>
                  <div className="add-address-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                  <span>Add New Address</span>
                </div>
              </div>
            </div>
          </div>

          {user?.is_admin && (
            <div className="admin-section">
              <h2>Admin Panel</h2>
              <p>Access administrative functions and manage the platform:</p>
              <div className="admin-buttons">
                <Link to="/admin/dashboard" className="btn btn-admin">
                  📊 Dashboard
                </Link>
                <Link to="/admin/orders" className="btn btn-admin">
                  📦 Manage Orders
                </Link>
                <Link to="/admin/users" className="btn btn-admin">
                  👥 Manage Users
                </Link>
                <Link to="/admin/products" className="btn btn-admin">
                  🛍️ Manage Products
                </Link>
              </div>
            </div>
          )}
        </div>

        {showTwoFactorSetup && (
          <TwoFactorSetup 
            onClose={() => setShowTwoFactorSetup(false)}
            onComplete={() => refetchUser()}
          />
        )}

        {/* Address Form Modal */}
        {showAddressModal && (
          <div className="address-modal-overlay">
            <div className="address-modal">
              <div className="address-modal-header">
                <h3 className="address-modal-title">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowAddressModal(false)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              
              <div className="address-modal-content">
                <form onSubmit={handleSaveAddress} className="luxury-form">
                  <div className="form-group">
                    <label>Address Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={addressForm.title}
                      onChange={handleAddressInputChange}
                      placeholder="e.g., Home, Office, Work"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="full_name"
                      value={addressForm.full_name}
                      onChange={handleAddressInputChange}
                      placeholder="Recipient's full name"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={addressForm.phone}
                      onChange={handleAddressInputChange}
                      placeholder="Contact phone number"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Address Line 1 *</label>
                    <input
                      type="text"
                      name="address_line_1"
                      value={addressForm.address_line_1}
                      onChange={handleAddressInputChange}
                      placeholder="Street address, building name"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      name="address_line_2"
                      value={addressForm.address_line_2}
                      onChange={handleAddressInputChange}
                      placeholder="Apartment, suite, unit (optional)"
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressInputChange}
                        placeholder="City"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>State/Province *</label>
                      <input
                        type="text"
                        name="state"
                        value={addressForm.state}
                        onChange={handleAddressInputChange}
                        placeholder="State or Province"
                        required
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label>Postal Code *</label>
                      <input
                        type="text"
                        name="postal_code"
                        value={addressForm.postal_code}
                        onChange={handleAddressInputChange}
                        placeholder="ZIP/Postal Code"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Country *</label>
                      <input
                        type="text"
                        name="country"
                        value={addressForm.country}
                        onChange={handleAddressInputChange}
                        placeholder="Country"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <input
                        type="checkbox"
                        name="is_default"
                        checked={addressForm.is_default}
                        onChange={handleAddressInputChange}
                      />
                      Set as default address
                    </label>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={addressLoading}
                    >
                      {addressLoading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowAddressModal(false)}
                      className="btn btn-outline"
                      disabled={addressLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;