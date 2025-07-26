import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const ManageBans = () => {
  const [users, setUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/users`);
      const allUsers = data.users || [];
      
      setUsers(allUsers.filter(user => !user.is_banned && !user.is_admin));
      setBannedUsers(allUsers.filter(user => user.is_banned));
    } catch (error) {
      showToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, reason = '') => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));

    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reason || 'Violation of terms of service',
          banned_at: new Date().toISOString()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      showToast('User banned successfully', 'success');
      fetchUsers();
    } catch (error) {
      showToast(error.message || 'Failed to ban user', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleUnbanUser = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));

    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      showToast('User unbanned successfully', 'success');
      fetchUsers();
    } catch (error) {
      showToast(error.message || 'Failed to unban user', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const promptBanUser = (userId, userName) => {
    const reason = prompt(`Enter reason for banning ${userName}:`);
    if (reason !== null) {
      handleBanUser(userId, reason);
    }
  };

  if (loading) {
    return (
      <div className="admin-manage-bans">
        <div className="container">
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-manage-bans">
      <div className="container">
        <div className="manage-bans-header">
          <h1>🚫 Manage User Bans</h1>
          <button
            onClick={() => navigate('/admin/users')}
            className="btn btn-outline"
          >
            ← Back to Users
          </button>
        </div>

        <div className="manage-bans-content">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active Users ({users.length})
            </button>
            <button
              className={`tab ${activeTab === 'banned' ? 'active' : ''}`}
              onClick={() => setActiveTab('banned')}
            >
              Banned Users ({bannedUsers.length})
            </button>
          </div>

          {activeTab === 'active' && (
            <div className="users-section">
              <div className="section-header">
                <h3>👥 Active Users</h3>
                <p>Users who can currently access the platform</p>
              </div>

              {users.length === 0 ? (
                <div className="no-users">
                  <p>No active users found</p>
                </div>
              ) : (
                <div className="users-list">
                  {users.map(user => (
                    <div key={user._id} className="user-card">
                      <div className="user-info">
                        <div className="user-details">
                          <h4>{user.full_name || 'Unknown Name'}</h4>
                          <p className="user-email">{user.email}</p>
                          <p className="user-phone">{user.phone || 'No phone'}</p>
                        </div>
                        
                        <div className="user-stats">
                          <div className="stat">
                            <span className="stat-label">Orders:</span>
                            <span className="stat-value">{user.order_count || 0}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Joined:</span>
                            <span className="stat-value">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="user-actions">
                        <button
                          onClick={() => promptBanUser(user._id, user.full_name || user.email)}
                          disabled={actionLoading[user._id]}
                          className="btn btn-danger"
                        >
                          {actionLoading[user._id] ? 'Banning...' : '🚫 Ban User'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'banned' && (
            <div className="users-section">
              <div className="section-header">
                <h3>🚫 Banned Users</h3>
                <p>Users who are currently banned from the platform</p>
              </div>

              {bannedUsers.length === 0 ? (
                <div className="no-users">
                  <p>No banned users found</p>
                </div>
              ) : (
                <div className="users-list">
                  {bannedUsers.map(user => (
                    <div key={user._id} className="user-card banned">
                      <div className="user-info">
                        <div className="user-details">
                          <h4>{user.full_name || 'Unknown Name'}</h4>
                          <p className="user-email">{user.email}</p>
                          <p className="user-phone">{user.phone || 'No phone'}</p>
                        </div>
                        
                        <div className="ban-info">
                          <div className="ban-detail">
                            <span className="ban-label">Banned:</span>
                            <span className="ban-value">
                              {user.banned_at ? new Date(user.banned_at).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                          <div className="ban-detail">
                            <span className="ban-label">Reason:</span>
                            <span className="ban-value">{user.ban_reason || 'No reason provided'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="user-actions">
                        <button
                          onClick={() => handleUnbanUser(user._id)}
                          disabled={actionLoading[user._id]}
                          className="btn btn-success"
                        >
                          {actionLoading[user._id] ? 'Unbanning...' : '✅ Unban User'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageBans;