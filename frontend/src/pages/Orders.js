import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


import '../styles/index.css';
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { makeAuthenticatedRequest } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await makeAuthenticatedRequest(`${API_BASE}/orders`);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#ffc107",
      accepted: "#17a2b8",
      processing: "#007bff",
      shipped: "#28a745",
      delivered: "#6c757d",
      cancelled: "#dc3545",
    };
    return colors[status] || "#6c757d";
  };

  if (loading) {
    return (
      <div className="orders">
        <div className="container">
          <h1>My Orders</h1>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="luxury-orders-page">
      <div className="container">
        {/* Luxury Header Section */}
        <div className="luxury-orders-header">
          <div className="orders-hero-content">
            <div className="orders-badge">Order History</div>
            <h1 className="orders-title">My Orders</h1>
            <p className="orders-subtitle">Track and manage your purchase history</p>
          </div>
          <div className="orders-hero-decoration">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
        </div>
        
        {orders.length === 0 ? (
          <div className="luxury-no-orders">
            <div className="no-orders-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <h3 className="no-orders-title">No Orders Yet</h3>
            <p className="no-orders-text">You haven't placed any orders yet. Start shopping to see your order history here.</p>
            <Link to="/products" className="btn-luxury-solid">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="luxury-orders-grid">
            {orders.map(order => (
              <div key={order._id} className="luxury-order-card">
                <div className="order-card-header">
                  <div className="order-number-section">
                    <div className="order-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    </div>
                    <div className="order-number-info">
                      <h3 className="order-number">#{order.order_number || order._id.slice(-8)}</h3>
                      <p className="order-date">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className={`order-status order-status-${order.status}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </div>
                
                <div className="order-card-content">
                  <div className="order-summary">
                    <div className="summary-item">
                      <span className="summary-label">Total Amount</span>
                      <span className="summary-value">${order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Items</span>
                      <span className="summary-value">{order.items?.length || 0} items</span>
                    </div>
                  </div>
                  
                  {order.items && order.items.length > 0 && (
                    <div className="order-items-preview">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="item-preview">
                          <img
                            src={item.product?.image_url || '/images/placeholder-product.jpg'}
                            alt={item.product?.name}
                            className="item-preview-image"
                            onError={(e) => {
                              e.target.src = '/images/placeholder-product.jpg';
                            }}
                          />
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="item-preview-more">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="order-card-actions">
                  <button
                    className="btn-luxury-outline btn-view-details"
                    onClick={() => openModal(order)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={closeModal}>
          {selectedOrder && (
            <div className="luxury-order-modal">
              <div className="modal-header-luxury">
                <div className="modal-title-section">
                  <h2 className="modal-order-title">Order Details</h2>
                  <div className="modal-order-number">#{selectedOrder.order_number || selectedOrder._id.slice(-8)}</div>
                </div>
                <div className={`modal-status order-status-${selectedOrder.status}`}>
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </div>
              </div>

              <div className="modal-content-luxury">
                <div className="order-info-section">
                  <h3 className="section-title">Order Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Order ID</span>
                      <span className="info-value">{selectedOrder._id}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Date</span>
                      <span className="info-value">{formatDate(selectedOrder.created_at)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Total Amount</span>
                      <span className="info-value total-amount">${selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.shipping_address && (
                  <div className="shipping-section">
                    <h3 className="section-title">Shipping Address</h3>
                    <div className="address-card">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <div className="address-text">
                        {selectedOrder.shipping_address.street}<br />
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zipCode}<br />
                        {selectedOrder.shipping_address.country}
                      </div>
                    </div>
                  </div>
                )}

                <div className="items-section">
                  <h3 className="section-title">Order Items</h3>
                  <div className="items-list">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="luxury-order-item">
                        <div className="item-image-container">
                          <img
                            src={item.product?.image_url || '/images/placeholder-product.jpg'}
                            alt={item.product?.name}
                            className="luxury-item-image"
                            onError={(e) => {
                              e.target.src = '/images/placeholder-product.jpg';
                            }}
                          />
                        </div>
                        <div className="item-details">
                          <h4 className="item-name">{item.product?.name}</h4>
                          <div className="item-specs">
                            <div className="spec-item">
                              <span className="spec-label">Quantity</span>
                              <span className="spec-value">{item.quantity}</span>
                            </div>
                            <div className="spec-item">
                              <span className="spec-label">Unit Price</span>
                              <span className="spec-value">${item.product?.price?.toFixed(2)}</span>
                            </div>
                            <div className="spec-item">
                              <span className="spec-label">Subtotal</span>
                              <span className="spec-value subtotal">${(item.product?.price * item.quantity)?.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || <p className="no-items">No items found</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Orders;