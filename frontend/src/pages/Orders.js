import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Modal from "../modal/modal.js"; 
import './styles/orders.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

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
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <h3>Order #{order.order_number || order._id.slice(-6)}</h3>
                  <span className={`status ${order.status}`}>{order.status}</span>
                </div>
                <div className="order-details">
                  <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                  <p>Total: ${order.total_amount.toFixed(2)}</p>
                  <div className="order-items">
                    <h4>Items:</h4>
                    <div className="order-items-container">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="order-item">
                          <span>{item.product.name} x {item.quantity}</span>
                          <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="order-item">
                          <span>+{order.items.length - 3} more items...</span>
                          <span></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="order-actions">
                  <button 
                    className="expand-btn"
                    onClick={() => openModal(order)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={closeModal}>
          {selectedOrder && (
            <div>
              <h2>Order #{selectedOrder.order_number || selectedOrder._id.slice(-6)}</h2>
              
              <div className="modal-order-details">
                <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span className={`status ${selectedOrder.status}`}>{selectedOrder.status}</span></p>
                <p><strong>Total Amount:</strong> ${selectedOrder.total_amount.toFixed(2)}</p>
                {selectedOrder.shipping_address && (
                  <p><strong>Shipping Address:</strong> {selectedOrder.shipping_address}</p>
                )}
              </div>

              <div className="modal-order-items">
                <h3>Order Items</h3>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="modal-order-item">
                    <span>{item.product.name} x {item.quantity}</span>
                    <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Orders;