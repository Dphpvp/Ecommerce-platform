// Revolutionary Home Page - Spectacular Visual Experience
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Spectacular background images
  const heroImages = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2126&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80'
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
      const response = await fetch(`${API_BASE}/products?limit=6`);
      const data = await response.json();
      setFeaturedProducts(data);
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
    <div className="home">
      {/* Modern Hero Section */}
      <section className="modern-hero-section">
        <div className="hero-background">
          <img 
            src={heroImages[currentImageIndex]}
            alt="Premium Collection"
            className="hero-image"
            style={{
              transform: parallaxTransform,
              opacity: opacity
            }}
          />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="container">
            <div className="hero-text">
              <h1 className="hero-title">
                Premium Quality,
                <span className="hero-accent">Exceptional Style</span>
              </h1>
              <p className="hero-description">
                Discover our curated collection of premium products designed for those who appreciate quality and elegance
              </p>
              <div className="hero-actions">
                <Link to="/products" className="hero-btn-primary">
                  Shop Collection
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Modern Featured Products Section */}
      <section className="modern-products-section">
        <div className="container">
          <div className="modern-section-header">
            <div className="section-badge">
              <span>Featured Collection</span>
            </div>
            <h2 className="modern-title">Curated Excellence</h2>
            <p className="modern-subtitle">
              Discover our handpicked selection of premium products, each chosen for its exceptional quality and design
            </p>
          </div>
          
          <div className="modern-products-grid">
            {featuredProducts.slice(0, 6).map((product, index) => (
              <div key={product._id} className="modern-product-card" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="modern-product-image">
                  <img 
                    src={product.image || `https://images.unsplash.com/photo-${1594938328870 + index}-28d8b92e2c8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`}
                    alt={product.name}
                    loading="lazy"
                  />
                  <div className="modern-product-overlay">
                    <Link to={`/products/${product._id}`} className="modern-view-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Quick View
                    </Link>
                  </div>
                </div>
                <div className="modern-product-content">
                  <h3 className="modern-product-title">{product.name}</h3>
                  <div className="modern-product-price">
                    <span className="current-price">${product.price || 999}</span>
                  </div>
                  <button className="modern-add-to-cart">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="modern-cta-section">
            <Link to="/products" className="modern-view-all-btn">
              View All Products
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="modern-cta-section">
        <div className="container">
          <div className="modern-cta-content">
            <div className="cta-text">
              <h2 className="cta-title">Start Your Shopping Journey</h2>
              <p className="cta-description">
                Discover premium products with exceptional quality and fast delivery
              </p>
            </div>
            <div className="cta-actions">
              <Link to="/products" className="primary-cta-btn">
                Shop Now
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link to="/contact" className="secondary-cta-btn">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Stats Section */}
      <section className="modern-stats-section">
        <div className="container">
          <div className="stats-grid">
            {[
              { number: '10,000+', label: 'Happy Customers' },
              { number: '25+', label: 'Years Experience' },
              { number: '500+', label: 'Premium Products' },
              { number: '99%', label: 'Satisfaction Rate' }
            ].map((stat, index) => (
              <div key={index} className="modern-stat-card">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;