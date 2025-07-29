import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';
// Styles included in main theme

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();

  const fetchUsers = useCallback(async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/users`);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const startEditUser = (user) => {
    setEditingUser(user._id);
    setEditFormData({
      full_name: user.full_name,
      email: user.email,
      username: user.username,
      phone: user.phone || '',
      address: user.address || ''
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditFormData({});
  };

  const saveUser = async (userId) => {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });

      showToast('User updated successfully', 'success');
      fetchUsers();
      setEditingUser(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update user:', error);
      showToast(error.message || 'Failed to update user', 'error');
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;

    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE'
      });

      showToast('User deleted successfully', 'success');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      showToast(error.message || 'Failed to delete user', 'error');
    }
  };

  const updateUserRole = async (userId, isAdmin) => {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/users/${userId}/admin`, {
        method: 'PUT',
        body: JSON.stringify({ is_admin: isAdmin })
      });

      const roleText = isAdmin ? 'admin' : 'regular user';
      showToast(`User role updated to ${roleText}`, 'success');
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user role:', error);
      showToast(error.message || 'Failed to update user role', 'error');
    }
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
                       (roleFilter === 'admin' && user.is_admin) ||
                       (roleFilter === 'user' && !user.is_admin);
    
    return matchesSearch && matchesRole;
  });

  const getUserCount = (role) => {
    if (role === 'all') return users.length;
    return users.filter(user => role === 'admin' ? user.is_admin : !user.is_admin).length;
  };

  if (loading) {
    return (
      <div className="admin-users">
        <div className="container">
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="professional-admin-container">
        <div className="admin-header-professional">
          <div className="admin-title-section">
            <h1 className="admin-title-professional">User Management</h1>
            <p className="admin-subtitle-professional">
              Manage user accounts, permissions, and monitor user activity across your platform
            </p>
          </div>
        </div>
        
        {/* Search and Filter Section */}
        <div className="professional-filter-section">
          <div className="professional-search-container">
            <div className="professional-search-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search users by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="professional-search-input"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="search-clear-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="professional-filter-buttons">
            <button 
              className={`professional-filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              <span className="filter-btn-text">All Users</span>
              <span className="filter-btn-count">{getUserCount('all')}</span>
            </button>
            <button 
              className={`professional-filter-btn ${roleFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setRoleFilter('admin')}
            >
              <span className="filter-btn-text">Admins</span>
              <span className="filter-btn-count">{getUserCount('admin')}</span>
            </button>
            <button 
              className={`professional-filter-btn ${roleFilter === 'user' ? 'active' : ''}`}
              onClick={() => setRoleFilter('user')}
            >
              <span className="filter-btn-text">Users</span>
              <span className="filter-btn-count">{getUserCount('user')}</span>
            </button>
          </div>
        </div>

        {/* Users Display */}
        <div className="professional-users-section">
          {filteredUsers.length === 0 ? (
            <div className="professional-empty-users">
              <div className="professional-empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>No users found</h3>
              <p>
                {searchTerm ? `No users found matching "${searchTerm}".` : 'No users found.'}
              </p>
            </div>
          ) : (
            <div className="professional-users-grid">
              {filteredUsers.map(user => (
                <div key={user._id} className="professional-user-card">
                  {editingUser === user._id ? (
                    <div className="professional-edit-form">
                      <div className="edit-form-header">
                        <h3 className="edit-form-title">Edit User</h3>
                        <span className={`professional-role-badge ${user.is_admin ? 'admin' : 'user'}`}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                      </div>
                      <div className="professional-form-grid">
                        <div className="form-field">
                          <label>Full Name</label>
                          <input
                            type="text"
                            value={editFormData.full_name}
                            onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                            placeholder="Full Name"
                            className="professional-form-input"
                          />
                        </div>
                        <div className="form-field">
                          <label>Email</label>
                          <input
                            type="email"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                            placeholder="Email"
                            className="professional-form-input"
                          />
                        </div>
                        <div className="form-field">
                          <label>Username</label>
                          <input
                            type="text"
                            value={editFormData.username}
                            onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                            placeholder="Username"
                            className="professional-form-input"
                          />
                        </div>
                        <div className="form-field">
                          <label>Phone</label>
                          <input
                            type="tel"
                            value={editFormData.phone}
                            onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                            placeholder="Phone"
                            className="professional-form-input"
                          />
                        </div>
                        <div className="form-field full-width">
                          <label>Address</label>
                          <textarea
                            value={editFormData.address}
                            onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                            placeholder="Address"
                            rows="3"
                            className="professional-form-textarea"
                          />
                        </div>
                      </div>
                      <div className="professional-edit-actions">
                        <button 
                          className="professional-save-btn"
                          onClick={() => saveUser(user._id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17,21 17,13 7,13 7,21"/>
                            <polyline points="7,3 7,8 15,8"/>
                          </svg>
                          Save Changes
                        </button>
                        <button 
                          className="professional-cancel-btn"
                          onClick={cancelEdit}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="professional-user-info">
                        <div className="professional-user-header">
                          <div className="user-avatar">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                          </div>
                          <div className="user-title-section">
                            <h3 className="professional-user-name">{user.full_name}</h3>
                            <span className={`professional-role-badge ${user.is_admin ? 'admin' : 'user'}`}>
                              {user.is_admin ? (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                  </svg>
                                  Admin
                                </>
                              ) : (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                  </svg>
                                  User
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                        
                        <div className="professional-user-details">
                          <div className="detail-row">
                            <span className="detail-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                <polyline points="22,6 12,13 2,6"/>
                              </svg>
                            </span>
                            <span className="detail-label">Email:</span>
                            <span className="detail-text">{user.email}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                              </svg>
                            </span>
                            <span className="detail-label">Username:</span>
                            <span className="detail-text">{user.username}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                            </span>
                            <span className="detail-label">Phone:</span>
                            <span className="detail-text">{user.phone || 'Not provided'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                            </span>
                            <span className="detail-label">Address:</span>
                            <span className="detail-text">{user.address || 'Not provided'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 3h2l.4 2m0 0L8 16h8l1.4-8.5H5.4z"/>
                                <circle cx="9" cy="21" r="1"/>
                                <circle cx="20" cy="21" r="1"/>
                              </svg>
                            </span>
                            <span className="detail-label">Orders:</span>
                            <span className="detail-text">{user.order_count || 0}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                            </span>
                            <span className="detail-label">Joined:</span>
                            <span className="detail-text">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="professional-user-actions">
                        <button
                          className="professional-user-edit-btn"
                          onClick={() => startEditUser(user)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Edit
                        </button>
                        <button
                          className={`professional-role-btn ${user.is_admin ? 'remove-admin' : 'make-admin'}`}
                          onClick={() => updateUserRole(user._id, !user.is_admin)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          className="professional-user-delete-btn"
                          onClick={() => deleteUser(user._id, user.full_name)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;