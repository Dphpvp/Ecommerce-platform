import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/profile.css';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="profile">
      <div className="container">
        <h1>My Profile</h1>
        <div className="profile-info">
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
            <span>{user?.full_name}</span>
          </div>
          <div className="info-group">
            <label>Address:</label>
            <span>{user?.address || 'Not provided'}</span>
          </div>
          <div className="info-group">
            <label>Phone:</label>
            <span>{user?.phone || 'Not provided'}</span>
          </div>
          {user?.is_admin && (
            <div className="info-group">
              <label>Role:</label>
              <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Administrator</span>
            </div>
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