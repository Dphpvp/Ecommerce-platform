import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (userId, isAdmin) => {
    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_admin: isAdmin })
      });

      if (response.ok) {
        const roleText = isAdmin ? 'admin' : 'regular user';
        alert(`User role updated to ${roleText}`);
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role');
    }
  };

  if (loading) return <div className="container"><p>Loading users...</p></div>;

  return (
    <div className="admin-users">
      <div className="container">
        <h1>User Management</h1>
        
        <div className="users-list">
          {users.map(user => (
            <div key={user._id} className="user-card">
              <div className="user-info">
                <h3>{user.full_name}</h3>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
                <p><strong>Address:</strong> {user.address || 'Not provided'}</p>
                <p><strong>Orders:</strong> {user.order_count}</p>
                <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="user-actions">
                <div className="role-section">
                  <span className={`role-badge ${user.is_admin ? 'admin' : 'user'}`}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                  <div className="role-controls">
                    <button
                      onClick={() => updateUserRole(user._id, !user.is_admin)}
                      className={`btn ${user.is_admin ? 'btn-danger' : 'btn-primary'}`}
                    >
                      {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="no-users">
            <p>No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;