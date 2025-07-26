import React from 'react';
import { useNavigate } from 'react-router-dom';

const SearchAnalytics = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-search-analytics">
      <div className="container">
        <div className="analytics-header">
          <h1>🔍 Search Analytics</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn btn-outline"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="analytics-content">
          <h3>Search Behavior Analytics</h3>
          <p>Analyze what customers are searching for and optimize your inventory.</p>
          <p>Coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default SearchAnalytics;