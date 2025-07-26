import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [trackingInfo, setTrackingInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchShippedOrders();
  }, []);

  const fetchShippedOrders = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/orders?status=shipped`);
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

  const handleTrackingChange = (orderId, field, value) => {
    setTrackingInfo(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value
      }
    }));
  };

  const sendTrackingInfo = async () => {
    if (selectedOrders.length === 0) {
      showToast('Please select at least one order', 'error');
      return;
    }

    // Validate tracking info for selected orders
    for (const orderId of selectedOrders) {
      if (!trackingInfo[orderId]?.tracking_number) {
        showToast('Please provide tracking numbers for all selected orders', 'error');
        return;
      }
    }

    setSending(true);

    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/orders/send-tracking`, {
        method: 'POST',
        body: JSON.stringify({
          orders: selectedOrders.map(orderId => ({
            order_id: orderId,
            tracking_number: trackingInfo[orderId].tracking_number,
            carrier: trackingInfo[orderId].carrier || 'Standard Shipping',
            estimated_delivery: trackingInfo[orderId].estimated_delivery
          }))
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      showToast(`Tracking information sent for ${selectedOrders.length} orders`, 'success');
      setSelectedOrders([]);
      setTrackingInfo({});
    } catch (error) {
      showToast(error.message || 'Failed to send tracking information', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-order-tracking">
        <div className="container">
          <p>Loading shipped orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-order-tracking">
      <div className="container">
        <div className="tracking-header">
          <h1>📍 Send Tracking Information</h1>
          <button
            onClick={() => navigate('/admin/orders')}
            className="btn btn-outline"
          >
            ← Back to Orders
          </button>
        </div>

        <div className="tracking-content">
          <div className="tracking-controls">
            <div className="control-info">
              <p>Add tracking information for shipped orders and notify customers.</p>
              <p><strong>Selected:</strong> {selectedOrders.length} orders</p>
            </div>
            
            <button
              onClick={sendTrackingInfo}
              disabled={sending || selectedOrders.length === 0}
              className="btn btn-primary"
            >
              {sending ? 'Sending...' : '📧 Send Tracking Info'}
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="no-orders">
              <h3>No shipped orders found</h3>
              <p>Only shipped orders can have tracking information sent.</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div 
                  key={order._id} 
                  className={`tracking-order-card ${selectedOrders.includes(order._id) ? 'selected' : ''}`}
                >
                  <div className="order-header" onClick={() => handleOrderSelect(order._id)}>
                    <div className="order-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleOrderSelect(order._id)}
                      />
                    </div>
                    
                    <div className="order-basic-info">
                      <h4>Order #{order.order_number || order._id.slice(-8)}</h4>
                      <div className="order-summary">
                        <span>{order.user_info?.full_name || 'Unknown'}</span>
                        <span>${order.total_amount?.toFixed(2) || '0.00'}</span>
                        <span className={`status ${order.status}`}>{order.status}</span>
                      </div>
                    </div>
                  </div>

                  {selectedOrders.includes(order._id) && (
                    <div className="tracking-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Tracking Number *</label>
                          <input
                            type="text"
                            value={trackingInfo[order._id]?.tracking_number || ''}
                            onChange={(e) => handleTrackingChange(order._id, 'tracking_number', e.target.value)}
                            className="form-input"
                            placeholder="Enter tracking number"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Carrier</label>
                          <select
                            value={trackingInfo[order._id]?.carrier || 'Standard Shipping'}
                            onChange={(e) => handleTrackingChange(order._id, 'carrier', e.target.value)}
                            className="form-select"
                          >
                            <option value="Standard Shipping">Standard Shipping</option>
                            <option value="FedEx">FedEx</option>
                            <option value="UPS">UPS</option>
                            <option value="USPS">USPS</option>
                            <option value="DHL">DHL</option>
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label>Estimated Delivery</label>
                          <input
                            type="date"
                            value={trackingInfo[order._id]?.estimated_delivery || ''}
                            onChange={(e) => handleTrackingChange(order._id, 'estimated_delivery', e.target.value)}
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div className="customer-info">
                        <h5>Customer Details:</h5>
                        <p><strong>Email:</strong> {order.user_info?.email || 'Unknown'}</p>
                        <p><strong>Phone:</strong> {order.user_info?.phone || 'Not provided'}</p>
                      </div>

                      <div className="order-items">
                        <h5>Items ({order.items?.length || 0}):</h5>
                        <div className="items-list">
                          {order.items?.map((item, index) => (
                            <div key={index} className="item">
                              <span>{item.product?.name || 'Unknown Product'}</span>
                              <span>Qty: {item.quantity}</span>
                              <span>${(item.product?.price * item.quantity)?.toFixed(2) || '0.00'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;