import React, { useState, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useToastContext } from '../components/toast';
import '../styles/contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaValue, setCaptchaValue] = useState(null);
  const { showToast } = useToastContext();
  const recaptchaRef = useRef();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!captchaValue) {
      showToast('Please complete the CAPTCHA', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          captcha: captchaValue
        })
      });

      if (response.ok) {
        showToast('Message sent successfully! We will get back to you soon.', 'success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: ''
        });
        setCaptchaValue(null);
        recaptchaRef.current?.reset();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message. Please try again.', 'error');
    }
    
    setIsSubmitting(false);
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
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                  onChange={setCaptchaValue}
                  onExpired={() => setCaptchaValue(null)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting || !captchaValue}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

console.log('Site key:', process.env.REACT_APP_RECAPTCHA_SITE_KEY)

export default Contact;