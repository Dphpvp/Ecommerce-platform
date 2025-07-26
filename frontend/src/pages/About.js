// Modern About Page - Matching Theme Design
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import NewsletterSubscribe from '../components/NewsletterSubscribe';

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
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="about-page">
      {/* Modern About Hero Section */}
      <section className="modern-hero-section">
        <div className="hero-background">
          <img 
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Our Story"
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
                <span>About Us</span>
              </div>
              <h1 className="hero-title">
                Crafting Excellence,
                <span className="hero-accent">Building Trust</span>
              </h1>
              <p className="hero-description">
                Discover the story behind our commitment to quality, innovation, and exceptional customer experiences that define who we are.
              </p>
              <div className="hero-actions">
                <Link to="/products" className="hero-btn-primary">
                  Explore Products
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link to="/contact" className="hero-btn-secondary">
                  Get in Touch
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Story Section */}
      <section className="modern-products-section">
        <div className="container">
          <div className="modern-section-header">
            <div className="section-badge">
              <span>Our Journey</span>
            </div>
            <h2 className="modern-title">The Story Behind Excellence</h2>
            <p className="modern-subtitle">
              From humble beginnings to becoming a trusted name in quality products
            </p>
          </div>
          
          <div className="story-content-grid">
            <div className="story-text">
              <FadeInSection>
                <div className="story-card">
                  <div className="story-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <h3>Founded with Purpose</h3>
                  <p className="story-lead">
                    Founded in 2020, we started with a simple yet powerful mission: to provide high-quality products 
                    at fair prices with exceptional customer service that exceeds expectations.
                  </p>
                </div>
                
                <div className="story-card">
                  <div className="story-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                  <h3>Growth Through Innovation</h3>
                  <p className="story-paragraph">
                    What began as a small online store has grown into a trusted destination for customers 
                    seeking quality products and reliable service. We carefully curate our selection to 
                    ensure every item meets our rigorous standards.
                  </p>
                </div>
                
                <div className="story-card">
                  <div className="story-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <h3>Serving Thousands</h3>
                  <p className="story-paragraph">
                    Today, we proudly serve thousands of satisfied customers worldwide, maintaining our unwavering 
                    commitment to quality, value, and outstanding customer experience in everything we do.
                  </p>
                </div>
              </FadeInSection>
            </div>
            
            <div className="story-image">
              <FadeInSection delay={200}>
                <div className="story-image-container">
                  <img 
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="Our team collaboration"
                    className="story-image-photo"
                  />
                  <div className="story-overlay">
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
                        <span className="stat-label">Quality Products</span>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Values Section */}
      <section className="modern-products-section">
        <div className="container">
          <div className="modern-section-header">
            <div className="section-badge">
              <span>Our Values</span>
            </div>
            <h2 className="modern-title">What Drives Us Forward</h2>
            <p className="modern-subtitle">
              The core principles that guide every decision and define our commitment to excellence
            </p>
          </div>
          
          <div className="modern-products-grid">
            <FadeInSection delay={100}>
              <div className="modern-product-card value-card">
                <div className="product-image-container value-icon-container">
                  <div className="value-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                </div>
                <div className="product-info">
                  <h3 className="product-name">Premium Quality</h3>
                  <p className="product-category">Core Value</p>
                  <div className="value-description">
                    We carefully select and test every product to ensure it meets our rigorous standards for quality, durability, and performance.
                  </div>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={200}>
              <div className="modern-product-card value-card">
                <div className="product-image-container value-icon-container">
                  <div className="value-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                </div>
                <div className="product-info">
                  <h3 className="product-name">Customer Focus</h3>
                  <p className="product-category">Core Value</p>
                  <div className="value-description">
                    Our customers are at the center of everything we do. We're dedicated to providing exceptional service and support that exceeds expectations.
                  </div>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={300}>
              <div className="modern-product-card value-card">
                <div className="product-image-container value-icon-container">
                  <div className="value-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                </div>
                <div className="product-info">
                  <h3 className="product-name">Innovation</h3>
                  <p className="product-category">Core Value</p>
                  <div className="value-description">
                    We continuously seek new ways to improve our products and services, embracing technology and fresh ideas to better serve our customers.
                  </div>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={400}>
              <div className="modern-product-card value-card">
                <div className="product-image-container value-icon-container">
                  <div className="value-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                </div>
                <div className="product-info">
                  <h3 className="product-name">Sustainability</h3>
                  <p className="product-category">Core Value</p>
                  <div className="value-description">
                    We're committed to responsible business practices and reducing our environmental impact through conscious choices and sustainable operations.
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="modern-products-section newsletter-section">
        <div className="container">
          <div className="modern-section-header">
            <div className="section-badge">
              <span>Stay Connected</span>
            </div>
            <h2 className="modern-title">Join Our Community</h2>
            <p className="modern-subtitle">
              Subscribe to our newsletter for exclusive updates, special offers, and behind-the-scenes insights
            </p>
          </div>
          
          <div className="newsletter-container">
            <FadeInSection>
              <NewsletterSubscribe variant="default" />
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="modern-cta-section">
        <div className="container">
          <FadeInSection>
            <div className="modern-cta-content">
              <div className="cta-text">
                <h2 className="cta-title">Ready to Experience Excellence?</h2>
                <p className="cta-description">
                  Discover our collection of premium products and experience the difference that quality and exceptional service make.
                </p>
              </div>
              <div className="cta-actions">
                <Link to="/products" className="primary-cta-btn">
                  Explore Products
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link to="/contact" className="secondary-cta-btn">
                  Get in Touch
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