import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const AdminSystemInfo = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [healthCheck, setHealthCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();

  const fetchSystemInfo = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch both debug info and health check in parallel
      const [debugData, healthData] = await Promise.all([
        makeAuthenticatedRequest(`${API_BASE}/admin/debug`),
        makeAuthenticatedRequest(`${API_BASE}/admin/system/health-check`)
      ]);
      
      setDebugInfo(debugData);
      setHealthCheck(healthData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch system info:', error);
      showToast('Failed to load system information', 'error');
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest, showToast]);

  useEffect(() => {
    fetchSystemInfo();
  }, [fetchSystemInfo]);

  const performSystemAction = async (action, actionName) => {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/system/${action}`, {
        method: 'POST'
      });
      showToast(`${actionName} completed successfully`, 'success');
      
      // Refresh system info after action
      setTimeout(fetchSystemInfo, 1000);
    } catch (error) {
      console.error(`Failed to ${actionName.toLowerCase()}:`, error);
      showToast(`Failed to ${actionName.toLowerCase()}`, 'error');
    }
  };

  const getHealthStatus = (status) => {
    switch (status) {
      case 'healthy':
        return { color: '#10b981', icon: '✅', text: 'Healthy' };
      case 'warning':
        return { color: '#f59e0b', icon: '⚠️', text: 'Warning' };
      case 'unhealthy':
        return { color: '#ef4444', icon: '❌', text: 'Unhealthy' };
      default:
        return { color: '#6b7280', icon: '❓', text: 'Unknown' };
    }
  };

  const formatUptime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const start = new Date(timestamp);
    const diffMs = now - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMins}m`;
  };

  if (loading) {
    return (
      <div className="admin-system-info">
        <div className="container">
          <div className="loading-spinner"></div>
          <p>Loading system information...</p>
        </div>
      </div>
    );
  }

  const healthStatus = healthCheck ? getHealthStatus(healthCheck.status) : getHealthStatus('unknown');

  return (
    <div className="admin-system-info">
      <div className="container">
        <div className="page-header">
          <h1>System Information & Debug</h1>
          <p>Monitor system health, database statistics, and perform maintenance tasks</p>
          {lastRefresh && (
            <div className="last-refresh">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* System Health Overview */}
        <div className="health-overview">
          <div className="health-card main-health">
            <div className="health-icon" style={{ color: healthStatus.color }}>
              {healthStatus.icon}
            </div>
            <div className="health-content">
              <h3>System Status</h3>
              <div className="health-status" style={{ color: healthStatus.color }}>
                {healthStatus.text}
              </div>
              <div className="health-time">
                {healthCheck?.timestamp ? `Checked: ${new Date(healthCheck.timestamp).toLocaleTimeString()}` : 'No data'}
              </div>
            </div>
          </div>

          {/* Health Check Details */}
          {healthCheck?.checks && (
            <div className="health-details-grid">
              {Object.entries(healthCheck.checks).map(([component, details]) => {
                const componentHealth = getHealthStatus(details.status);
                return (
                  <div key={component} className="health-detail-card">
                    <div className="health-detail-header">
                      <span className="health-detail-icon" style={{ color: componentHealth.color }}>
                        {componentHealth.icon}
                      </span>
                      <h4>{component.replace('_', ' ').toUpperCase()}</h4>
                    </div>
                    <div className="health-detail-content">
                      {details.response_time_ms && (
                        <div className="detail-metric">
                          <span>Response Time:</span>
                          <span>{details.response_time_ms}ms</span>
                        </div>
                      )}
                      {details.document_count !== undefined && (
                        <div className="detail-metric">
                          <span>Documents:</span>
                          <span>{details.document_count.toLocaleString()}</span>
                        </div>
                      )}
                      {details.connection && (
                        <div className="detail-metric">
                          <span>Connection:</span>
                          <span>{details.connection}</span>
                        </div>
                      )}
                      {details.error && (
                        <div className="detail-error">
                          Error: {details.error}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Database Statistics */}
        {debugInfo && (
          <div className="debug-section">
            <div className="section-header">
              <h2>Database Statistics</h2>
              <div className="db-health-badge" style={{ 
                color: debugInfo.database_health === 'healthy' ? '#10b981' : '#ef4444' 
              }}>
                {debugInfo.database_health === 'healthy' ? '✅ Healthy' : '⚠️ Issues Detected'}
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <h3>Total Products</h3>
                  <div className="stat-value">{debugInfo.total_products?.toLocaleString() || 0}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🏷️</div>
                <div className="stat-content">
                  <h3>Uncategorized Products</h3>
                  <div className="stat-value">{debugInfo.uncategorized_products?.toLocaleString() || 0}</div>
                  {debugInfo.uncategorized_products > 0 && (
                    <div className="stat-warning">Needs attention</div>
                  )}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⚠️</div>
                <div className="stat-content">
                  <h3>Products Missing Data</h3>
                  <div className="stat-value">{debugInfo.products_missing_data?.toLocaleString() || 0}</div>
                  {debugInfo.products_missing_data > 0 && (
                    <div className="stat-warning">Requires cleanup</div>
                  )}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>Top Categories</h3>
                  <div className="stat-value">{debugInfo.top_categories?.length || 0}</div>
                </div>
              </div>
            </div>

            {/* Top Categories */}
            {debugInfo.top_categories && debugInfo.top_categories.length > 0 && (
              <div className="categories-section">
                <h3>Category Distribution</h3>
                <div className="categories-list">
                  {debugInfo.top_categories.slice(0, 5).map((category, index) => (
                    <div key={index} className="category-item">
                      <div className="category-name">{category.name}</div>
                      <div className="category-count">{category.count} products</div>
                      <div 
                        className="category-bar"
                        style={{ 
                          width: `${(category.count / debugInfo.top_categories[0].count) * 100}%` 
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {debugInfo.error && (
              <div className="error-section">
                <h3>⚠️ System Error</h3>
                <div className="error-message">{debugInfo.error}</div>
              </div>
            )}
          </div>
        )}

        {/* System Actions */}
        <div className="system-actions">
          <div className="section-header">
            <h2>System Maintenance</h2>
          </div>

          <div className="actions-grid">
            <button
              className="action-btn refresh"
              onClick={fetchSystemInfo}
            >
              🔄 Refresh System Info
            </button>

            <button
              className="action-btn cache"
              onClick={() => performSystemAction('clear-cache', 'Cache Clear')}
            >
              🗑️ Clear Cache
            </button>

            <button
              className="action-btn backup"
              onClick={() => performSystemAction('backup', 'Database Backup')}
            >
              💾 Create Backup
            </button>

            <button
              className="action-btn health"
              onClick={() => fetchSystemInfo()}
            >
              🏥 Run Health Check
            </button>
          </div>
        </div>

        {/* System Information Footer */}
        <div className="system-footer">
          <div className="system-timestamp">
            Generated at: {debugInfo?.generated_at ? new Date(debugInfo.generated_at).toLocaleString() : 'Unknown'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemInfo;