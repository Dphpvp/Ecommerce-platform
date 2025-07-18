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
      {/* Revolutionary Hero Section */}
      <section 
        ref={heroRef}
        className="hero-revolutionary"
        style={{
          backgroundImage: `url(${heroImages[currentImageIndex]})`,
          transform: parallaxTransform,
          opacity: opacity
        }}
      >
        <div className="hero-content-revolutionary">
          <div className="hero-glass-card">
            <h1 className="hero-title-revolutionary">
              Luxury Redefined
            </h1>
            <p className="hero-subtitle-revolutionary">
              Experience the pinnacle of elegance with our exclusive collection of premium fashion and accessories
            </p>
            <div className="hero-buttons-revolutionary">
              <Link to="/products" className="btn-revolutionary btn-luxury-revolutionary">
                <span>Explore Collection</span>
                <i className="fas fa-arrow-right"></i>
              </Link>
              <Link to="/contact" className="btn-revolutionary btn-glass-revolutionary">
                <span>Book Consultation</span>
                <i className="fas fa-calendar-alt"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionary Services Section */}
      <section className="section-revolutionary parallax-revolutionary">
        <div className="parallax-layer parallax-bg" style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)',
          transform: `translateY(${scrollY * 0.3}px)`
        }}></div>
        <div className="parallax-layer parallax-fg">
          <div className="container">
            <div className="section-header-revolutionary">
              <h2 className="section-title-revolutionary">Our Premium Services</h2>
              <p className="section-subtitle-revolutionary">
                Discover luxury craftsmanship with our exclusive range of bespoke services
              </p>
            </div>
            
            <div className="product-grid-revolutionary">
              {[
                {
                  title: "Bespoke Tailoring",
                  description: "Custom-made suits crafted to perfection with premium fabrics and expert craftsmanship.",
                  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                  icon: "✂️"
                },
                {
                  title: "Luxury Alterations",
                  description: "Professional alterations to ensure the perfect fit for your precious garments.",
                  image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                  icon: "📏"
                },
                {
                  title: "Premium Accessories",
                  description: "Curated selection of luxury accessories to complement your sophisticated style.",
                  image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                  icon: "👔"
                }
              ].map((service, index) => (
                <div key={index} className="product-card-revolutionary">
                  <div className="product-image-revolutionary">
                    <div 
                      className="product-image-revolutionary"
                      style={{ 
                        backgroundImage: `url(${service.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    ></div>
                    <div className="product-badge-revolutionary">
                      {service.icon}
                    </div>
                  </div>
                  <div className="product-content-revolutionary">
                    <h3 className="product-title-revolutionary">{service.title}</h3>
                    <p className="product-description-revolutionary">{service.description}</p>
                    <div className="product-actions-revolutionary">
                      <Link to="/contact" className="product-btn-revolutionary product-btn-primary-revolutionary">
                        Learn More
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionary Featured Products */}
      <section className="section-revolutionary">
        <div className="container">
          <div className="section-header-revolutionary">
            <h2 className="section-title-revolutionary">Featured Collection</h2>
            <p className="section-subtitle-revolutionary">
              Handpicked luxury items that define exceptional style and quality
            </p>
          </div>
          
          <div className="product-grid-revolutionary">
            {featuredProducts.map((product, index) => (
              <div key={product._id} className="product-card-revolutionary">
                <div className="product-image-revolutionary">
                  <div 
                    className="product-image-revolutionary"
                    style={{ 
                      backgroundImage: `url(${product.image || `https://images.unsplash.com/photo-${1594938328870 + index}-28d8b92e2c8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80`})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  ></div>
                  <div className="product-badge-revolutionary">
                    Premium
                  </div>
                </div>
                <div className="product-content-revolutionary">
                  <h3 className="product-title-revolutionary">{product.name}</h3>
                  <p className="product-description-revolutionary">
                    Crafted with precision and attention to detail, this piece represents the pinnacle of luxury fashion.
                  </p>
                  <div className="product-price-revolutionary">
                    <span className="product-price-current-revolutionary">
                      ${product.price || 999}
                    </span>
                  </div>
                  <div className="product-actions-revolutionary">
                    <Link to={`/products/${product._id}`} className="product-btn-revolutionary product-btn-primary-revolutionary">
                      View Details
                    </Link>
                    <button className="product-btn-revolutionary product-btn-secondary-revolutionary">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center" style={{ marginTop: '4rem' }}>
            <Link to="/products" className="btn-revolutionary btn-luxury-revolutionary">
              <span>View Full Collection</span>
              <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* Revolutionary CTA Section */}
      <section className="section-revolutionary parallax-revolutionary">
        <div className="parallax-layer parallax-bg" style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80)',
          transform: `translateY(${scrollY * 0.2}px)`
        }}></div>
        <div className="parallax-layer parallax-fg">
          <div className="container">
            <div className="section-header-revolutionary">
              <h2 className="section-title-revolutionary">Ready to Experience Luxury?</h2>
              <p className="section-subtitle-revolutionary">
                Join thousands of satisfied customers who trust us for their luxury fashion needs
              </p>
              <div style={{ marginTop: '3rem' }}>
                <Link to="/contact" className="btn-revolutionary btn-luxury-revolutionary" style={{ marginRight: '2rem' }}>
                  <span>Book Consultation</span>
                  <i className="fas fa-calendar-alt"></i>
                </Link>
                <Link to="/products" className="btn-revolutionary btn-glass-revolutionary">
                  <span>Shop Now</span>
                  <i className="fas fa-shopping-bag"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionary Stats Section */}
      <section className="section-revolutionary">
        <div className="container">
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            textAlign: 'center'
          }}>
            {[
              { number: '10,000+', label: 'Happy Customers', icon: '😊' },
              { number: '25+', label: 'Years Experience', icon: '🏆' },
              { number: '500+', label: 'Premium Products', icon: '💎' },
              { number: '99%', label: 'Satisfaction Rate', icon: '⭐' }
            ].map((stat, index) => (
              <div key={index} className="stat-card" style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '2rem',
                padding: '3rem 2rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transform: 'translateY(0)',
                transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px) rotateX(10deg)';
                e.currentTarget.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) rotateX(0deg)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#D4AF37', marginBottom: '0.5rem' }}>
                  {stat.number}
                </div>
                <div style={{ fontSize: '1.2rem', color: '#6C757D' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;