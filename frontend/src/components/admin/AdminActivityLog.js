import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const AdminActivityLog = () => {
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();

  const fetchActivityLog = useCallback(async () => {
    try {
      setLoading(true);
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/activity-log`);
      setActivityLog(data.activity_log || []);
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
      showToast('Failed to load activity log', 'error');
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest, showToast]);

  useEffect(() => {
    fetchActivityLog();
  }, [fetchActivityLog]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (isAdmin) => {
    return isAdmin ? '#10b981' : '#ef4444';
  };

  const getActionText = (entry) => {
    if (entry.admin_updated_at && entry.admin_updated_by) {
      return entry.is_admin ? 'Admin privileges granted' : 'Admin privileges removed';
    }
    return entry.is_admin ? 'Current admin' : 'Regular user';
  };

  const filteredLog = activityLog.filter(entry => {
    if (dateFilter === 'all') return true;
    if (!entry.admin_updated_at) return false;
    
    const entryDate = new Date(entry.admin_updated_at);
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return entryDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return entryDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return entryDate >= monthAgo;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="admin-activity-log">
        <div className="container">
          <div className="loading-spinner"></div>
          <p>Loading activity log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-activity-log">
      <div className="container">
        <div className="page-header">
          <h1>Admin Activity Log</h1>
          <p>Track all admin role changes and system activities</p>
        </div>

        {/* Filters */}
        <div className="filter-section">
          <div className="filter-group">
            <label>Filter by Date:</label>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          
          <div className="activity-stats">
            <span className="stat-item">
              Total Activities: <strong>{filteredLog.length}</strong>
            </span>
          </div>
        </div>

        {/* Activity Log Table */}
        <div className="activity-log-section">
          {filteredLog.length === 0 ? (
            <div className="no-activity">
              <div className="no-activity-icon">
                📋
              </div>
              <h3>No Activity Found</h3>
              <p>No admin activities match your current filter criteria.</p>
            </div>
          ) : (
            <div className="activity-table">
              <div className="table-header">
                <div className="table-row header-row">
                  <div className="table-cell">User</div>
                  <div className="table-cell">Action</div>
                  <div className="table-cell">Performed By</div>
                  <div className="table-cell">Date</div>
                  <div className="table-cell">Status</div>
                </div>
              </div>
              
              <div className="table-body">
                {filteredLog.map((entry, index) => (
                  <div key={entry._id || index} className="table-row">
                    <div className="table-cell">
                      <div className="user-info">
                        <strong>{entry.full_name || 'Unknown'}</strong>
                        <small>{entry.email}</small>
                      </div>
                    </div>
                    
                    <div className="table-cell">
                      <span 
                        className="action-badge"
                        style={{ color: getActionColor(entry.is_admin) }}
                      >
                        {getActionText(entry)}
                      </span>
                    </div>
                    
                    <div className="table-cell">
                      {entry.admin_updated_by || 'System'}
                    </div>
                    
                    <div className="table-cell">
                      {formatDate(entry.admin_updated_at || entry.created_at)}
                    </div>
                    
                    <div className="table-cell">
                      <span className={`status-badge ${entry.is_admin ? 'admin' : 'user'}`}>
                        {entry.is_admin ? 'Admin' : 'User'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="action-section">
          <button
            className="export-btn"
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," + 
                "User,Email,Action,Performed By,Date,Current Status\n" +
                filteredLog.map(entry => 
                  `"${entry.full_name || 'Unknown'}","${entry.email}","${getActionText(entry)}","${entry.admin_updated_by || 'System'}","${formatDate(entry.admin_updated_at || entry.created_at)}","${entry.is_admin ? 'Admin' : 'User'}"`
                ).join("\n");
              
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `admin_activity_log_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              showToast('Activity log exported successfully', 'success');
            }}
          >
            📄 Export to CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityLog;