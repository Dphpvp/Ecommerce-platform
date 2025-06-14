import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';
import TwoFactorSetup from '../TwoFactor/TwoFactorSetup';
import '../../styles/profile.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const Profile = () => {
  const { user, token, login, refetchUser } = useAuth();
  const { showToast } = useToastContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [availableAvatars, setAvailableAvatars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: request code, 2: disable 2FA
  const [sendingDisableCode, setSendingDisableCode] = useState(false);
  
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
    } else if (passwordData.new_password.length < 6) {
      errors.new_password = 'Password must be at least 6 characters long';
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        login(token, data.user);
        showToast('Profile updated successfully!', 'success');
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        showToast(errorData.detail || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setPasswordLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(passwordData)
      });

      if (response.ok) {
        showToast('Password changed successfully!', 'success');
        setIsChangingPassword(false);
        setPasswordData({
          old_password: '',
          new_password: '',
          confirm_password: ''
        });
        setPasswordErrors({});
      } else {
        const errorData = await response.json();
        showToast(errorData.detail || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Password change error:', error);
      showToast('Failed to change password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const requestDisableCode = async (e) => {
    e.preventDefault();
    
    if (user?.two_factor_method === 'app') {
      // For app-based 2FA, skip to step 2 directly
      setStep(2);
      return;
    }

    // For email-based 2FA, send code
    setSendingDisableCode(true);
    try {
      const response = await fetch(`${API_BASE}/auth/send-disable-2fa-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: disable2FAForm.password })
      });

      if (response.ok) {
        showToast('Verification code sent to your email', 'success');
        setStep(2);
      } else {
        const data = await response.json();
        showToast(data.detail || 'Failed to send code', 'error');
      }
    } catch (error) {
      showToast('Failed to send verification code', 'error');
    } finally {
      setSendingDisableCode(false);
    }
  };

  const disable2FA = async (e) => {
    e.preventDefault();
    setDisabling2FA(true);

    try {
      const response = await fetch(`${API_BASE}/auth/disable-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(disable2FAForm)
      });

      if (response.ok) {
        showToast('2FA disabled successfully', 'success');
        setDisable2FAForm({ password: '', code: '' });
        setStep(1); // Reset to step 1
        refetchUser();
      } else {
        const data = await response.json();
        showToast(data.detail || 'Failed to disable 2FA', 'error');
      }
    } catch (error) {
      showToast('Failed to disable 2FA', 'error');
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
  };

  const handleChangeAvatar = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/upload-avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableAvatars(data.avatars);
        setIsChangingAvatar(true);
      } else {
        showToast('Failed to load avatar options', 'error');
      }
    } catch (error) {
      console.error('Avatar loading error:', error);
      showToast('Failed to load avatar options', 'error');
    }
  };

  const handleSelectAvatar = async (avatarUrl) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ profile_image_url: avatarUrl })
      });

      if (response.ok) {
        const data = await response.json();
        login(token, data.user);
        showToast('Avatar updated successfully!', 'success');
        setIsChangingAvatar(false);
        setFormData(prev => ({ ...prev, profile_image_url: avatarUrl }));
      } else {
        showToast('Failed to update avatar', 'error');
      }
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

  return (
    <div className="profile">
      <div className="container">
        <div className="profile-header">
          <h1>My Profile</h1>
        </div>
        
        {/* Profile Avatar Section */}
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

        {/* Avatar Selection Modal */}
        {isChangingAvatar && (
          <div className="avatar-modal-overlay">
            <div className="avatar-modal">
              <h3>Choose Your Avatar</h3>
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
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Profile Information */}
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
                  <label>Username:</label>
                  <span>{user?.username}</span>
                </div>
                <div className="info-group">
                  <label>Email:</label>
                  <div className="email-info">
                    <span>{user?.email}</span>
                    {user?.email_verified ? (
                      <span className="verification-badge verified">✅ Verified</span>
                    ) : (
                      <div className="unverified-section">
                        <span className="verification-badge unverified">❌ Unverified</span>
                        <button 
                          onClick={sendVerificationEmail}
                          className="btn btn-sm btn-primary"
                          disabled={sendingVerification}
                        >
                          {sendingVerification ? 'Sending...' : 'Send Verification Email'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="info-group">
                  <label>Full Name:</label>
                  <span>{user?.full_name || 'Not provided'}</span>
                </div>
                <div className="info-group">
                  <label>Phone:</label>
                  <span>{user?.phone || 'Not provided'}</span>
                </div>
                <div className="info-group">
                  <label>Address:</label>
                  <span>{user?.address || 'Not provided'}</span>
                </div>
                <div className="info-group">
                  <label>Two-Factor Auth:</label>
                  <span>
                    {user?.two_factor_enabled ? (
                      <span className="verification-badge verified">🔐 Enabled</span>
                    ) : (
                      <span className="verification-badge unverified">🔓 Disabled</span>
                    )}
                  </span>
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

          {/* Password Change Section */}
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
                    placeholder="Enter your new password (min 6 characters)"
                    className={passwordErrors.new_password ? 'error' : ''}
                  />
                  {passwordErrors.new_password && (
                    <span className="error-text">{passwordErrors.new_password}</span>
                  )}
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

          {/* 2FA Management Section */}
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
                        type="submit" 
                        className="btn btn-danger"
                        disabled={disabling2FA}
                        style={{ flex: 1 }}
                      >
                        {disabling2FA ? 'Disabling...' : '🔓 Disable 2FA'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="btn btn-outline"
                      >
                        ← Back
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Admin Panel Access */}
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

        {/* 2FA Setup Modal */}
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