// Modern About Page - Clean and Professional
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Simple Animation Component
const FadeInSection = ({ children, className = '', delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={sectionRef}
      className={`fade-in-section ${isVisible ? 'visible' : ''} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const About = () => {

  return (
    <div className="about-page">
      {/* Modern About Hero Section */}
      <section className="modern-about-hero">
        <div className="container">
          <div className="about-hero-content">
            <div className="hero-badge">About Us</div>
            <h1 className="about-hero-title">
              Quality Products,
              <span className="hero-accent">Exceptional Service</span>
            </h1>
            <p className="about-hero-description">
              We're committed to delivering premium products and outstanding customer service that exceeds expectations
            </p>
          </div>
        </div>
      </section>

      {/* Modern Story Section */}
      <section className="modern-story-section">
        <div className="container">
          <div className="story-content">
            <div className="story-text">
              <FadeInSection>
                <h2 className="section-title">Our Story</h2>
                <p className="story-lead">
                  Founded in 2020, we started with a simple mission: to provide high-quality products 
                  at fair prices with exceptional customer service.
                </p>
                <p className="story-paragraph">
                  What began as a small online store has grown into a trusted destination for customers 
                  seeking quality products and reliable service. We carefully curate our selection to 
                  ensure every item meets our high standards.
                </p>
                <p className="story-paragraph">
                  Today, we serve thousands of satisfied customers worldwide, maintaining our commitment 
                  to quality, value, and outstanding customer experience.
                </p>
                <div className="story-stats">
                  <div className="stat-item">
                    <span className="stat-number">5+</span>
                    <span className="stat-label">Years Experience</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">10,000+</span>
                    <span className="stat-label">Happy Customers</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">500+</span>
                    <span className="stat-label">Products</span>
                  </div>
                </div>
              </FadeInSection>
            </div>
            <div className="story-image">
              <FadeInSection delay={200}>
                <img 
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Our team at work"
                  className="story-image-photo"
                />
              </FadeInSection>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Values Section */}
      <section className="modern-values-section">
        <div className="container">
          <FadeInSection>
            <div className="section-header">
              <h2 className="section-title">Our Values</h2>
              <p className="section-subtitle">
                The principles that guide everything we do
              </p>
            </div>
          </FadeInSection>
          
          <div className="values-grid">
            <FadeInSection delay={100}>
              <div className="value-card">
                <div className="value-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3 className="value-title">Quality</h3>
                <p className="value-description">
                  We carefully select and test every product to ensure it meets our high standards for quality and durability.
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={200}>
              <div className="value-card">
                <div className="value-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h3 className="value-title">Customer Focus</h3>
                <p className="value-description">
                  Our customers are at the center of everything we do. We're committed to providing exceptional service and support.
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={300}>
              <div className="value-card">
                <div className="value-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h3 className="value-title">Innovation</h3>
                <p className="value-description">
                  We continuously seek new ways to improve our products and services to better serve our customers.
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={400}>
              <div className="value-card">
                <div className="value-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <h3 className="value-title">Sustainability</h3>
                <p className="value-description">
                  We're committed to responsible business practices and reducing our environmental impact.
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="modern-cta-section">
        <div className="container">
          <FadeInSection>
            <div className="cta-content">
              <h2 className="cta-title">Ready to Shop with Us?</h2>
              <p className="cta-description">
                Discover our collection of quality products and experience the difference that great customer service makes.
              </p>
              <div className="cta-actions">
                <Link to="/products" className="primary-cta-btn">
                  Browse Products
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link to="/contact" className="secondary-cta-btn">
                  Contact Us
                </Link>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
};

export default About;