import React, { useState } from 'react';
import { useToastContext } from '../components/toast';
import SecureForm from '../components/SecureForm';
import { csrfManager } from '../utils/csrf';
import '../styles/contact.css';

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToastContext();

  const handleSubmit = async (sanitizedData, csrfToken) => {
    setIsSubmitting(true);
    
    try {
      const response = await csrfManager.makeSecureRequest(
        `${process.env.REACT_APP_API_BASE_URL}/contact`,
        {
          method: 'POST',
          headers: {
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify(sanitizedData)
        }
      );

      if (response.ok) {
        showToast('Message sent successfully! We will get back to you soon.', 'success');
        // Reset form
        document.querySelector('form').reset();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send message');
      }
    } catch (error) {
      throw error; // Let SecureForm handle the error display
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="container">
        <div className="contact-header">
          <h1>Contact Us</h1>
          <p>Get in touch with us. We'd love to hear from you.</p>
        </div>

        <div className="contact-content">
          <div className="contact-info">
            <div className="contact-item">
              <h3>📧 Email</h3>
              <p>support@vergishop.com</p>
            </div>
            
            <div className="contact-item">
              <h3>📞 Phone</h3>
              <p>+1 (555) 123-4567</p>
            </div>
            
            <div className="contact-item">
              <h3>📍 Address</h3>
              <p>123 Commerce Street<br />
              Business District, NY 10001<br />
              United States</p>
            </div>
            
            <div className="contact-item">
              <h3>🕒 Business Hours</h3>
              <p>Monday - Friday: 9:00 AM - 6:00 PM<br />
              Saturday: 10:00 AM - 4:00 PM<br />
              Sunday: Closed</p>
            </div>
          </div>

          <div className="contact-form-container">
            <SecureForm onSubmit={handleSubmit} className="contact-form" validate={true}>
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  minLength="2"
                  maxLength="100"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  maxLength="254"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  maxLength="20"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  minLength="20"
                  maxLength="2000"
                  required
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </SecureForm>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
