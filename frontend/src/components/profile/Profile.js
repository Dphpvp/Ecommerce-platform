import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
    address: user?.address || '',
    phone: user?.phone || '',
    profile_photo: user?.profile_photo || ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileData({
          ...profileData,
          profile_photo: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match!');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });

      if (response.ok) {
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setShowPasswordForm(false);
        alert('Password updated successfully!');
      } else {
        throw new Error('Failed to update password');
      }
    } catch (error) {
      alert('Error updating password: ' + error.message);
    }
  };

  const handleCancel = () => {
    setProfileData({
      username: user?.username || '',
      email: user?.email || '',
      full_name: user?.full_name || '',
      address: user?.address || '',
      phone: user?.phone || '',
      profile_photo: user?.profile_photo || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="profile">
      <div className="container">
        <h1>My Profile</h1>
        
        <div className="profile-section">
          <div className="profile-header">
            <div className="profile-photo-container">
              {profileData.profile_photo ? (
                <img src={profileData.profile_photo} alt="Profile" className="profile-photo" />
              ) : (
                <div className="profile-photo-placeholder">
                  👤
                </div>
              )}
              {isEditing && (
                <div className="photo-upload">
                  <input
                    type="file"
                    id="profile-photo"
                    accept="image/*"
                    onChange={handleFileUpload}
                    hidden
                  />
                  <label htmlFor="profile-photo" className="btn btn-photo">
                    📷 Change Photo
                  </label>
                </div>
              )}
            </div>
            <div className="profile-actions">
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                  ✏️ Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button onClick={handleSave} className="btn btn-success">
                    💾 Save Changes
                  </button>
                  <button onClick={handleCancel} className="btn btn-secondary">
                    ❌ Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="profile-info">
            <div className="info-group">
              <label>Username:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={profileData.username}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{user?.username}</span>
              )}
            </div>
            
            <div className="info-group">
              <label>Email:</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{user?.email}</span>
              )}
            </div>
            
            <div className="info-group">
              <label>Full Name:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="full_name"
                  value={profileData.full_name}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{user?.full_name}</span>
              )}
            </div>
            
            <div className="info-group">
              <label>Phone:</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <span>{user?.phone || 'Not provided'}</span>
              )}
            </div>
            
            <div className="info-group">
              <label>Delivery Address:</label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={profileData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your full delivery address"
                  rows="3"
                />
              ) : (
                <span>{user?.address || 'Not provided'}</span>
              )}
            </div>
            
            {user?.is_admin && (
              <div className="info-group">
                <label>Role:</label>
                <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Administrator</span>
              </div>
            )}
          </div>

          {/* Password Update Section */}
          <div className="password-section">
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="btn btn-outline"
            >
              🔒 Change Password
            </button>
            
            {showPasswordForm && (
              <div className="password-form">
                <div className="form-group">
                  <label>Current Password:</label>
                  <input
                    type="password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="form-group">
                  <label>New Password:</label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password:</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="password-actions">
                  <button onClick={handlePasswordUpdate} className="btn btn-success">
                    Update Password
                  </button>
                  <button
                    onClick={() => {
                      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                      setShowPasswordForm(false);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
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