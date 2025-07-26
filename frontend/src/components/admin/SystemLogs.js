import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logLevel, setLogLevel] = useState('all');
  
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLogs();
  }, [logLevel]);

  const fetchLogs = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/system/logs?level=${logLevel}`);
      setLogs(data.logs || []);
    } catch (error) {
      showToast('Failed to fetch system logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-system-logs">
      <div className="container">
        <div className="logs-header">
          <h1>📋 System Logs</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn btn-outline"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="logs-controls">
          <select
            value={logLevel}
            onChange={(e) => setLogLevel(e.target.value)}
            className="form-select"
          >
            <option value="all">All Logs</option>
            <option value="error">Errors Only</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div className="logs-content">
          {loading ? (
            <p>Loading logs...</p>
          ) : logs.length === 0 ? (
            <div className="no-logs">
              <h3>No logs found</h3>
              <p>No system logs available for the selected filter.</p>
            </div>
          ) : (
            <div className="logs-list">
              {logs.map((log, index) => (
                <div key={index} className={`log-entry ${log.level}`}>
                  <div className="log-timestamp">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  <div className="log-level">{log.level.toUpperCase()}</div>
                  <div className="log-message">{log.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;