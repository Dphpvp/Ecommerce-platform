import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';
// Styles included in main theme

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/dashboard`);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      showToast('Failed to fetch dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return <div className="container"><p>Loading dashboard...</p></div>;
  if (!dashboardData) return <div className="container"><p>Failed to load dashboard</p></div>;

  const { statistics, recent_orders, low_stock_products } = dashboardData;

  // Quick Action Handlers
  const handleBulkShipOrders = async () => {
    try {
      const result = await makeAuthenticatedRequest(`${API_BASE}/admin/orders/bulk-ship`, {
        method: 'POST'
      });
      showToast(`${result.updated_count} orders marked as shipped`, 'success');
      fetchDashboardData();
    } catch (error) {
      showToast('Failed to ship orders', 'error');
    }
  };

  const handleExportInventory = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/admin/products/export`, {
        method: 'GET'
      });
      
      // Create and download CSV
      const csvContent = "data:text/csv;charset=utf-8," + response.csv_data;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `inventory_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Inventory exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export inventory', 'error');
    }
  };

  const handleGenerateSalesReport = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/admin/reports/sales`, {
        method: 'GET'
      });
      
      // Create and download report
      const reportContent = "data:text/csv;charset=utf-8," + response.report_data;
      const encodedUri = encodeURI(reportContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Sales report generated successfully', 'success');
    } catch (error) {
      showToast('Failed to generate sales report', 'error');
    }
  };

  const handleExportCustomers = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/admin/users/export`, {
        method: 'GET'
      });
      
      const csvContent = "data:text/csv;charset=utf-8," + response.csv_data;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `customers_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Customer list exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export customers', 'error');
    }
  };

  const handleBackupDatabase = async () => {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/system/backup`, {
        method: 'POST'
      });
      showToast('Database backup initiated successfully', 'success');
    } catch (error) {
      showToast('Failed to backup database', 'error');
    }
  };

  const handleClearCache = async () => {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/system/clear-cache`, {
        method: 'POST'
      });
      showToast('Cache cleared successfully', 'success');
    } catch (error) {
      showToast('Failed to clear cache', 'error');
    }
  };

  const handleProcessRefunds = async () => {
    try {
      const result = await makeAuthenticatedRequest(`${API_BASE}/admin/orders/process-refunds`, {
        method: 'POST'
      });
      showToast(`${result.processed_count} refunds processed`, 'success');
      fetchDashboardData();
    } catch (error) {
      showToast('Failed to process refunds', 'error');
    }
  };

  const handleSendNewsletter = () => {
    // Navigate to newsletter composition page
    navigate('/admin/newsletter/compose');
  };

  const handleRunHealthCheck = async () => {
    try {
      const result = await makeAuthenticatedRequest(`${API_BASE}/admin/system/health-check`, {
        method: 'GET'
      });
      showToast(`System Health: ${result.status}`, result.status === 'healthy' ? 'success' : 'warning');
    } catch (error) {
      showToast('Failed to run health check', 'error');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1>Admin Dashboard</h1>
        
        {/* Order Statistics */}
        <div className="dashboard-section">
          <h2>Order Statistics</h2>
          <div className="dashboard-stats">
            <div className="stat-card total clickable" onClick={() => navigate('/admin/orders')}>
              <h3>Total Orders</h3>
              <p className="stat-number">{statistics.orders?.total_orders || 0}</p>
            </div>
            <div className="stat-card pending clickable" onClick={() => navigate('/admin/orders?status=pending')}>
              <h3>Pending</h3>
              <p className="stat-number">{statistics.orders?.pending_orders || 0}</p>
            </div>
            <div className="stat-card accepted clickable" onClick={() => navigate('/admin/orders?status=accepted')}>
              <h3>Accepted</h3>
              <p className="stat-number">{statistics.orders?.accepted_orders || 0}</p>
            </div>
            <div className="stat-card processing clickable" onClick={() => navigate('/admin/orders?status=processing')}>
              <h3>Processing</h3>
              <p className="stat-number">{statistics.orders?.processing_orders || 0}</p>
            </div>
            <div className="stat-card shipped clickable" onClick={() => navigate('/admin/orders?status=shipped')}>
              <h3>Shipped</h3>
              <p className="stat-number">{statistics.orders?.shipped_orders || 0}</p>
            </div>
            <div className="stat-card delivered clickable" onClick={() => navigate('/admin/orders?status=delivered')}>
              <h3>Delivered</h3>
              <p className="stat-number">{statistics.orders?.delivered_orders || 0}</p>
            </div>
          </div>
        </div>

        {/* Revenue and Users */}
        <div className="dashboard-section">
          <h2>Revenue & Users</h2>
          <div className="dashboard-stats">
            <div className="stat-card revenue clickable" onClick={() => navigate('/admin/orders')}>
              <h3>Total Revenue</h3>
              <p className="stat-number">${statistics.revenue?.total_revenue?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="stat-card users clickable" onClick={() => navigate('/admin/users')}>
              <h3>Total Users</h3>
              <p className="stat-number">{statistics.users?.total_users || 0}</p>
            </div>
            <div className="stat-card admins clickable" onClick={() => navigate('/admin/users?role=admin')}>
              <h3>Admin Users</h3>
              <p className="stat-number">{statistics.users?.admin_users || 0}</p>
            </div>
            <div className="stat-card products clickable" onClick={() => navigate('/admin/products')}>
              <h3>Total Products</h3>
              <p className="stat-number">{statistics.products?.total_products || 0}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="dashboard-section">
          <h2>🚀 Quick Actions</h2>
          <div className="quick-actions-grid">
            
            {/* Inventory Quick Actions */}
            <div className="quick-actions-widget">
              <h3>📦 Inventory</h3>
              <div className="action-buttons">
                <button onClick={() => navigate('/admin/products/new')} className="btn-quick primary">
                  ➕ Add Product
                </button>
                <button onClick={handleExportInventory} className="btn-quick">
                  📥 Export Inventory
                </button>
                <button onClick={() => navigate('/admin/products/import')} className="btn-quick">
                  📤 Import Products
                </button>
                <button onClick={() => navigate('/admin/products/bulk-update')} className="btn-quick">
                  💰 Bulk Update Prices
                </button>
              </div>
            </div>

            {/* Order Quick Actions */}
            <div className="quick-actions-widget">
              <h3>📋 Orders</h3>
              <div className="action-buttons">
                <button onClick={handleBulkShipOrders} className="btn-quick primary">
                  🚚 Ship Ready Orders
                </button>
                <button onClick={() => navigate('/admin/orders/labels')} className="btn-quick">
                  🏷️ Print Labels
                </button>
                <button onClick={handleProcessRefunds} className="btn-quick">
                  💳 Process Refunds
                </button>
                <button onClick={() => navigate('/admin/orders/tracking')} className="btn-quick">
                  📍 Send Tracking
                </button>
              </div>
            </div>

            {/* User Management Quick Actions */}
            <div className="quick-actions-widget">
              <h3>👥 Users</h3>
              <div className="action-buttons">
                <button onClick={handleExportCustomers} className="btn-quick">
                  📊 Export Customers
                </button>
                <button onClick={handleSendNewsletter} className="btn-quick">
                  📧 Send Newsletter
                </button>
                <button onClick={() => navigate('/admin/users/new')} className="btn-quick">
                  👤 Create Admin
                </button>
                <button onClick={() => navigate('/admin/users/suspended')} className="btn-quick">
                  🚫 Manage Bans
                </button>
              </div>
            </div>

            {/* Financial Quick Actions */}
            <div className="quick-actions-widget">
              <h3>💰 Financial</h3>
              <div className="action-buttons">
                <button onClick={handleGenerateSalesReport} className="btn-quick primary">
                  📈 Sales Report
                </button>
                <button onClick={() => navigate('/admin/reports/tax')} className="btn-quick">
                  🧾 Tax Report
                </button>
                <button onClick={() => navigate('/admin/payments/pending')} className="btn-quick">
                  💳 Pending Payments
                </button>
                <button onClick={() => navigate('/admin/reports/reconcile')} className="btn-quick">
                  ⚖️ Reconcile
                </button>
              </div>
            </div>

            {/* System Quick Actions */}
            <div className="quick-actions-widget">
              <h3>🔧 System</h3>
              <div className="action-buttons">
                <button onClick={handleBackupDatabase} className="btn-quick">
                  💾 Backup DB
                </button>
                <button onClick={handleClearCache} className="btn-quick">
                  🗑️ Clear Cache
                </button>
                <button onClick={handleRunHealthCheck} className="btn-quick">
                  🏥 Health Check
                </button>
                <button onClick={() => navigate('/admin/system/logs')} className="btn-quick">
                  📋 View Logs
                </button>
              </div>
            </div>

            {/* Analytics Quick Actions */}
            <div className="quick-actions-widget">
              <h3>📊 Analytics</h3>
              <div className="action-buttons">
                <button onClick={() => navigate('/admin/analytics/daily')} className="btn-quick primary">
                  📅 Daily Summary
                </button>
                <button onClick={() => navigate('/admin/analytics/products')} className="btn-quick">
                  🏆 Top Products
                </button>
                <button onClick={() => navigate('/admin/analytics/customers')} className="btn-quick">
                  📈 Customer Growth
                </button>
                <button onClick={() => navigate('/admin/analytics/search')} className="btn-quick">
                  🔍 Search Analytics
                </button>
              </div>
            </div>

          </div>
        </div>

        <div className="dashboard-content">
          {/* Recent Orders */}
          <div className="dashboard-section">
            <h2>Recent Orders</h2>
            <div className="recent-orders">
              {recent_orders?.length > 0 ? recent_orders.map(order => (
                <div key={order._id} className="recent-order-item clickable" onClick={() => navigate(`/admin/orders/${order._id}`)}>
                  <div className="order-info">
                    <strong>#{order._id.slice(-8)}</strong>
                    <span>{order.customer_name || 'Unknown'}</span>
                    <span>{order.customer_email || 'Unknown'}</span>
                    <span>${order.total_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <span className={`status ${order.status}`}>{order.status}</span>
                </div>
              )) : (
                <p>No recent orders found</p>
              )}
            </div>
            <Link to="/admin/orders" className="btn btn-primary">View All Orders</Link>
          </div>

          {/* Low Stock Alert */}
          {low_stock_products?.length > 0 && (
            <div className="dashboard-section">
              <h2>⚠️ Low Stock Alert</h2>
              <div className="low-stock-items">
                {low_stock_products.map(product => (
                  <div key={product._id} className="low-stock-item clickable" onClick={() => navigate(`/admin/products/${product._id}`)}>
                    <span>{product.name}</span>
                    <span className="stock-count">Stock: {product.stock}</span>
                    <span className="category">{product.category}</span>
                  </div>
                ))}
              </div>
              <Link to="/admin/products" className="btn btn-outline">Manage Products</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;