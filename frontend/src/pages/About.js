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

      {/* Newsletter Section */}
      <section className="newsletter">
        <div className="newsletter-content">
          <h2 className="newsletter-title">Stay in the Loop</h2>
          <p className="newsletter-subtitle">
            Get the latest on sustainable fashion trends, new arrivals, and exclusive offers
          </p>
          <form className="newsletter-form">
            <input
              type="email"
              placeholder="Enter your email address"
              className="newsletter-input"
              required
            />
            <button type="submit" className="newsletter-button">
              Subscribe
            </button>
          </form>
          <div className="social-media-links">
            <a href="#" className="social-link" aria-label="Follow us on Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="Follow us on Facebook">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="Follow us on Twitter">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="Follow us on TikTok">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          </div>
          <div className="footer-content">
            <p className="footer-text">
              Made by{' '}
              <a 
                href="https://github.com/pradian" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                Petre Alexandru
              </a>{' '}
              and{' '}
              <a 
                href="https://github.com/Dphpvp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                Dph
              </a>
              <span className="footer-separator">•</span>
              <span className="footer-copyright">© 2025 All rights reserved</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;