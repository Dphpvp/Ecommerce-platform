import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const CreateAdmin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/users/create-admin`, {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          is_admin: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      showToast('Admin user created successfully!', 'success');
      navigate('/admin/users');
    } catch (error) {
      showToast(error.message || 'Failed to create admin user', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-create-admin">
      <div className="container">
        <div className="create-admin-header">
          <h1>👤 Create Admin User</h1>
          <button
            onClick={() => navigate('/admin/users')}
            className="btn btn-outline"
          >
            ← Back to Users
          </button>
        </div>

        <div className="create-admin-content">
          <div className="form-container">
            <div className="form-intro">
              <h3>🔐 Create New Administrator</h3>
              <p>Create a new admin user with full administrative privileges. Please ensure all information is accurate.</p>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-section">
                <h4>Basic Information</h4>
                
                <div className="form-group">
                  <label htmlFor="full_name">Full Name *</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className={`form-input ${errors.full_name ? 'error' : ''}`}
                    placeholder="Enter full name"
                  />
                  {errors.full_name && <span className="error-text">{errors.full_name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter phone number (optional)"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Security</h4>
                
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Enter password (min 6 characters)"
                  />
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Confirm password"
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>
              </div>

              <div className="admin-privileges-notice">
                <div className="notice-box">
                  <h5>⚠️ Administrator Privileges</h5>
                  <p>This user will have the following permissions:</p>
                  <ul>
                    <li>Full access to admin dashboard</li>
                    <li>Manage all products and orders</li>
                    <li>Manage users and permissions</li>
                    <li>Access system settings and reports</li>
                    <li>Perform bulk operations</li>
                  </ul>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Creating Admin...
                    </>
                  ) : (
                    <>
                      ✅ Create Admin User
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/users')}
                  className="btn btn-outline"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAdmin;