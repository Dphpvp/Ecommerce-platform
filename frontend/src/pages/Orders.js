import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

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
    <div className="orders">
      <div className="container">
        <h1>My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="no-orders">
            <p>You haven't placed any orders yet.</p>
            <Link to="/products" className="btn btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-management-card">
                <div className="order-header">
                  <div className="order-basic-info">
                    <h3>Order #{order.order_number || order._id.slice(-8)}</h3>
                    <p>Total: ${order.total_amount.toFixed(2)}</p>
                    <p>Date: {formatDate(order.created_at)}</p>
                    <p>Items: {order.items?.length || 0}</p>
                  </div>
                  <div className="order-status-section">
                    <span 
                      className="current-status"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status.toUpperCase()}
                    </span>
                    <button
                      className="details-toggle"
                      onClick={() => openModal(order)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={closeModal}>
          {selectedOrder && (
            <>
              <h2>Order #{selectedOrder.order_number || selectedOrder._id.slice(-8)}</h2>

              <section>
                <h3>Order Information</h3>
                <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                <p><strong>Date:</strong> {formatDate(selectedOrder.created_at)}</p>
                <p><strong>Status:</strong> {selectedOrder.status}</p>
                <p><strong>Total Amount:</strong> ${selectedOrder.total_amount.toFixed(2)}</p>
              </section>

              {selectedOrder.shipping_address && (
                <section>
                  <h3>Shipping Address</h3>
                  <p>
                    {selectedOrder.shipping_address.street}<br />
                    {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zipCode}<br />
                    {selectedOrder.shipping_address.country}
                  </p>
                </section>
              )}

              <section>
                <h3>Items</h3>
                {selectedOrder.items?.map((item, index) => (
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
            </>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Orders;