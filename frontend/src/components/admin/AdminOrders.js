import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import OrderManagementCard from "./OrderManagementCard";
import Modal from "../Modal";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;
    try {
      await fetch(`${API_BASE}/admin/orders/${selectedOrder._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  return (
    <div className="admin-orders container">
      <h1>Order Management</h1>
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order._id} className="order-card">
            <p>
              <strong>Order #{order._id}</strong>
            </p>
            <p>Status: {order.status}</p>
            <button
              onClick={() => {
                setSelectedOrder(order);
                setNewStatus(order.status);
              }}
            >
              Details
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <div>
            <h2>Order Details</h2>
            <p>
              <strong>ID:</strong> {selectedOrder._id}
            </p>
            <p>
              <strong>Status:</strong>
            </p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{
                backgroundColor: getStatusColor(newStatus),
                color: "#fff",
                padding: "5px",
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
            <div style={{ marginTop: "1rem" }}>
              <button className="btn btn-primary" onClick={handleStatusUpdate}>
                Update
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setSelectedOrder(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
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

export default AdminOrders;
