import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const DailyAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDailyAnalytics();
  }, [selectedDate]);

  const fetchDailyAnalytics = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/analytics/daily?date=${selectedDate}`);
      setAnalytics(data);
    } catch (error) {
      showToast('Failed to fetch daily analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-daily-analytics">
        <div className="container">
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-daily-analytics">
      <div className="container">
        <div className="analytics-header">
          <h1>📅 Daily Analytics</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn btn-outline"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="date-selector">
          <label>Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="analytics-content">
          {analytics ? (
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>Orders</h3>
                <p className="metric">{analytics.orders || 0}</p>
              </div>
              <div className="analytics-card">
                <h3>Revenue</h3>
                <p className="metric">${analytics.revenue?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="analytics-card">
                <h3>New Users</h3>
                <p className="metric">{analytics.new_users || 0}</p>
              </div>
              <div className="analytics-card">
                <h3>Page Views</h3>
                <p className="metric">{analytics.page_views || 0}</p>
              </div>
            </div>
          ) : (
            <p>No analytics data available for this date.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyAnalytics;