import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/pages/admin.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const { makeAuthenticatedRequest } = useAuth();

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

      alert('User updated successfully');
      fetchUsers();
      setEditingUser(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update user:', error);
      alert(error.message || 'Failed to update user');
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;

    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE'
      });

      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.message || 'Failed to delete user');
    }
  };

  const updateUserRole = async (userId, isAdmin) => {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/users/${userId}/admin`, {
        method: 'PUT',
        body: JSON.stringify({ is_admin: isAdmin })
      });

      const roleText = isAdmin ? 'admin' : 'regular user';
      alert(`User role updated to ${roleText}`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert(error.message || 'Failed to update user role');
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
    <div className="admin-users">
      <div className="container">
        <h1>User Management</h1>
        
        {/* Search and Filter Section */}
        <div className="filter-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              All Users ({getUserCount('all')})
            </button>
            <button 
              className={`filter-btn ${roleFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setRoleFilter('admin')}
            >
              Admins ({getUserCount('admin')})
            </button>
            <button 
              className={`filter-btn ${roleFilter === 'user' ? 'active' : ''}`}
              onClick={() => setRoleFilter('user')}
            >
              Users ({getUserCount('user')})
            </button>
          </div>
        </div>

        {/* Users Display */}
        <div className="users-section">
          {filteredUsers.length === 0 ? (
            <div className="no-users">
              <p>
                {searchTerm ? `No users found matching "${searchTerm}".` : 'No users found.'}
              </p>
            </div>
          ) : (
            <div className="users-list">
              {filteredUsers.map(user => (
                <div key={user._id} className="user-card">
                  {editingUser === user._id ? (
                    <div className="edit-form">
                      <h3>Edit User</h3>
                      <div className="form-grid">
                        <input
                          type="text"
                          value={editFormData.full_name}
                          onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                          placeholder="Full Name"
                        />
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                          placeholder="Email"
                        />
                        <input
                          type="text"
                          value={editFormData.username}
                          onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                          placeholder="Username"
                        />
                        <input
                          type="tel"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                          placeholder="Phone"
                        />
                        <textarea
                          value={editFormData.address}
                          onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                          placeholder="Address"
                          rows="3"
                        />
                      </div>
                      <div className="edit-actions">
                        <button 
                          className="save-btn"
                          onClick={() => saveUser(user._id)}
                        >
                          Save Changes
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="user-info">
                        <div className="user-header">
                          <h3>{user.full_name}</h3>
                          <span className={`role-badge ${user.is_admin ? 'admin' : 'user'}`}>
                            {user.is_admin ? 'Admin' : 'User'}
                          </span>
                        </div>
                        <div className="user-details">
                          <p><strong>Email:</strong> {user.email}</p>
                          <p><strong>Username:</strong> {user.username}</p>
                          <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
                          <p><strong>Address:</strong> {user.address || 'Not provided'}</p>
                          <p><strong>Orders:</strong> {user.order_count || 0}</p>
                          <p><strong>Joined:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
                        </div>
                      </div>
                      
                      <div className="user-actions">
                        <button
                          className="edit-btn"
                          onClick={() => startEditUser(user)}
                        >
                          Edit
                        </button>
                        <button
                          className={`role-btn ${user.is_admin ? 'remove-admin' : 'make-admin'}`}
                          onClick={() => updateUserRole(user._id, !user.is_admin)}
                        >
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => deleteUser(user._id, user.full_name)}
                        >
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