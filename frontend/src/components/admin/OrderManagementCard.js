import React, { useState } from 'react';

const OrderManagementCard = ({ order, onStatusUpdate, getStatusColor }) => {
  const [showDetails, setShowDetails] = useState(false);
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
    <div className="order-management-card">
      <div className="order-header" onClick={() => setShowDetails(!showDetails)}>
        <div className="order-basic-info">
          <h3>Order #{order._id.slice(-8)}</h3>
          <p>Customer: {order.user_info.full_name} ({order.user_info.email})</p>
          <p>Total: ${order.total_amount.toFixed(2)}</p>
          <p>Date: {formatDate(order.created_at)}</p>
        </div>
        <div className="order-status-section">
          <span 
            className="current-status" 
            style={{ backgroundColor: getStatusColor(order.status) }}
          >
            {order.status.toUpperCase()}
          </span>
          <button className="details-toggle">
            {showDetails ? '▼' : '▶'} Details
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="order-details-expanded">
          <div className="customer-details">
            <h4>Customer Information</h4>
            <p><strong>Name:</strong> {order.user_info.full_name}</p>
            <p><strong>Email:</strong> {order.user_info.email}</p>
            <p><strong>Username:</strong> {order.user_info.username}</p>
            <p><strong>Phone:</strong> {order.user_info.phone || 'Not provided'}</p>
          </div>

          <div className="shipping-details">
            <h4>Shipping Address</h4>
            {order.shipping_address ? (
              <div>
                <p>{order.shipping_address.street}</p>
                <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}</p>
                <p>{order.shipping_address.country}</p>
              </div>
            ) : (
              <p>No shipping address provided</p>
            )}
          </div>

          <div className="order-items">
            <h4>Items Ordered</h4>
            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={index} className="order-item-detail">
                  <img src={item.product.image_url} alt={item.product.name} />
                  <div className="item-info">
                    <p><strong>{item.product.name}</strong></p>
                    <p>Quantity: {item.quantity}</p>
                    <p>Price: ${item.product.price.toFixed(2)} each</p>
                    <p>Subtotal: ${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="status-management">
            <h4>Update Order Status</h4>
            <div className="status-controls">
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="status-select"
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button 
                onClick={handleStatusChange}
                className="btn btn-primary"
                disabled={selectedStatus === order.status}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagementCard;