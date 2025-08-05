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
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("");
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

  // Filter and sort orders
  const filteredOrders = orders.filter(order => {
    if (!filterStatus) return true;
    return order.status === filterStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue, bValue;

    if (sortBy === "created_at") {
      aValue = new Date(a.created_at);
      bValue = new Date(b.created_at);
    } else if (sortBy === "total_amount") {
      aValue = a.total_amount || 0;
      bValue = b.total_amount || 0;
    } else if (sortBy === "status") {
      aValue = a.status || "";
      bValue = b.status || "";
    } else {
      aValue = a[sortBy] || "";
      bValue = b[sortBy] || "";
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const statusOptions = [
    { value: "", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const sortOptions = [
    { value: "created_at", label: "Date" },
    { value: "total_amount", label: "Amount" },
    { value: "status", label: "Status" },
  ];

  if (loading) {
    return (
      <div className="modern-orders-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <h2>Loading Your Orders</h2>
            <p>Please wait while we fetch your order history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-orders-page">
      <div className="container">
        {/* Modern Header Section */}
        <div className="orders-header-modern">
          <div className="header-content">
            <h1 className="orders-title-modern">My Orders</h1>
            <p className="orders-subtitle-modern">Track and manage your purchase history</p>
          </div>
          <div className="orders-stats">
            <div className="stat-card">
              <span className="stat-number">{orders.length}</span>
              <span className="stat-label">Total Orders</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">${orders.reduce((sum, order) => sum + (order.total_amount || 0), 0).toFixed(0)}</span>
              <span className="stat-label">Total Spent</span>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        {orders.length > 0 && (
          <div className="orders-controls">
            <div className="filter-section">
              <h3 className="section-title">Filter by Status</h3>
              <div className="filter-buttons">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilterStatus(option.value)}
                    className={`filter-btn ${filterStatus === option.value ? 'active' : ''}`}
                    style={
                      filterStatus === option.value && option.value
                        ? { backgroundColor: getStatusColor(option.value), color: 'white' }
                        : filterStatus === option.value
                        ? { backgroundColor: '#3b82f6', color: 'white' }
                        : {}
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sort-section">
              <h3 className="section-title">Sort Orders</h3>
              <div className="sort-controls">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="sort-order-btn"
                  title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {sortOrder === "asc" ? (
                      <path d="M12 19V5M5 12l7-7 7 7"/>
                    ) : (
                      <path d="M12 5v14M19 12l-7 7-7-7"/>
                    )}
                  </svg>
                  {sortOrder === "asc" ? "Ascending" : "Descending"}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {sortedOrders.length === 0 ? (
          <div className="no-orders-modern">
            <div className="no-orders-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <h3 className="no-orders-title">
              {filterStatus ? `No ${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Orders` : 'No Orders Yet'}
            </h3>
            <p className="no-orders-text">
              {filterStatus 
                ? `You don't have any ${filterStatus} orders.`
                : "You haven't placed any orders yet. Start shopping to see your order history here."
              }
            </p>
            {!filterStatus && (
              <Link to="/products" className="btn-modern-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="orders-grid-modern">
            {sortedOrders.map(order => (
              <div key={order._id} className="modern-order-card-user">
                <div className="order-card-header">
                  <div className="order-identity">
                    <div className="order-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                      </svg>
                    </div>
                    <div className="order-info">
                      <h3 className="order-number">#{order.order_number || order._id.slice(-8)}</h3>
                      <p className="order-date">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className={`order-status order-status-${order.status}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </div>
                
                <div className="order-card-content">
                  <div className="order-summary-modern">
                    <div className="summary-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <div>
                        <span className="summary-label">Total Amount</span>
                        <span className="summary-value">${order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="summary-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                      </svg>
                      <div>
                        <span className="summary-label">Items</span>
                        <span className="summary-value">{order.items?.length || 0} items</span>
                      </div>
                    </div>
                  </div>
                  
                  {order.items && order.items.length > 0 && (
                    <div className="order-items-preview">
                      {order.items.slice(0, 4).map((item, index) => (
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
                      {order.items.length > 4 && (
                        <div className="item-preview-more">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="order-card-actions">
                  <button
                    className="btn-modern btn-view-details"
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