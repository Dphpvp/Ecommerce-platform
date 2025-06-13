import React from 'react';
import './styles/about.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="container">
        <div className="about-header">
          <h1>About Vergi Shop</h1>
          <p>Your trusted partner in quality products and exceptional service</p>
        </div>

        <div className="about-content">
          <section className="about-section">
            <h2>Our Story</h2>
            <p>
              Founded in 2020, Vergi Shop has been dedicated to providing customers with 
              high-quality products at competitive prices. What started as a small online 
              venture has grown into a trusted e-commerce platform serving thousands of 
              satisfied customers worldwide.
            </p>
          </section>

          <section className="about-section">
            <h2>Our Mission</h2>
            <p>
              To deliver exceptional value through carefully curated products, outstanding 
              customer service, and a seamless shopping experience. We believe that quality 
              should be accessible to everyone.
            </p>
          </section>

          <section className="about-section">
            <h2>Why Choose Us?</h2>
            <div className="features-grid">
              <div className="feature-item">
                <h3>🚚 Fast Shipping</h3>
                <p>Quick and reliable delivery to your doorstep</p>
              </div>
              <div className="feature-item">
                <h3>✅ Quality Guarantee</h3>
                <p>All products are carefully inspected for quality</p>
              </div>
              <div className="feature-item">
                <h3>🔒 Secure Shopping</h3>
                <p>Your data and transactions are always protected</p>
              </div>
              <div className="feature-item">
                <h3>💬 24/7 Support</h3>
                <p>Our customer service team is always here to help</p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Our Values</h2>
            <div className="values-list">
              <div className="value-item">
                <strong>Customer First:</strong> Your satisfaction is our top priority
              </div>
              <div className="value-item">
                <strong>Quality:</strong> We never compromise on the quality of our products
              </div>
              <div className="value-item">
                <strong>Transparency:</strong> Honest pricing and clear communication
              </div>
              <div className="value-item">
                <strong>Innovation:</strong> Constantly improving our platform and services
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Contact Information</h2>
            <p>
              Have questions or need assistance? We'd love to hear from you! 
              Visit our <a href="/contact">contact page</a> or reach out to us directly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;