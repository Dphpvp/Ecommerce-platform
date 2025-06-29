// frontend/src/pages/Home.js - Enhanced with New Parallax Features
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { 
  ParallaxSection, 
  ParallaxElement, 
  ParallaxImage, 
  ParallaxText,
  useParallaxContext 
} from '../components/Parallax';
import { useScrollAnimation } from '../hooks/useParallax';
import { preloadImages } from '../utils/parallax';
import { parallaxConfig } from '../config/parallax';


const API_BASE = process.env.REACT_APP_API_BASE_URL;

// Animation component for scroll-triggered animations
const AnimatedSection = ({ children, className = '', delay = 0, animationType = 'fadeIn' }) => {
  const { elementRef, isVisible } = useScrollAnimation(0.2);

  return (
    <div
      ref={elementRef}
      className={`animate-on-scroll ${animationType} ${isVisible ? 'is-visible' : ''} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const { isEnabled, performance } = useParallaxContext();

  useEffect(() => {
    fetchFeaturedProducts();
    preloadCriticalImages();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products?limit=6`);
      const data = await response.json();
      setFeaturedProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const preloadCriticalImages = async () => {
    const criticalImages = [
      { src: '/images/hero-fabric-texture.jpg', priority: true },
      { src: '/images/workshop-background.jpg', priority: false },
      { src: '/images/fabric-collection-bg.jpg', priority: false }
    ];

    try {
      await preloadImages(criticalImages, ({ loaded, total, percentage }) => {
        console.log(`Loading images: ${percentage}%`);
      });
      setImagesLoaded(true);
    } catch (error) {
      console.error('Failed to preload images:', error);
      setImagesLoaded(true); // Still show content even if preload fails
    }
  };

  return (
    <div className="home">
      {/* Hero Section with Enhanced Parallax */}
      <ParallaxSection
        backgroundImage="/images/hero-fabric-texture.jpg"
        speed={parallaxConfig.speeds.background}
        className="hero-section"
        overlay={true}
        overlayOpacity={0.4}
        height="100vh"
        priority={true}
        loading={!imagesLoaded}
      >
        <div className="container">
          <AnimatedSection className="hero-content" delay={200} animationType="slideUp">
            <ParallaxText
              animationType="fadeIn"
              splitBy="words"
              stagger={100}
              delay={400}
              className="hero-title"
            >
              Bespoke Tailoring Excellence
            </ParallaxText>
            
            <ParallaxText
              animationType="slideUp"
              delay={800}
              className="hero-subtitle"
            >
              Crafting perfect fits with precision, tradition, and artistry since 1985
            </ParallaxText>
            
            <div className="hero-buttons">
              <AnimatedSection delay={1200} animationType="slideUp">
                <Link to="/products" className="btn-luxury">
                  <span>Explore Collection</span>
                </Link>
              </AnimatedSection>
              <AnimatedSection delay={1400} animationType="slideUp">
                <Link to="/contact" className="btn-outline-luxury">
                  Book Consultation
                </Link>
              </AnimatedSection>
            </div>
          </AnimatedSection>
        </div>
      </ParallaxSection>

      {/* Services Section with Parallax Elements */}
      <ParallaxSection
        backgroundImage="/images/workshop-background.jpg"
        speed={parallaxConfig.speeds.medium}
        className="services-section fabric-linen"
        overlay={true}
        overlayOpacity={0.1}
        height="auto"
      >
        <div className="container">
          <AnimatedSection delay={100}>
            <ParallaxText
              animationType="fadeIn"
              className="section-title"
            >
              Our Craftsmanship Services
            </ParallaxText>
          </AnimatedSection>
          
          <div className="services-grid">
            {[
              {
                icon: "✂️",
                title: "Bespoke Tailoring",
                description: "Custom suits crafted to your exact measurements and preferences. Every detail designed to reflect your personal style and ensure the perfect fit.",
                link: "/products",
                linkText: "Design Your Suit"
              },
              {
                icon: "📏",
                title: "Precision Measurements",
                description: "Professional fitting sessions using traditional techniques combined with modern 3D body scanning technology for unprecedented accuracy.",
                link: "/contact",
                linkText: "Schedule Fitting"
              },
              {
                icon: "🧵",
                title: "Expert Alterations",
                description: "Professional alterations and repairs to ensure your garments maintain their perfect fit and elegant appearance throughout their lifetime.",
                link: "/contact",
                linkText: "Get Quote"
              }
            ].map((service, index) => (
              <AnimatedSection key={index} delay={200 + index * 200} animationType="slideUp">
                <div className="service-card luxury-card">
                  <ParallaxElement speed={-0.1 + index * 0.05}>
                    <span className="service-icon">{service.icon}</span>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <Link to={service.link} className="btn-outline-luxury">
                      {service.linkText}
                    </Link>
                  </ParallaxElement>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </ParallaxSection>

      {/* Process Section with Staggered Animations */}
      <section className="process-section">
        <div className="container">
          <AnimatedSection>
            <ParallaxText
              animationType="fadeIn"
              className="section-title"
            >
              Our Tailoring Process
            </ParallaxText>
          </AnimatedSection>
          
          <div className="process-steps">
            {[
              {
                number: "01",
                title: "Consultation",
                description: "Personal style consultation to understand your preferences, lifestyle, and desired outcome.",
                icon: "💬"
              },
              {
                number: "02", 
                title: "Measurements",
                description: "Precise measurements taken by our master tailors using time-tested techniques.",
                icon: "📐"
              },
              {
                number: "03",
                title: "Fabric Selection", 
                description: "Choose from our curated collection of premium fabrics from renowned mills worldwide.",
                icon: "🧵"
              },
              {
                number: "04",
                title: "Pattern Creation",
                description: "Individual pattern drafted specifically for your unique body shape and posture.",
                icon: "📋"
              },
              {
                number: "05",
                title: "Craftsmanship",
                description: "Skilled artisans hand-craft your garment with meticulous attention to every detail.",
                icon: "✂️"
              },
              {
                number: "06",
                title: "Final Fitting",
                description: "Final adjustments and delivery of your perfectly fitted bespoke garment.",
                icon: "👔"
              }
            ].map((step, index) => (
              <AnimatedSection 
                key={index} 
                delay={index * 150} 
                animationType="slideUp"
                className={`stagger-${index + 1}`}
              >
                <div className="process-step">
                  <ParallaxElement speed={-0.05 * (index + 1)}>
                    <div className="step-number">{step.number}</div>
                    <div className="step-icon">{step.icon}</div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </ParallaxElement>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products with Enhanced Images */}
      <ParallaxSection
        backgroundImage="/images/fabric-collection-bg.jpg"
        speed={parallaxConfig.speeds.slow}
        className="featured-products-section fabric-silk"
        overlay={true}
        overlayOpacity={0.15}
        height="auto"
      >
        <div className="container">
          <AnimatedSection>
            <ParallaxText
              animationType="fadeIn"
              className="section-title"
            >
              Featured Collection
            </ParallaxText>
            <ParallaxText
              animationType="slideUp"
              delay={200}
              className="section-subtitle"
            >
              Discover our handpicked selection of premium garments and accessories
            </ParallaxText>
          </AnimatedSection>
          
          <div className="product-grid">
            {featuredProducts.map((product, index) => (
              <AnimatedSection 
                key={product._id} 
                delay={index * 100}
                animationType="slideUp"
                className={`stagger-${(index % 6) + 1}`}
              >
                <div className="featured-product-wrapper">
                  <ParallaxElement speed={-0.05 + index * 0.02}>
                    <ProductCard product={product} />
                  </ParallaxElement>
                </div>
              </AnimatedSection>
            ))}
          </div>
          
          <AnimatedSection delay={800} animationType="slideUp">
            <div className="text-center mt-5">
              <Link to="/products" className="btn-luxury">
                <span>View Full Collection</span>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </ParallaxSection>

      {/* Performance Information (Debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          Parallax: {isEnabled ? 'ON' : 'OFF'} | Performance: {performance}
        </div>
      )}
    </div>
  );
};

export default Home;