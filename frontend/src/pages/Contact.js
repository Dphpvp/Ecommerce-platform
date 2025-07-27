// Modern Contact Page - Elegant Design
import React, { useState, useEffect, useRef } from 'react';
import { useToastContext } from '../components/toast';
import SecureForm from '../components/SecureForm';
import { csrfManager } from '../utils/csrf';
import '../styles/index.css';
import NewsletterSubscribe from '../components/NewsletterSubscribe';

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { showToast } = useToastContext();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (sanitizedData, csrfToken) => {
    setIsSubmitting(true);
    
    try {
      const requestData = {
        name: sanitizedData.name.trim(),
        email: sanitizedData.email.trim().toLowerCase(),
        phone: sanitizedData.phone?.trim() || '',
        message: sanitizedData.message.trim(),
        send_confirmation: Boolean(sanitizedData.send_confirmation)
      };

      const response = await csrfManager.makeSecureRequest(
        `${process.env.REACT_APP_API_BASE_URL}/contact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify(requestData)
        }
      );

      const result = await response.json();

      if (response.ok) {
        showToast('Message sent successfully! We will get back to you within 24 hours.', 'success');
        
        const form = document.querySelector('.contact-form');
        if (form) {
          form.reset();
        }
      } else {
        const errorMessage = result.detail || result.message || 'Failed to send message. Please try again.';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      
      let errorMessage = 'Failed to send message. Please try again later.';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('CSRF')) {
        errorMessage = 'Security token expired. Please refresh the page and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = (formData) => {
    const errors = {};
    
    if (!formData.name || formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^[\+]?[\d\s\-\(\)]{7,20}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.message || formData.message.length < 20) {
      errors.message = 'Message must be at least 20 characters long';
    }
    
    return errors;
  };

  return (
    <div className="contact-page">
      {/* Modern Contact Hero Section */}
      <section className="modern-hero-section">
        <div className="hero-background">
          <img 
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80"
            alt="Contact Us"
            className="hero-image"
            style={{
              transform: `translateY(${scrollY * 0.5}px)`,
              opacity: Math.max(0, 1 - scrollY / 800)
            }}
          />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="container">
            <div className="hero-text">
              <div className="hero-badge">
                <svg className="eco-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                <span>Connect with EcoFashion</span>
              </div>
              <h1 className="hero-title">
                Let's Create Sustainable Fashion,
                <span className="hero-accent">Together</span>
              </h1>
              <p className="hero-description">
                Have questions about sustainable fashion? Need styling advice? Want to learn more about our impact? We're here to help you on your sustainable style journey.
              </p>
              <div className="hero-actions">
                <a href="#contact-form" className="hero-btn-primary">
                  Send Message
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
                <a href="tel:+442071234567" className="hero-btn-secondary">
                  Call Us Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="contact-info-section">
        <div className="container">
          <h2>Contact Information</h2>
          <div className="contact-info-grid">
            <div className="contact-info-item">
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div className="contact-details">
                <h3>Address</h3>
                <p>123 Fashion Street<br />New York, NY 10001</p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div className="contact-details">
                <h3>Phone</h3>
                <p><a href="tel:+12125551234">+1 (212) 555-1234</a></p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div className="contact-details">
                <h3>Email</h3>
                <p><a href="mailto:hello@ecofashion.com">hello@ecofashion.com</a></p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <div className="contact-details">
                <h3>Hours</h3>
                <p>Mon-Fri: 9AM-6PM<br />Sat: 10AM-4PM<br />Sun: Closed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact-form-section" id="contact-form">
        <div className="container">
          <h2>Send us a Message</h2>
          <p>Fill out the form below and we'll get back to you within 24 hours</p>
          
          <div className="contact-form-container">
            <div className="contact-form-card">
              <SecureForm 
                onSubmit={handleSubmit} 
                className="modern-contact-form" 
                validate={true}
                customValidation={validateForm}
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label className="modern-label">
                      <span className="label-text">Full Name</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="modern-input"
                      minLength="2"
                      maxLength="100"
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="modern-label">
                      <span className="label-text">Email Address</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="modern-input"
                      maxLength="254"
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="modern-label">
                    <span className="label-text">Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="modern-input"
                    maxLength="20"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label className="modern-label">
                    <span className="label-text">Your Message</span>
                    <span className="required">*</span>
                  </label>
                  <textarea
                    name="message"
                    className="modern-textarea"
                    rows="5"
                    minLength="20"
                    maxLength="2000"
                    required
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                  <div className="input-help">Minimum 20 characters</div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="send_confirmation"
                      defaultChecked={true}
                    />
                    <span>Send me a confirmation copy of this message</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary contact-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loading-spinner"></span>
                        Sending Message...
                      </>
                    ) : (
                      <>
                        📧 Send Message
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"/>
                          <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </SecureForm>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <h2>Stay Updated</h2>
          <p>Get the latest updates and special offers delivered to your inbox</p>
          <NewsletterSubscribe variant="default" />
        </div>
      </section>
    </div>
  );
};

export default Contact;

// Revolutionary Contact Page Complete with:
// - Compact hero section (reduced height)
// - Elegant contact information with icons
// - Streamlined contact form
// - Smaller, more manageable components
// - Clean glassmorphism design
// - Better mobile responsiveness