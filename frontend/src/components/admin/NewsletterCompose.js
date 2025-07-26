import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const NewsletterCompose = () => {
  const [newsletter, setNewsletter] = useState({
    subject: '',
    content: '',
    send_to_users: true,
    send_to_subscribers: true
  });
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/newsletter/admin/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch newsletter stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSend = async () => {
    if (!newsletter.subject.trim() || !newsletter.content.trim()) {
      showToast('Please fill in both subject and content', 'error');
      return;
    }

    if (!newsletter.send_to_users && !newsletter.send_to_subscribers) {
      showToast('Please select at least one recipient group', 'error');
      return;
    }

    setSending(true);

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/newsletter/admin/send`, {
        method: 'POST',
        body: JSON.stringify({
          subject: newsletter.subject,
          content: newsletter.content,
          send_to_users: newsletter.send_to_users,
          send_to_subscribers: newsletter.send_to_subscribers
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        showToast(
          `Newsletter sent successfully! Delivered to ${data.data.sent_count} recipients.`,
          'success'
        );
        navigate('/admin/dashboard');
      } else {
        showToast(data.message || 'Failed to send newsletter', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Failed to send newsletter', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-newsletter-compose">
      <div className="container">
        <div className="newsletter-header">
          <h1>📧 Compose Newsletter</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn btn-outline"
          >
            ← Back to Dashboard
          </button>
        </div>

        {!loadingStats && stats && (
          <div className="newsletter-stats">
            <h3>📊 Newsletter Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">{stats.total_users}</span>
                <span className="stat-label">Registered Users</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{stats.active_subscribers}</span>
                <span className="stat-label">Newsletter Subscribers</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{stats.recent_campaigns}</span>
                <span className="stat-label">Recent Campaigns</span>
              </div>
            </div>
          </div>
        )}

        <div className="newsletter-form">
          <div className="form-group">
            <label>Send To:</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newsletter.send_to_users}
                  onChange={(e) => setNewsletter(prev => ({ ...prev, send_to_users: e.target.checked }))}
                />
                <span>Registered Users {stats && `(${stats.total_users})`}</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newsletter.send_to_subscribers}
                  onChange={(e) => setNewsletter(prev => ({ ...prev, send_to_subscribers: e.target.checked }))}
                />
                <span>Newsletter Subscribers {stats && `(${stats.active_subscribers})`}</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Subject:</label>
            <input
              type="text"
              value={newsletter.subject}
              onChange={(e) => setNewsletter(prev => ({ ...prev, subject: e.target.value }))}
              className="form-input"
              placeholder="Enter newsletter subject"
            />
          </div>

          <div className="form-group">
            <label>Content:</label>
            <textarea
              value={newsletter.content}
              onChange={(e) => setNewsletter(prev => ({ ...prev, content: e.target.value }))}
              className="form-textarea"
              rows="10"
              placeholder="Enter newsletter content (HTML supported)"
            />
          </div>

          <div className="form-actions">
            <button
              onClick={handleSend}
              disabled={sending}
              className="btn btn-primary"
            >
              {sending ? 'Sending...' : '🚀 Send Newsletter'}
            </button>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="btn btn-outline"
              disabled={sending}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterCompose;