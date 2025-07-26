import React from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerAnalytics = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-customer-analytics">
      <div className="container">
        <div className="analytics-header">
          <h1>📈 Customer Growth Analytics</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn btn-outline"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="analytics-content">
          <h3>Customer Growth Metrics</h3>
          <p>Track customer acquisition, retention, and growth over time.</p>
          <p>Coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics;