import React, { useState } from 'react';
import { useToastContext } from '../components/toast';
import SecureForm from '../components/SecureForm';
import { ParallaxSection, ParallaxElement } from '../components/Parallax';
import { useIntersectionObserver } from '../hooks/useParallax';
import { csrfManager } from '../utils/csrf';
import '../styles/pages/contact.css';

// Animation component
const AnimatedSection = ({ children, className = '', delay = 0 }) => {
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.2,
  });

  return (
    <div
      ref={elementRef}
      className={`animate-on-scroll ${isIntersecting ? 'is-visible' : ''} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToastContext();

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
        showToast(
          requestData.send_confirmation 
            ? 'Message sent successfully! Check your email for confirmation. We will get back to you within 24 hours.'
            : 'Message sent successfully! We will get back to you within 24 hours.',
          'success'
        );
        
        // Reset form after successful submission
        const form = document.querySelector('.contact-form');
        if (form) {
          form.reset();
        }
      } else {
        // Handle specific error messages from backend
        const errorMessage = result.detail || result.message || 'Failed to send message. Please try again.';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      
      // Handle different types of errors
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
      {/* Contact Hero Section */}
      <ParallaxSection
        backgroundImage="/images/consultation-appointment.jpg"
        speed={-0.4}
        className="contact-hero-section"
        overlay={true}
        overlayOpacity={0.5}
        height="60vh"
      >
        <div className="container">
          <div className="hero-content text-center">
            <h1 className="hero-title text-white">Get in Touch</h1>
            <p className="hero-subtitle text-white">
              Begin your bespoke journey with a personal consultation
            </p>
          </div>
        </div>
      </ParallaxSection>

      {/* Main Content Section */}
      <section className="contact-main-section py-5">
        <div className="container">
          <div className="contact-content">
            {/* Contact Information */}
            <div className="contact-info-wrapper">
              <AnimatedSection delay={200}>
                <div className="contact-info luxury-card">
                  <h2 className="section-title mb-4">Visit Our Atelier</h2>
                  
                  <div className="contact-item">
                    <ParallaxElement speed={-0.1}>
                      <div className="contact-icon">📍</div>
                    </ParallaxElement>
                    <div className="contact-details">
                      <h3>Address</h3>
                      <p>
                        123 Savile Row<br />
                        Mayfair District<br />
                        London, W1S 3PB<br />
                        United Kingdom
                      </p>
                    </div>
                  </div>

                  <div className="contact-item">
                    <ParallaxElement speed={-0.1}>
                      <div className="contact-icon">📞</div>
                    </ParallaxElement>
                    <div className="contact-details">
                      <h3>Phone</h3>
                      <p>
                        <a href="tel:+442071234567">+44 (0) 20 7123 4567</a><br />
                        <span className="phone-note">Monday - Saturday, 9:00 AM - 6:00 PM</span>
                      </p>
                    </div>
                  </div>

                  <div className="contact-item">
                    <ParallaxElement speed={-0.1}>
                      <div className="contact-icon">📧</div>
                    </ParallaxElement>
                    <div className="contact-details">
                      <h3>Email</h3>
                      <p>
                        <a href="mailto:appointments@vergishop.com">appointments@vergishop.com</a><br />
                        <a href="mailto:info@vergishop.com">info@vergishop.com</a>
                      </p>
                    </div>
                  </div>

                  <div className="contact-item">
                    <ParallaxElement speed={-0.1}>
                      <div className="contact-icon">🕒</div>
                    </ParallaxElement>
                    <div className="contact-details">
                      <h3>Atelier Hours</h3>
                      <div className="hours-grid">
                        <div className="hours-day">
                          <span>Monday - Friday</span>
                          <span>9:00 AM - 7:00 PM</span>
                        </div>
                        <div className="hours-day">
                          <span>Saturday</span>
                          <span>10:00 AM - 5:00 PM</span>
                        </div>
                        <div className="hours-day">
                          <span>Sunday</span>
                          <span>By Appointment Only</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="appointment-note">
                    <h4>💎 Private Appointments Available</h4>
                    <p>
                      We offer private consultation sessions outside regular hours for your convenience. 
                      Please mention your preferred time when contacting us.
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Contact Form */}
            <div className="contact-form-wrapper">
              <AnimatedSection delay={400}>
                <div className="contact-form-container luxury-card">
                  <h2 className="section-title mb-4">Schedule Your Consultation</h2>
                  <p className="form-description">
                    Ready to begin your bespoke journey? Fill out the form below and we'll contact you 
                    within 24 hours to schedule your personal consultation.
                  </p>

                  <SecureForm 
                    onSubmit={handleSubmit} 
                    className="contact-form" 
                    validate={true}
                    customValidation={validateForm}
                  >
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="name">Full Name *</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          minLength="2"
                          maxLength="100"
                          required
                          placeholder="Your full name"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">Email Address *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          maxLength="254"
                          required
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        maxLength="20"
                        placeholder="+44 (0) 20 7123 4567"
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
                        placeholder="Tell us about your requirements, style preferences, or any specific needs for your consultation..."
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="send_confirmation"
                          defaultChecked={true}
                        />
                        <span className="checkmark"></span>
                        Send me a confirmation copy of this message
                      </label>
                    </div>

                    <div className="form-privacy">
                      <small>
                        By submitting this form, you agree to our privacy policy and consent to be contacted 
                        regarding your inquiry. Your information is secure and will never be shared with third parties.
                      </small>
                    </div>

                    <button 
                      type="submit" 
                      className="btn-luxury contact-submit-btn"
                      disabled={isSubmitting}
                    >
                      <span>
                        {isSubmitting ? (
                          <>
                            <span className="spinner"></span>
                            Sending Request...
                          </>
                        ) : (
                          'Request Consultation'
                        )}
                      </span>
                    </button>
                  </SecureForm>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Services Section */}
      <ParallaxSection
        backgroundImage="/images/fabric-library.jpg"
        speed={-0.2}
        className="services-highlight-section fabric-linen"
        overlay={true}
        overlayOpacity={0.1}
        height="auto"
      >
        <div className="container py-5">
          <AnimatedSection>
            <h2 className="section-title text-center mb-5">Consultation Services</h2>
          </AnimatedSection>
          
          <div className="services-highlight-grid">
            <AnimatedSection delay={200}>
              <div className="service-highlight luxury-card">
                <div className="service-icon">👔</div>
                <h3>Bespoke Consultation</h3>
                <p>
                  Comprehensive style consultation including body analysis, lifestyle assessment, 
                  and wardrobe planning with our master tailors.
                </p>
                <ul className="service-features">
                  <li>90-minute personal session</li>
                  <li>Style guide creation</li>
                  <li>Fabric recommendations</li>
                  <li>Wardrobe planning</li>
                </ul>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div className="service-highlight luxury-card">
                <div className="service-icon">📏</div>
                <h3>Fitting & Measurements</h3>
                <p>
                  Precision measurement session using traditional techniques combined with 
                  modern 3D scanning technology for perfect fit.
                </p>
                <ul className="service-features">
                  <li>30+ precise measurements</li>
                  <li>3D body scanning</li>
                  <li>Posture analysis</li>
                  <li>Pattern creation</li>
                </ul>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={600}>
              <div className="service-highlight luxury-card">
                <div className="service-icon">✨</div>
                <h3>Virtual Consultation</h3>
                <p>
                  Can't visit our atelier? We offer comprehensive virtual consultations with 
                  fabric samples and measurement guidance sent to your home.
                </p>
                <ul className="service-features">
                  <li>Video consultation</li>
                  <li>Fabric sample box</li>
                  <li>Measurement guidance</li>
                  <li>Follow-up support</li>
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </ParallaxSection>

      {/* Map & Location Section */}
      <section className="location-section py-5">
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title text-center mb-5">Find Our Atelier</h2>
          </AnimatedSection>
          
          <div className="location-content">
            <AnimatedSection delay={200}>
              <div className="location-info">
                <h3>Located in London's Historic Tailoring District</h3>
                <p>
                  Our atelier is situated in the heart of London's prestigious tailoring district, 
                  continuing a tradition of excellence that spans over two centuries. Just steps away 
                  from the world's finest fabric merchants and craftsmen.
                </p>
                
                <div className="location-features">
                  <div className="location-feature">
                    <span className="feature-icon">🚇</span>
                    <div>
                      <strong>Public Transport</strong>
                      <p>Oxford Circus (2 min walk) • Bond Street (5 min walk)</p>
                    </div>
                  </div>
                  <div className="location-feature">
                    <span className="feature-icon">🅿️</span>
                    <div>
                      <strong>Parking</strong>
                      <p>Validated parking available at nearby Oxford Street Car Park</p>
                    </div>
                  </div>
                  <div className="location-feature">
                    <span className="feature-icon">♿</span>
                    <div>
                      <strong>Accessibility</strong>
                      <p>Ground floor access with wheelchair-friendly facilities</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div className="map-placeholder">
                <div className="map-container">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.5!2d-0.14!3d51.51!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTHCsDMwJzM2LjAiTiAwwrAwOCcyNC4wIlc!5e0!3m2!1sen!2suk!4v1000000000000!5m2!1sen!2suk"
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: '12px' }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Atelier Location"
                  ></iframe>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;