import React, { useState } from "react";
import Modal from "../common/Modal"; // Adjust path if needed

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
            <h3>Order #{order._id.slice(-8)}</h3>
            <p>
              Customer: {order.user_info.full_name} ({order.user_info.email})
            </p>
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
          <h3>Customer Info</h3>
          <p>
            <strong>Name:</strong> {order.user_info.full_name}
          </p>
          <p>
            <strong>Email:</strong> {order.user_info.email}
          </p>
          <p>
            <strong>Username:</strong> {order.user_info.username}
          </p>
          <p>
            <strong>Phone:</strong> {order.user_info.phone || "Not provided"}
          </p>
        </section>

        <section>
          <h3>Shipping Address</h3>
          {order.shipping_address ? (
            <p>
              {order.shipping_address.street}
              <br />
              {order.shipping_address.city}, {order.shipping_address.state}{" "}
              {order.shipping_address.zipCode}
              <br />
              {order.shipping_address.country}
            </p>
          ) : (
            <p>No shipping address provided</p>
          )}
        </section>

        <section>
          <h3>Items</h3>
          {order.items.map((item, index) => (
            <div key={index} className="order-item-detail">
              <img
                src={item.product.image_url}
                alt={item.product.name}
                style={{ width: "60px", height: "60px" }}
              />
              <div>
                <p>
                  <strong>{item.product.name}</strong>
                </p>
                <p>Quantity: {item.quantity}</p>
                <p>Price: ${item.product.price.toFixed(2)} each</p>
                <p>
                  Subtotal: ${(item.product.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h3>Update Status</h3>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              backgroundColor: getStatusColor(selectedStatus),
              color: "white",
              padding: "4px",
              borderRadius: "5px",
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
                {status}
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
            style={{ marginLeft: "1rem" }}
          >
            Update
          </button>
        </section>
      </Modal>
    </>
  );
};

export default OrderManagementCard;
