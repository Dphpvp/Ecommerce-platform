import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const TaxReport = () => {
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });
  const [generating, setGenerating] = useState(false);
  
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const generateTaxReport = async () => {
    if (!dateRange.start_date || !dateRange.end_date) {
      showToast('Please select both start and end dates', 'error');
      return;
    }

    setGenerating(true);

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/admin/reports/tax`, {
        method: 'POST',
        body: JSON.stringify(dateRange),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Download the generated report
      const csvContent = "data:text/csv;charset=utf-8," + response.csv_data;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `tax_report_${dateRange.start_date}_to_${dateRange.end_date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Tax report generated successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to generate tax report', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="admin-tax-report">
      <div className="container">
        <div className="tax-report-header">
          <h1>🧾 Tax Report</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn btn-outline"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="tax-report-content">
          <div className="report-form">
            <h3>Generate Tax Report</h3>
            <p>Generate a comprehensive tax report for the specified date range.</p>

            <div className="form-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>End Date:</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                className="form-input"
              />
            </div>

            <button
              onClick={generateTaxReport}
              disabled={generating}
              className="btn btn-primary"
            >
              {generating ? 'Generating...' : '📊 Generate Tax Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxReport;