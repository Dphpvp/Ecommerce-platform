// ASOS-Inspired About Page - Sustainable Fashion Story
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import NewsletterSubscribe from '../components/NewsletterSubscribe';
import '../styles/index.css';

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
                <svg className="eco-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>Sustainable Fashion</span>
              </div>
              <h1 className="hero-title">
                Fashion with Purpose,
                <span className="hero-accent">Style with Impact</span>
              </h1>
              <p className="hero-description">
                Discover our mission to revolutionize fashion through sustainability, ethical practices, and timeless designs that respect both people and planet.
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
            <h2 className="modern-title">Pioneering Sustainable Fashion</h2>
            <p className="modern-subtitle">
              From a vision of ethical fashion to becoming a leader in sustainable style and conscious consumption
            </p>
          </div>
          
          <div className="story-content-grid">
            <div className="story-text">
              <FadeInSection>
                <div className="story-card">
                  <div className="story-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
                      <path d="M8 12l2 2 4-4"/>
                    </svg>
                  </div>
                  <h3>Founded on Sustainability</h3>
                  <p className="story-lead">
                    Born from a vision in 2020, EcoFashion emerged to revolutionize the fashion industry through 
                    sustainable practices, ethical manufacturing, and timeless designs that honor both style and environmental responsibility.
                  </p>
                </div>
                
                <div className="story-card">
                  <div className="story-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                      <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  </div>
                  <h3>Ethical Supply Chain</h3>
                  <p className="story-paragraph">
                    We've built partnerships with certified sustainable suppliers and fair-trade manufacturers worldwide, 
                    ensuring every piece in our collection meets the highest standards for environmental and social responsibility.
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
                  <h3>Global Community</h3>
                  <p className="story-paragraph">
                    Today, we're proud to serve a global community of conscious consumers who choose sustainable fashion. 
                    Together, we're proving that style and sustainability can beautifully coexist.
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

      {/* Values Section */}
      <section className="values-section">
        <div className="container">
          <h2>Our Values</h2>
          <p>The core principles that drive our commitment to ethical fashion and environmental responsibility</p>
          
          <div className="values-grid">
            <div className="value-item">
              <div className="value-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3>Eco-Friendly Materials</h3>
              <p>We exclusively use organic, recycled, and sustainably-sourced materials that minimize environmental impact while maintaining exceptional quality and comfort.</p>
            </div>

            <div className="value-item">
              <div className="value-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>Fair Trade Practices</h3>
              <p>We ensure fair wages and safe working conditions throughout our supply chain, supporting communities and empowering artisans worldwide.</p>
            </div>

            <div className="value-item">
              <div className="value-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <h3>Circular Fashion</h3>
              <p>We design for longevity and embrace circular economy principles, offering repair services, take-back programs, and timeless designs that transcend trends.</p>
            </div>

            <div className="value-item">
              <div className="value-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3>Carbon Neutral</h3>
              <p>We offset 100% of our carbon footprint through verified environmental projects and continuously work to minimize our impact through renewable energy and efficient operations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <h2>Join Our Community</h2>
          <p>Subscribe to our newsletter for exclusive updates, special offers, and behind-the-scenes insights</p>
          <NewsletterSubscribe variant="default" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Experience Excellence?</h2>
          <p>Discover our collection of premium products and experience the difference that quality and exceptional service make.</p>
          <div className="cta-buttons">
            <Link to="/products" className="btn btn-primary">
              Explore Products
            </Link>
            <Link to="/contact" className="btn btn-secondary">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;