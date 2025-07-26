import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReconcileReport = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-reconcile-report">
      <div className="container">
        <div className="reconcile-header">
          <h1>⚖️ Reconcile Report</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn btn-outline"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="reconcile-content">
          <h3>Financial Reconciliation</h3>
          <p>This feature helps reconcile financial data across different systems.</p>
          <p>Coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default ReconcileReport;