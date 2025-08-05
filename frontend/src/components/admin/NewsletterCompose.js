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
  const [notification, setNotification] = useState({
    title: '',
    body: '',
    send_to_android_users: true
  });
  const [sendMode, setSendMode] = useState('newsletter'); // 'newsletter' or 'notification' or 'both'
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
    // Validation based on send mode
    if (sendMode === 'newsletter' || sendMode === 'both') {
      if (!newsletter.subject.trim() || !newsletter.content.trim()) {
        showToast('Please fill in newsletter subject and content', 'error');
        return;
      }
      if (!newsletter.send_to_users && !newsletter.send_to_subscribers) {
        showToast('Please select at least one newsletter recipient group', 'error');
        return;
      }
    }

    if (sendMode === 'notification' || sendMode === 'both') {
      if (!notification.title.trim() || !notification.body.trim()) {
        showToast('Please fill in notification title and body', 'error');
        return;
      }
    }

    setSending(true);
    let successMessages = [];

    try {
      // Send newsletter if selected
      if (sendMode === 'newsletter' || sendMode === 'both') {
        const newsletterResponse = await makeAuthenticatedRequest(`${API_BASE}/newsletter/admin/send`, {
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

        const newsletterData = await newsletterResponse.json();
        if (newsletterData.success) {
          successMessages.push(`Newsletter sent to ${newsletterData.data.sent_count} recipients`);
        } else {
          throw new Error(newsletterData.message || 'Failed to send newsletter');
        }
      }

      // Send push notification if selected
      if (sendMode === 'notification' || sendMode === 'both') {
        const notificationResponse = await makeAuthenticatedRequest(`${API_BASE}/notifications/admin/send-push`, {
          method: 'POST',
          body: JSON.stringify({
            title: notification.title,
            body: notification.body,
            send_to_android_users: notification.send_to_android_users
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const notificationData = await notificationResponse.json();
        if (notificationData.success) {
          successMessages.push(`Push notification sent to ${notificationData.data.sent_count} Android users`);
        } else {
          throw new Error(notificationData.message || 'Failed to send push notification');
        }
      }

      // Show success message
      showToast(successMessages.join(' & '), 'success');
      navigate('/admin/dashboard');

    } catch (error) {
      showToast(error.message || 'Failed to send communication', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-newsletter-compose">
      <div className="container">
        <div className="newsletter-header">
          <h1>
            {sendMode === 'newsletter' ? '📧 Compose Newsletter' : 
             sendMode === 'notification' ? '📱 Send Push Notification' : 
             '📧📱 Newsletter & Notification'}
          </h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn btn-outline"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Send Mode Selection */}
        <div className="send-mode-selector">
          <h3>Communication Type:</h3>
          <div className="mode-buttons">
            <button
              className={`mode-btn ${sendMode === 'newsletter' ? 'active' : ''}`}
              onClick={() => setSendMode('newsletter')}
            >
              📧 Email Newsletter
            </button>
            <button
              className={`mode-btn ${sendMode === 'notification' ? 'active' : ''}`}
              onClick={() => setSendMode('notification')}
            >
              📱 Push Notification
            </button>
            <button
              className={`mode-btn ${sendMode === 'both' ? 'active' : ''}`}
              onClick={() => setSendMode('both')}
            >
              📧📱 Both
            </button>
          </div>
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

        <div className="communication-forms">
          {/* Newsletter Form */}
          {(sendMode === 'newsletter' || sendMode === 'both') && (
            <div className="newsletter-form">
              <h3>📧 Email Newsletter</h3>
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
                  rows="8"
                  placeholder="Enter newsletter content (HTML supported)"
                />
              </div>
            </div>
          )}

          {/* Push Notification Form */}
          {(sendMode === 'notification' || sendMode === 'both') && (
            <div className="notification-form">
              <h3>📱 Push Notification</h3>
              <div className="form-group">
                <label>Send To:</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notification.send_to_android_users}
                      onChange={(e) => setNotification(prev => ({ ...prev, send_to_android_users: e.target.checked }))}
                    />
                    <span>Android App Users {stats && stats.android_users ? `(${stats.android_users})` : '(All Android users)'}</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Notification Title:</label>
                <input
                  type="text"
                  value={notification.title}
                  onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
                  className="form-input"
                  placeholder="Enter notification title (max 65 characters)"
                  maxLength="65"
                />
                <small className="char-count">{notification.title.length}/65 characters</small>
              </div>

              <div className="form-group">
                <label>Notification Body:</label>
                <textarea
                  value={notification.body}
                  onChange={(e) => setNotification(prev => ({ ...prev, body: e.target.value }))}
                  className="form-textarea"
                  rows="4"
                  placeholder="Enter notification message (max 240 characters)"
                  maxLength="240"
                />
                <small className="char-count">{notification.body.length}/240 characters</small>
              </div>

              <div className="notification-preview">
                <h4>📱 Preview:</h4>
                <div className="mobile-notification-preview">
                  <div className="notification-icon">📱</div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title || 'Notification Title'}
                    </div>
                    <div className="notification-body">
                      {notification.body || 'Notification message will appear here...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              onClick={handleSend}
              disabled={sending}
              className="btn btn-primary btn-large"
            >
              {sending ? 'Sending...' : 
               sendMode === 'newsletter' ? '🚀 Send Newsletter' :
               sendMode === 'notification' ? '📱 Send Push Notification' :
               '🚀📱 Send Both'}
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