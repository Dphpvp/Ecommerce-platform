import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToastContext } from '../toast';
// Styles included in main theme

const API_BASE = process.env.REACT_APP_API_BASE_URL;

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
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
      <div className="order-management-card">
        <div className="order-header">
          <div className="order-basic-info">
            <h3>Order #{order._id?.slice(-8) || 'Unknown'}</h3>
            <p>
              Customer: {order.user_info?.full_name || 'Unknown'} ({order.user_info?.email || 'Unknown'})
            </p>
            <p>Total: ${(order.total_amount || 0).toFixed(2)}</p>
            <p>Date: {formatDate(order.created_at)}</p>
          </div>
          <div className="order-status-section">
            <span
              className="current-status"
              style={{ backgroundColor: getStatusColor(order.status) }}
            >
              {(order.status || 'unknown').toUpperCase()}
            </span>
            <button
              className="details-toggle"
              onClick={() => setIsModalOpen(true)}
            >
              View Details
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

  if (loading) {
    return (
      <div className="admin-orders">
        <div className="container">
          <p className="loading-message">⏳ Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="container">
        <div className="orders-header">
          <h1>Order Management</h1>
          
          <div className="filter-section">
            <h3>🔍 Filter Orders</h3>
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
        </div>

        <div className="orders-section">
          <div className="orders-list">
            {orders.map((order) => (
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
              <p>📦 No orders found for the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;