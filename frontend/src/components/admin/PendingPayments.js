import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const PendingPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/payments/pending`);
      setPayments(data.payments || []);
    } catch (error) {
      showToast('Failed to fetch pending payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-pending-payments">
        <div className="container">
          <p>Loading pending payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-pending-payments">
      <div className="container">
        <div className="pending-payments-header">
          <h1>💳 Pending Payments</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn btn-outline"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="pending-payments-content">
          {payments.length === 0 ? (
            <div className="no-payments">
              <h3>No pending payments found</h3>
              <p>All payments are up to date.</p>
            </div>
          ) : (
            <div className="payments-list">
              {payments.map(payment => (
                <div key={payment._id} className="payment-card">
                  <div className="payment-info">
                    <h4>Payment #{payment._id.slice(-8)}</h4>
                    <p>Amount: ${payment.amount}</p>
                    <p>Status: {payment.status}</p>
                    <p>Date: {new Date(payment.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingPayments;