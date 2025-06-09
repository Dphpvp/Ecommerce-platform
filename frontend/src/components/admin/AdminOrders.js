import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import OrderManagementCard from "./OrderManagementCard";
import "../../styles/admin.css";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    fetchOrders();
<<<<<<< Updated upstream
  }, []);

=======
  }, [filter]);
  /* */
>>>>>>> Stashed changes
  const fetchOrders = async () => {
    try {
      const url = filter
        ? `${API_BASE}/admin/orders?status=${filter}`
        : `${API_BASE}/admin/orders`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `${API_BASE}/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        alert(`Order status updated to ${newStatus}`);
        fetchOrders(); // Refresh the orders list
      } else {
        alert("Failed to update order status");
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      alert("Failed to update order status");
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

  if (loading)
    return (
      <div className="container">
        <p>Loading orders...</p>
      </div>
    );

  return (
    <div className="admin-orders">
      <div className="container">
        <div className="orders-header">
          <h1>Order Management</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="status-filter"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="orders-list relative">
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
            <p>No orders found for the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
