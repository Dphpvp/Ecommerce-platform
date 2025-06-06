import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin.css';

const API_BASE = 'http://localhost:8000/api';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        alert('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><p>Loading dashboard...</p></div>;
  if (!dashboardData) return <div className="container"><p>Failed to load dashboard</p></div>;

  const { statistics, recent_orders, low_stock_products } = dashboardData;

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1>Admin Dashboard</h1>
        
        {/* Order Statistics */}
        <div className="dashboard-section">
          <h2>Order Statistics</h2>
          <div className="dashboard-stats">
            <div className="stat-card total">
              <h3>Total Orders</h3>
              <p className="stat-number">{statistics.orders.total_orders}</p>
            </div>
            <div className="stat-card pending">
              <h3>Pending</h3>
              <p className="stat-number">{statistics.orders.pending_orders}</p>
            </div>
            <div className="stat-card accepted">
              <h3>Accepted</h3>
              <p className="stat-number">{statistics.orders.accepted_orders}</p>
            </div>
            <div className="stat-card processing">
              <h3>Processing</h3>
              <p className="stat-number">{statistics.orders.processing_orders}</p>
            </div>
            <div className="stat-card shipped">
              <h3>Shipped</h3>
              <p className="stat-number">{statistics.orders.shipped_orders}</p>
            </div>
            <div className="stat-card delivered">
              <h3>Delivered</h3>
              <p className="stat-number">{statistics.orders.delivered_orders}</p>
            </div>
          </div>
        </div>

        {/* Revenue and Users */}
        <div className="dashboard-section">
          <h2>Revenue & Users</h2>
          <div className="dashboard-stats">
            <div className="stat-card revenue">
              <h3>Total Revenue</h3>
              <p className="stat-number">${statistics.revenue.total_revenue.toFixed(2)}</p>
            </div>
            <div className="stat-card users">
              <h3>Total Users</h3>
              <p className="stat-number">{statistics.users.total_users}</p>
            </div>
            <div className="stat-card admins">
              <h3>Admin Users</h3>
              <p className="stat-number">{statistics.users.admin_users}</p>
            </div>
            <div className="stat-card products">
              <h3>Total Products</h3>
              <p className="stat-number">{statistics.products.total_products}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Recent Orders */}
          <div className="dashboard-section">
            <h2>Recent Orders</h2>
            <div className="recent-orders">
              {recent_orders.map(order => (
                <div key={order._id} className="recent-order-item">
                  <div className="order-info">
                    <strong>#{order._id.slice(-8)}</strong>
                    <span>{order.customer_name}</span>
                    <span>{order.customer_email}</span>
                    <span>${order.total_amount.toFixed(2)}</span>
                  </div>
                  <span className={`status ${order.status}`}>{order.status}</span>
                </div>
              ))}
            </div>
            <Link to="/admin/orders" className="btn btn-primary">View All Orders</Link>
          </div>

          {/* Low Stock Alert */}
          {low_stock_products.length > 0 && (
            <div className="dashboard-section">
              <h2>⚠️ Low Stock Alert</h2>
              <div className="low-stock-items">
                {low_stock_products.map(product => (
                  <div key={product._id} className="low-stock-item">
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