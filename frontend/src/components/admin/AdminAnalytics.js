import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const AdminAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/analytics/sales`);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      showToast('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest, showToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const calculateTotalRevenue = () => {
    if (!analyticsData?.daily_sales) return 0;
    return analyticsData.daily_sales.reduce((total, day) => total + day.total_sales, 0);
  };

  const calculateTotalOrders = () => {
    if (!analyticsData?.daily_sales) return 0;
    return analyticsData.daily_sales.reduce((total, day) => total + day.order_count, 0);
  };

  const calculateAverageOrderValue = () => {
    const totalRevenue = calculateTotalRevenue();
    const totalOrders = calculateTotalOrders();
    return totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const exportAnalytics = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/admin/reports/sales?days=${timeRange}`);
      
      // Create and download CSV
      const csvContent = "data:text/csv;charset=utf-8," + response.report_data;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `sales_analytics_${timeRange}days_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Analytics report exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export analytics:', error);
      showToast('Failed to export analytics report', 'error');
    }
  };

  if (loading) {
    return (
      <div className="admin-analytics">
        <div className="container">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="admin-analytics">
        <div className="container">
          <div className="no-data">
            <h3>No Analytics Data Available</h3>
            <p>Unable to load sales analytics at this time.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-analytics">
      <div className="container">
        <div className="page-header">
          <h1>Sales Analytics Dashboard</h1>
          <p>Comprehensive sales performance and product analytics</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="metrics-grid">
          <div className="metric-card revenue">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <h3>Total Revenue</h3>
              <div className="metric-value">{formatCurrency(calculateTotalRevenue())}</div>
              <div className="metric-period">Last 30 days</div>
            </div>
          </div>

          <div className="metric-card orders">
            <div className="metric-icon">📦</div>
            <div className="metric-content">
              <h3>Total Orders</h3>
              <div className="metric-value">{calculateTotalOrders()}</div>
              <div className="metric-period">Last 30 days</div>
            </div>
          </div>

          <div className="metric-card aov">
            <div className="metric-icon">🛒</div>
            <div className="metric-content">
              <h3>Average Order Value</h3>
              <div className="metric-value">{formatCurrency(calculateAverageOrderValue())}</div>
              <div className="metric-period">Last 30 days</div>
            </div>
          </div>

          <div className="metric-card products">
            <div className="metric-icon">🏆</div>
            <div className="metric-content">
              <h3>Top Products</h3>
              <div className="metric-value">{analyticsData.top_products?.length || 0}</div>
              <div className="metric-period">Best sellers</div>
            </div>
          </div>
        </div>

        {/* Daily Sales Chart */}
        <div className="analytics-section">
          <div className="section-header">
            <h2>Daily Sales Trend</h2>
            <div className="section-actions">
              <button 
                className="export-btn"
                onClick={exportAnalytics}
              >
                📊 Export Report
              </button>
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-wrapper">
              {analyticsData.daily_sales && analyticsData.daily_sales.length > 0 ? (
                <div className="simple-bar-chart">
                  {analyticsData.daily_sales.map((day, index) => {
                    const maxSales = Math.max(...analyticsData.daily_sales.map(d => d.total_sales));
                    const height = maxSales > 0 ? (day.total_sales / maxSales) * 200 : 0;
                    
                    return (
                      <div key={index} className="chart-bar-container">
                        <div className="chart-value">{formatCurrency(day.total_sales)}</div>
                        <div 
                          className="chart-bar"
                          style={{ height: `${height}px` }}
                          title={`${formatDate(day._id)}: ${formatCurrency(day.total_sales)} (${day.order_count} orders)`}
                        ></div>
                        <div className="chart-label">{formatDate(day._id)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-chart-data">
                  <p>No sales data available for the selected period</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="analytics-section">
          <div className="section-header">
            <h2>Top Performing Products</h2>
            <p>Best selling products by quantity sold</p>
          </div>

          <div className="top-products-table">
            {analyticsData.top_products && analyticsData.top_products.length > 0 ? (
              <div className="products-grid">
                {analyticsData.top_products.map((product, index) => (
                  <div key={index} className="product-performance-card">
                    <div className="product-rank">#{index + 1}</div>
                    <div className="product-details">
                      <h4>{product._id}</h4>
                      <div className="product-metrics">
                        <div className="metric">
                          <span className="metric-label">Sold:</span>
                          <span className="metric-value">{product.total_sold} units</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Revenue:</span>
                          <span className="metric-value">{formatCurrency(product.total_revenue)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-products-data">
                <p>No product sales data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="analytics-actions">
          <button
            className="action-btn secondary"
            onClick={fetchAnalytics}
          >
            🔄 Refresh Data
          </button>
          
          <button
            className="action-btn primary"
            onClick={exportAnalytics}
          >
            📄 Export Full Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;