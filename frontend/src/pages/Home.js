// ASOS-Inspired Home Page - Sustainable Fashion
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
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
    <div className="page-container-full">
      {/* ASOS-Inspired Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <img 
            src={heroImages[currentImageIndex]}
            alt="Sustainable Fashion Collection"
            style={{
              transform: parallaxTransform,
              opacity: opacity
            }}
          />
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <svg className="eco-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Sustainable Fashion
          </div>
          <h1 className="hero-title">
            Fashion that feels good,
            <br />looks amazing
          </h1>
          <p className="hero-subtitle">
            Discover our curated collection of sustainable fashion pieces designed for the conscious consumer who values style and ethics
          </p>
          <div className="hero-actions">
            <Link to="/products" className="hero-cta">
              Shop Collection
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <Link to="/about" className="hero-secondary">
              Our Story
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15,3 21,3 21,9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>


      {/* Featured Categories */}
      <section className="featured-categories">
        <div className="section-header">
          <h2 className="section-title">Shop by Category</h2>
          <p className="section-subtitle">
            Explore our sustainable fashion collections designed for every occasion
          </p>
        </div>
        <div className="categories-grid">
          {[
            { name: 'Women\'s Wear', subtitle: 'Sustainable & Stylish', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
            { name: 'Men\'s Collection', subtitle: 'Ethical Fashion', image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
            { name: 'Accessories', subtitle: 'Eco-Friendly Materials', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' }
          ].map((category, index) => (
            <div key={index} className="category-card">
              <img src={category.image} alt={category.name} className="category-card-image" />
              <div className="category-card-overlay">
                <h3 className="category-title">{category.name}</h3>
                <p className="category-subtitle">{category.subtitle}</p>
                <Link to="/products" className="category-button">
                  Shop Now
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="section-header">
          <h2 className="section-title">Featured Products</h2>
          <p className="section-subtitle">
            Discover our handpicked selection of sustainable fashion pieces
          </p>
        </div>
        <div className="featured-products-grid">
          <div className="product-grid">
            {featuredProducts.slice(0, 6).map((product, index) => (
              <AnimatedProductCard 
                key={product._id} 
                product={product}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Sustainability Promise */}
      <section className="sustainability-promise">
        <div className="sustainability-content">
          <div className="section-header">
            <h2 className="section-title">Our Sustainability Promise</h2>
            <p className="section-subtitle">
              We're committed to creating fashion that doesn't cost the earth
            </p>
          </div>
          <div className="sustainability-features">
            {[
              { icon: '🌱', title: 'Organic Materials', description: 'Made from certified organic and recycled materials' },
              { icon: '♻️', title: 'Circular Fashion', description: 'Designed for longevity and recyclability' },
              { icon: '🌍', title: 'Carbon Neutral', description: 'Every purchase is carbon neutral through our offset program' },
              { icon: '👥', title: 'Fair Trade', description: 'Supporting fair wages and working conditions' }
            ].map((feature, index) => (
              <div key={index} className="sustainability-feature">
                <div className="sustainability-icon">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
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
        </div>
      </section>
    </div>
  );
};

export default Home;