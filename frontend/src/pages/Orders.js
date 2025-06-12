import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/orders.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, [token]);

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
                    <p>Items: {order.items.length}</p>
                  </div>
                  <div className="order-status-section">
                    <span className={`current-status status-${order.status}`}>
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
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="order-item-detail">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                    />
                    <div>
                      <p><strong>{item.product.name}</strong></p>
                      <p>Quantity: {item.quantity}</p>
                      <p>Price: ${item.product.price.toFixed(2)} each</p>
                      <p>Subtotal: ${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </section>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Orders;