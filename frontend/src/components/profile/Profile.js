import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';
import '../../styles/profile.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const Profile = () => {
  const { user, token, login } = useAuth();
  const { showToast } = useToastContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  const [availableAvatars, setAvailableAvatars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    profile_image_url: ''
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        // Update the auth context with new user data
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

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to original user data
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
    // Generate a default avatar based on username
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'default'}`;
  };

  return (
    <div className="profile">
      <div className="container">
        <h1>My Profile</h1>
        
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
                <span>{user?.email}</span>
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
              </div>
            </>
          )}
        </div>

        {/* Admin Panel Access */}
        {user?.is_admin && (
          <div className="admin-panel-access">
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
    </div>
  );
};

export default Profile;