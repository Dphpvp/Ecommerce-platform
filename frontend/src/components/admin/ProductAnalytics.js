import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const ProductAnalytics = () => {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProductAnalytics();
  }, []);

  const fetchProductAnalytics = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/analytics/products`);
      setTopProducts(data.top_products || []);
    } catch (error) {
      showToast('Failed to fetch product analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-product-analytics">
      <div className="container">
        <div className="analytics-header">
          <h1>🏆 Top Products Analytics</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn btn-outline"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="analytics-content">
          {loading ? (
            <p>Loading product analytics...</p>
          ) : topProducts.length === 0 ? (
            <div className="no-data">
              <h3>No product sales data available</h3>
              <p>Start selling products to see analytics here.</p>
            </div>
          ) : (
            <div className="top-products-list">
              <h3>Top Selling Products</h3>
              {topProducts.map((product, index) => (
                <div key={index} className="product-analytics-card">
                  <div className="rank">#{index + 1}</div>
                  <div className="product-info">
                    <h4>{product._id}</h4>
                    <p>Units Sold: {product.total_sold}</p>
                    <p>Revenue: ${product.total_revenue?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductAnalytics;