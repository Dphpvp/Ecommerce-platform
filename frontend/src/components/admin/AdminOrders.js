import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToastContext } from '../toast';
// Styles included in main theme

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

// Order Management Card Component
const OrderManagementCard = ({ order, onStatusUpdate, getStatusColor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.status);

  const handleStatusChange = () => {
    if (selectedStatus !== order.status) {
      onStatusUpdate(order._id, selectedStatus);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <div className="modern-order-card">
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
              <h3 className="order-number">#{order._id?.slice(-8) || 'Unknown'}</h3>
              <p className="order-date">{formatDate(order.created_at)}</p>
            </div>
          </div>
          <div className={`order-status order-status-${order.status}`}>
            {(order.status || 'unknown').charAt(0).toUpperCase() + (order.status || 'unknown').slice(1)}
          </div>
        </div>
        
        <div className="order-card-content">
          <div className="customer-info">
            <div className="info-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <div>
                <span className="info-label">Customer</span>
                <span className="info-value">{order.user_info?.full_name || 'Unknown'}</span>
              </div>
            </div>
            <div className="info-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <div>
                <span className="info-label">Email</span>
                <span className="info-value">{order.user_info?.email || 'Unknown'}</span>
              </div>
            </div>
            <div className="info-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <div>
                <span className="info-label">Total</span>
                <span className="info-value total-amount">${(order.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="order-card-actions">
          <button
            className="btn-modern btn-view-details"
            onClick={() => setIsModalOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View Details
          </button>
          <div className="quick-actions">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="status-select"
            >
              {[
                "pending",
                "accepted", 
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ].map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={handleStatusChange}
              disabled={selectedStatus === order.status}
              className="btn-modern btn-update-status"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Order #{order._id.slice(-8)}</h2>

        <section>
          <h3>👤 Customer Info</h3>
          <p><strong>Name:</strong> {order.user_info?.full_name || 'Unknown'}</p>
          <p><strong>Email:</strong> {order.user_info?.email || 'Unknown'}</p>
          <p><strong>Username:</strong> {order.user_info?.username || 'Unknown'}</p>
          <p><strong>Phone:</strong> {order.user_info?.phone || "Not provided"}</p>
        </section>

        <section>
          <h3>📍 Shipping Address</h3>
          {order.shipping_address ? (
            <p>
              {order.shipping_address.street}<br />
              {order.shipping_address.city}, {order.shipping_address.state}{" "}
              {order.shipping_address.zipCode}<br />
              {order.shipping_address.country}
            </p>
          ) : (
            <p>No shipping address provided</p>
          )}
        </section>

        <section>
          <h3>📦 Items</h3>
          {order.items?.map((item, index) => (
            <div key={index} className="order-item-detail">
              <img
                src={item.product?.image_url}
                alt={item.product?.name}
                className="item-image"
              />
              <div>
                <p><strong>{item.product?.name}</strong></p>
                <p>Quantity: {item.quantity}</p>
                <p>Price: ${item.product?.price?.toFixed(2)} each</p>
                <p>Subtotal: ${(item.product?.price * item.quantity)?.toFixed(2)}</p>
              </div>
            </div>
          )) || <p>No items found</p>}
        </section>

        <section>
          <h3>⚙️ Update Status</h3>
          <div className="status-update-section">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                backgroundColor: getStatusColor(selectedStatus),
                color: "white",
                padding: "8px 12px",
                borderRadius: "5px",
                border: "none",
                marginRight: "1rem"
              }}
            >
              {[
                "pending",
                "accepted",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ].map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                handleStatusChange();
                setIsModalOpen(false);
              }}
              disabled={selectedStatus === order.status}
              className="btn btn-primary"
            >
              Update Status
            </button>
          </div>
        </section>
      </Modal>
    </>
  );
};

// Main Admin Orders Component
const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();

  useEffect(() => {
    const fetchOrdersWithFilter = async () => {
      try {
        setLoading(true);
        const url = filter
          ? `${API_BASE}/admin/orders?status=${filter}`
          : `${API_BASE}/admin/orders`;

        console.log('Fetching URL:', url, 'Filter:', filter);

        const data = await makeAuthenticatedRequest(url);
        console.log('Orders received:', data.orders?.length || 0);
        setOrders(data.orders || []);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersWithFilter();
  }, [filter, makeAuthenticatedRequest]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });

      showToast(`Order status updated to ${newStatus}`, 'success');
      // Trigger re-fetch by updating filter
      setFilter(filter + "");
    } catch (error) {
      console.error("Failed to update order:", error);
      showToast('Failed to update order status', 'error');
    }
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
    { value: "created_at", label: "Date Created" },
    { value: "total_amount", label: "Total Amount" },
    { value: "status", label: "Status" },
    { value: "user_info.full_name", label: "Customer Name" },
  ];

  // Sort orders function
  const sortOrders = (ordersToSort) => {
    return [...ordersToSort].sort((a, b) => {
      let aValue, bValue;

      if (sortBy === "user_info.full_name") {
        aValue = a.user_info?.full_name || "";
        bValue = b.user_info?.full_name || "";
      } else if (sortBy === "created_at") {
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
      } else {
        aValue = a[sortBy] || 0;
        bValue = b[sortBy] || 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  if (loading) {
    return (
      <div className="admin-orders">
        <div className="container">
          <p className="loading-message">⏳ Loading orders...</p>
        </div>
      </div>
    );
  }

  const sortedOrders = sortOrders(orders);

  return (
    <div className="admin-orders modern-admin-orders">
      <div className="container">
        <div className="admin-orders-header">
          <div className="header-content">
            <h1 className="admin-title">Order Management</h1>
            <p className="admin-subtitle">Manage and track all customer orders</p>
          </div>
          <div className="orders-stats">
            <div className="stat-card">
              <span className="stat-number">{orders.length}</span>
              <span className="stat-label">Total Orders</span>
            </div>
          </div>
        </div>
          
        <div className="admin-controls">
          <div className="filter-section">
            <h3 className="section-title">Filter by Status</h3>
            <div className="filter-buttons">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`filter-btn ${filter === option.value ? 'active' : ''}`}
                  style={
                    filter === option.value && option.value
                      ? { backgroundColor: getStatusColor(option.value), color: 'white' }
                      : filter === option.value
                      ? { backgroundColor: '#007bff', color: 'white' }
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

        <div className="orders-section">
          <div className="orders-list">
            {sortedOrders.map((order) => (
              <OrderManagementCard
                key={order._id}
                order={order}
                onStatusUpdate={updateOrderStatus}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>

          {orders.length === 0 && (
            <div className="no-orders">
              <div className="no-orders-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </div>
              <h3>No Orders Found</h3>
              <p>No orders match the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;