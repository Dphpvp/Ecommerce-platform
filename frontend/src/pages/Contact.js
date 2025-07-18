// Revolutionary Contact Page - Compact & Elegant
import React, { useState, useEffect } from 'react';
import { useToastContext } from '../components/toast';
import SecureForm from '../components/SecureForm';
import { csrfManager } from '../utils/csrf';

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
      {/* Compact Contact Hero Section */}
      <section className="hero-revolutionary contact-hero">
        <div className="hero-bg-revolutionary">
          <div 
            className="hero-bg-image" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80)',
              transform: `translateY(${scrollY * 0.5}px)`
            }}
          ></div>
          <div className="hero-overlay-revolutionary"></div>
        </div>
        <div className="hero-content-revolutionary">
          <div className="hero-glass-card compact">
            <div className="hero-badge-revolutionary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Get in Touch
            </div>
            <h1 className="hero-title-revolutionary">
              Contact Us
            </h1>
            <p className="hero-subtitle-revolutionary">
              Ready to begin your luxury experience? Let's connect.
            </p>
          </div>
        </div>
      </section>

      {/* Compact Contact Content */}
      <section className="contact-content-revolutionary">
        <div className="container">
          <div className="contact-grid-revolutionary">
            
            {/* Contact Information */}
            <div className="contact-info-revolutionary">
              <div className="contact-info-header">
                <h2 className="section-title-revolutionary">Our Atelier</h2>
                <p className="section-subtitle-revolutionary">Visit us in London's prestigious fashion district</p>
              </div>
              
              <div className="contact-items-revolutionary">
                <div className="contact-item-revolutionary">
                  <div className="contact-icon-revolutionary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div className="contact-details-revolutionary">
                    <h4>Address</h4>
                    <p>123 Savile Row<br />London, W1S 3PB</p>
                  </div>
                </div>

                <div className="contact-item-revolutionary">
                  <div className="contact-icon-revolutionary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <div className="contact-details-revolutionary">
                    <h4>Phone</h4>
                    <p>+44 (0) 20 7123 4567</p>
                  </div>
                </div>

                <div className="contact-item-revolutionary">
                  <div className="contact-icon-revolutionary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div className="contact-details-revolutionary">
                    <h4>Email</h4>
                    <p>info@luxeelegance.com</p>
                  </div>
                </div>

                <div className="contact-item-revolutionary">
                  <div className="contact-icon-revolutionary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <div className="contact-details-revolutionary">
                    <h4>Hours</h4>
                    <p>Mon-Sat: 9AM-6PM<br />Sun: By Appointment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-revolutionary">
              <div className="form-header-revolutionary">
                <h2 className="section-title-revolutionary">Send a Message</h2>
                <p className="section-subtitle-revolutionary">We'll respond within 24 hours</p>
              </div>

              <SecureForm 
                onSubmit={handleSubmit} 
                className="contact-form form-revolutionary" 
                validate={true}
                customValidation={validateForm}
              >
                <div className="form-row-revolutionary">
                  <div className="form-group-revolutionary">
                    <label htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      minLength="2"
                      maxLength="100"
                      required
                      placeholder="Your name"
                    />
                  </div>

                  <div className="form-group-revolutionary">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      maxLength="254"
                      required
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="form-group-revolutionary">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    maxLength="20"
                    placeholder="+44 (0) 20 7123 4567"
                  />
                </div>

                <div className="form-group-revolutionary">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    minLength="20"
                    maxLength="2000"
                    required
                    placeholder="Tell us about your requirements..."
                  ></textarea>
                </div>

                <div className="form-group-revolutionary">
                  <label className="checkbox-revolutionary">
                    <input
                      type="checkbox"
                      name="send_confirmation"
                      defaultChecked={true}
                    />
                    <span className="checkmark-revolutionary"></span>
                    Send me a confirmation copy
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="btn-revolutionary btn-luxury-revolutionary"
                  disabled={isSubmitting}
                >
                  <span>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </span>
                  {!isSubmitting && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                    </svg>
                  )}
                </button>
              </SecureForm>
            </div>
          </div>
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