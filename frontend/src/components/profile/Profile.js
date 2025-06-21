import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';
import TwoFactorSetup from '../TwoFactor/TwoFactorSetup';
import '../../styles/components/profile.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

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
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState(null);
  
  const recaptchaRef = useRef(null);
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

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        profile_image_url: user.profile_image_url || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const loadRecaptcha = () => {
      if (window.grecaptcha) {
        setRecaptchaLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;

      window.onRecaptchaLoad = () => {
        setRecaptchaLoaded(true);
      };

      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
        delete window.onRecaptchaLoad;
      };
    };

    loadRecaptcha();
  }, []);

  useEffect(() => {
    if (recaptchaLoaded && isChangingPassword && recaptchaRef.current && !recaptchaWidgetId) {
      try {
        const widgetId = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: process.env.REACT_APP_RECAPTCHA_SITE_KEY,
          callback: (response) => {
            console.log('reCAPTCHA completed:', response);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            showToast('reCAPTCHA expired. Please complete it again.', 'warning');
          }
        });
        setRecaptchaWidgetId(widgetId);
      } catch (error) {
        console.error('reCAPTCHA render error:', error);
        showToast('Failed to load reCAPTCHA. Please refresh the page.', 'error');
      }
    }
  }, [recaptchaLoaded, isChangingPassword, showToast]);

  useEffect(() => {
    if (!isChangingPassword && recaptchaWidgetId !== null) {
      try {
        if (window.grecaptcha) {
          window.grecaptcha.reset(recaptchaWidgetId);
        }
        setRecaptchaWidgetId(null);
      } catch (error) {
        console.error('reCAPTCHA reset error:', error);
      }
    }
  }, [isChangingPassword, recaptchaWidgetId]);

  const sendVerificationEmail = async () => {
    setSendingVerification(true);
    try {
      const response = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
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

    let recaptchaResponse = '';
    try {
      if (recaptchaWidgetId !== null) {
        recaptchaResponse = window.grecaptcha.getResponse(recaptchaWidgetId);
      }
    } catch (error) {
      console.error('reCAPTCHA error:', error);
    }

    if (!recaptchaResponse) {
      showToast('Please complete the reCAPTCHA verification', 'error');
      return;
    }
    
    setPasswordLoading(true);

    try {
      await makeAuthenticatedRequest(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        body: JSON.stringify({
          ...passwordData,
          recaptcha_response: recaptchaResponse
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
      
      if (recaptchaWidgetId !== null) {
        window.grecaptcha.reset(recaptchaWidgetId);
      }
    } catch (error) {
      console.error('Password change error:', error);
      showToast(error.message || 'Failed to change password', 'error');
      
      if (recaptchaWidgetId !== null) {
        window.grecaptcha.reset(recaptchaWidgetId);
      }
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
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        profile_image_url: user.profile_image_url || ''
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
    
    if (recaptchaWidgetId !== null) {
      try {
        window.grecaptcha.reset(recaptchaWidgetId);
      } catch (error) {
        console.error('reCAPTCHA reset error:', error);
      }
    }
  };

  // NEW: Avatar upload functionality
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
        headers: {} // Don't set Content-Type for FormData
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
      return user.profile_image_url;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'default'}`;
  };

  const canChangePassword = user && !user.google_id;

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
    <div className="profile">
      <div className="container">
        <div className="profile-header">
          <h1>My Profile</h1>
        </div>
        
        <div className="profile-avatar-section">
          <div className="avatar-container">
            <img 
              src={getDisplayAvatar()} 
              alt="Profile Avatar" 
              className="profile-avatar"
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'default'}`;
              }}
            />
            <button 
              onClick={handleChangeAvatar}
              className="change-avatar-btn"
              disabled={loading}
            >
              Change Avatar
            </button>
          </div>
        </div>

        {/* UPDATED: Avatar modal with upload functionality */}
        {isChangingAvatar && (
          <div className="avatar-modal-overlay">
            <div className="avatar-modal">
              <h3>Choose Your Avatar</h3>
              
              {/* Upload Custom Avatar */}
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

              {/* Divider */}
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
              
              {/* Sample Avatars */}
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

        <div className="profile-content">
          <div className="profile-info">
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="profile-edit-form">
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

          {isChangingPassword && canChangePassword && (
            <div className="password-change-section">
              <h3>Change Password</h3>
              {!recaptchaLoaded && (
                <div className="loading-recaptcha">
                  <p>Loading security verification...</p>
                </div>
              )}
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

                <div className="form-group">
                  <label>Security Verification:</label>
                  <div 
                    ref={recaptchaRef}
                    style={{ margin: '10px 0' }}
                  ></div>
                  {!recaptchaLoaded && (
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>
                      Please wait for security verification to load...
                    </p>
                  )}
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={passwordLoading || !recaptchaLoaded}
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
      </div>
    </div>
  );
};

export default Profile;