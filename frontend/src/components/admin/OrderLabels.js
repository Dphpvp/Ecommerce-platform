import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const OrderLabels = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReadyOrders();
  }, []);

  const fetchReadyOrders = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/orders?status=accepted`);
      setOrders(data.orders || []);
    } catch (error) {
      showToast('Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o._id));
    }
  };

  const generateLabels = async () => {
    if (selectedOrders.length === 0) {
      showToast('Please select at least one order', 'error');
      return;
    }

    setGenerating(true);

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/admin/orders/generate-labels`, {
        method: 'POST',
        body: JSON.stringify({
          order_ids: selectedOrders
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Download the generated PDF
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${response.pdf_data}`;
      link.download = `shipping_labels_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Generated labels for ${selectedOrders.length} orders`, 'success');
      setSelectedOrders([]);
    } catch (error) {
      showToast(error.message || 'Failed to generate labels', 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-order-labels">
        <div className="container">
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-order-labels">
      <div className="container">
        <div className="labels-header">
          <h1>🏷️ Print Shipping Labels</h1>
          <button
            onClick={() => navigate('/admin/orders')}
            className="btn btn-outline"
          >
            ← Back to Orders
          </button>
        </div>

        <div className="labels-content">
          <div className="labels-controls">
            <div className="control-info">
              <p>Select orders to generate shipping labels for. Only accepted orders are shown.</p>
              <p><strong>Selected:</strong> {selectedOrders.length} orders</p>
            </div>
            
            <div className="control-actions">
              <button onClick={handleSelectAll} className="btn btn-outline">
                {selectedOrders.length === orders.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={generateLabels}
                disabled={generating || selectedOrders.length === 0}
                className="btn btn-primary"
              >
                {generating ? 'Generating...' : '🖨️ Generate Labels'}
              </button>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="no-orders">
              <h3>No orders ready for labeling</h3>
              <p>Only accepted orders can have labels generated.</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div 
                  key={order._id} 
                  className={`order-card ${selectedOrders.includes(order._id) ? 'selected' : ''}`}
                  onClick={() => handleOrderSelect(order._id)}
                >
                  <div className="order-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleOrderSelect(order._id)}
                    />
                  </div>
                  
                  <div className="order-info">
                    <h4>Order #{order.order_number || order._id.slice(-8)}</h4>
                    <div className="order-details">
                      <div className="detail-group">
                        <span className="label">Customer:</span>
                        <span>{order.user_info?.full_name || 'Unknown'}</span>
                      </div>
                      <div className="detail-group">
                        <span className="label">Email:</span>
                        <span>{order.user_info?.email || 'Unknown'}</span>
                      </div>
                      <div className="detail-group">
                        <span className="label">Total:</span>
                        <span>${order.total_amount?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="detail-group">
                        <span className="label">Items:</span>
                        <span>{order.items?.length || 0} items</span>
                      </div>
                    </div>
                  </div>

                  <div className="order-address">
                    <h5>Shipping Address:</h5>
                    {order.shipping_address ? (
                      <div className="address">
                        <p>{order.shipping_address.street}</p>
                        <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                        <p>{order.shipping_address.country}</p>
                      </div>
                    ) : (
                      <p className="no-address">No shipping address provided</p>
                    )}
                  </div>

                  <div className="order-status">
                    <span className={`status ${order.status}`}>{order.status}</span>
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

export default OrderLabels;