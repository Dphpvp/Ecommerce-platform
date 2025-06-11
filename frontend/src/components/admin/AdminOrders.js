import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import OrderManagementCard from "./OrderManagementCard";
import "../../styles/adminorders.css";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const { token } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders when statusFilter or orders change
  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  }, [orders, statusFilter]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
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
        // Update the orders state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
        alert(`Order status updated to ${newStatus}`);
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

  const getStatusCount = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  if (loading) {
    return (
      <div className="admin-orders">
        <div className="container">
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="container">
        <h1>Order Management</h1>
        
        {/* Filter Section */}
        <div className="filter-section">
          <h3>Filter by Status:</h3>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Orders ({orders.length})
            </button>
            {['pending', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
              <button
                key={status}
                className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
                style={{ 
                  backgroundColor: statusFilter === status ? getStatusColor(status) : '#f8f9fa',
                  color: statusFilter === status ? 'white' : '#333'
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({getStatusCount(status)})
              </button>
            ))}
          </div>
        </div>

        {/* Orders Display */}
        <div className="orders-section">
          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <p>
                {statusFilter === 'all' 
                  ? 'No orders found.' 
                  : `No orders with status "${statusFilter}" found.`
                }
              </p>
            </div>
          ) : (
            <div className="orders-list">
              {filteredOrders.map((order) => (
                <OrderManagementCard
                  key={order._id}
                  order={order}
                  onStatusUpdate={updateOrderStatus}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;