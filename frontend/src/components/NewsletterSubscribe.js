import React, { useState } from 'react';
import { useToastContext } from './toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const NewsletterSubscribe = ({ variant = 'default', className = '' }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { showToast } = useToastContext();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showToast('Please enter your email address', 'error');
      return;
    }

    setIsSubscribing(true);

    try {
      const response = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          source: 'website'
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsSubscribed(true);
        setEmail('');
        setName('');
        showToast('Successfully subscribed to newsletter!', 'success');
      } else {
        if (data.error_code === 'ALREADY_SUBSCRIBED') {
          showToast('You are already subscribed to our newsletter', 'info');
        } else {
          showToast(data.message || 'Failed to subscribe to newsletter', 'error');
        }
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      showToast('An error occurred while subscribing. Please try again.', 'error');
    } finally {
      setIsSubscribing(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className={`newsletter-subscribe success ${variant} ${className}`}>
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h3>Thank you for subscribing!</h3>
          <p>You'll receive our latest updates and exclusive offers.</p>
        </div>
      </div>
    );
  }

  // Compact variant for checkout or sidebar
  if (variant === 'compact') {
    return (
      <div className={`newsletter-subscribe compact ${className}`}>
        <form onSubmit={handleSubscribe} className="subscribe-form">
          <div className="input-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="email-input"
              disabled={isSubscribing}
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="subscribe-btn"
            >
              {isSubscribing ? '...' : '📧'}
            </button>
          </div>
          <label className="subscribe-label">
            <input
              type="checkbox"
              defaultChecked
              onChange={(e) => e.target.checked ? null : showToast('Uncheck to skip newsletter', 'info')}
            />
            Subscribe to newsletter
          </label>
        </form>
      </div>
    );
  }

  // Inline variant for footers
  if (variant === 'inline') {
    return (
      <div className={`newsletter-subscribe inline ${className}`}>
        <form onSubmit={handleSubscribe} className="subscribe-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="email-input"
            disabled={isSubscribing}
          />
          <button
            type="submit"
            disabled={isSubscribing}
            className="subscribe-btn"
          >
            {isSubscribing ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      </div>
    );
  }

  // Default variant - full form
  return (
    <div className={`newsletter-subscribe default ${className}`}>
      <div className="newsletter-header">
        <h3>📧 Stay Updated</h3>
        <p>Subscribe to our newsletter for the latest updates, exclusive offers, and news.</p>
      </div>
      
      <form onSubmit={handleSubscribe} className="subscribe-form">
        <div className="form-row">
          <div className="form-group">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="name-input"
              disabled={isSubscribing}
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="email-input"
              disabled={isSubscribing}
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSubscribing}
          className="subscribe-btn primary"
        >
          {isSubscribing ? (
            <>
              <span className="loading-spinner"></span>
              Subscribing...
            </>
          ) : (
            <>
              📧 Subscribe to Newsletter
            </>
          )}
        </button>
        
        <p className="privacy-note">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </form>
    </div>
  );
};

export default NewsletterSubscribe;