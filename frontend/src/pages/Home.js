// ASOS-Inspired Home Page - Sustainable Fashion
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { CapacitorHttp } from '@capacitor/core';
import '../styles/index.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

// Animated Product Card for Home Page
const AnimatedProductCard = ({ product, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className={`product-card-wrapper ${isVisible ? 'visible' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <ProductCard product={product} />
    </div>
  );
};

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Modern fashion hero background images
  const heroImages = [
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80'
  ];

  useEffect(() => {
    setMounted(true);
    fetchFeaturedProducts();
    
    // Spectacular parallax scroll effect
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Automatic background image rotation
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 8000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(imageInterval);
    };
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      let data;
      
      // Use Capacitor HTTP for mobile to avoid CORS issues
      if (window.Capacitor?.isNativePlatform?.()) {
        console.log('📱 Using Capacitor HTTP for featured products request');
        
        const httpResponse = await CapacitorHttp.request({
          url: `${API_BASE}/products?limit=6`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });
        
        if (httpResponse.status >= 200 && httpResponse.status < 300) {
          data = httpResponse.data;
        } else {
          throw new Error(`HTTP Error: ${httpResponse.status}`);
        }
      } else {
        // Use regular fetch for web
        console.log('🌐 Using regular fetch for featured products request (v2)');
        const response = await fetch(`${API_BASE}/products?limit=6`);
        data = await response.json();
      }
      
      // Ensure data is an array before setting
      if (Array.isArray(data)) {
        setFeaturedProducts(data);
      } else if (data && Array.isArray(data.products)) {
        setFeaturedProducts(data.products);
      } else {
        throw new Error('Invalid products data format');
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Create mock products for demonstration
      setFeaturedProducts([
        { _id: '1', name: 'Luxury Business Suit', price: 1299, image: 'https://images.unsplash.com/photo-1594938328870-28d8b92e2c8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
        { _id: '2', name: 'Classic Dinner Jacket', price: 1599, image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
        { _id: '3', name: 'Premium Wool Coat', price: 899, image: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
        { _id: '4', name: 'Elegant Dress Shirt', price: 299, image: 'https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
        { _id: '5', name: 'Cashmere Sweater', price: 599, image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
        { _id: '6', name: 'Luxury Accessories', price: 199, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' }
      ]);
    }
  };

  const parallaxTransform = `translateY(${scrollY * 0.5}px)`;
  const opacity = Math.max(0, 1 - scrollY / 800);

  return (
    <div className="modern-home-page">
      {/* Modern Hero Section */}
      <section className="modern-hero-section">
        <div className="hero-background">
          <img 
            src={heroImages[currentImageIndex]}
            alt="Vergi Designs Fashion Collection"
            style={{
              transform: parallaxTransform,
              opacity: opacity
            }}
          />
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="container">
            <div className="hero-text">
              <div className="hero-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Premium Fashion
              </div>
              <h1 className="hero-title">
                Discover Your Perfect
                <span className="hero-accent">Style</span>
              </h1>
              <p className="hero-description">
                Explore our carefully curated collection of premium fashion pieces designed for the modern lifestyle
              </p>
              <div className="hero-actions">
                <Link to="/products" className="hero-btn-primary">
                  <span>Shop Collection</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link to="/about" className="hero-btn-secondary">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Featured Categories */}
      <section className="modern-categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">
              Discover our premium collections designed for every style
            </p>
          </div>
          <div className="modern-categories-grid">
            {[
              { name: 'Women\'s Fashion', subtitle: 'Elegant & Stylish', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', link: '/products?category=women' },
              { name: 'Men\'s Collection', subtitle: 'Modern & Classic', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', link: '/products?category=men' },
              { name: 'Premium Accessories', subtitle: 'Complete Your Look', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', link: '/products?category=accessories' }
            ].map((category, index) => (
              <div key={index} className="modern-category-card">
                <div className="category-image-wrapper">
                  <img src={category.image} alt={category.name} className="category-image" />
                  <div className="category-overlay"></div>
                </div>
                <div className="category-content">
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-description">{category.subtitle}</p>
                  <Link to={category.link} className="category-link">
                    Explore Collection
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="modern-products-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">
              Discover our carefully selected premium fashion pieces
            </p>
          </div>
          <div className="modern-products-grid">
            {(featuredProducts || []).slice(0, 6).map((product, index) => (
              <AnimatedProductCard 
                key={product._id} 
                product={product}
                delay={index * 100}
              />
            ))}
          </div>
          <div className="products-cta">
            <Link to="/products" className="view-all-btn">
              View All Products
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter">
        <div className="newsletter-content">
          <h2 className="newsletter-title">Stay Updated</h2>
          <p className="newsletter-subtitle">
            Get the latest on new arrivals, exclusive deals, and fashion trends
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

export default Home;