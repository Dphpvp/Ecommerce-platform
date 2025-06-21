// frontend/src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { ParallaxSection, ParallaxElement } from '../components/Parallax';
import { useIntersectionObserver } from '../hooks/useParallax';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

// Animation component for scroll-triggered animations
const AnimatedSection = ({ children, className = '', delay = 0 }) => {
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.2,
  });

  return (
    <div
      ref={elementRef}
      className={`animate-on-scroll ${isIntersecting ? 'is-visible' : ''} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    fetchFeaturedProducts();
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

  return (
    <div className="home">
      {/* Hero Section with Parallax */}
      <ParallaxSection
        backgroundImage="/images/hero-fabric-texture.jpg"
        speed={-0.5}
        className="hero-section"
        overlay={true}
        overlayOpacity={0.4}
        height="100vh"
      >
        <div className="container">
          <AnimatedSection className="hero-content" delay={200}>
            <h1 className="hero-title">Bespoke Tailoring Excellence</h1>
            <p className="hero-subtitle">
              Crafting perfect fits with precision, tradition, and artistry since 1985
            </p>
            <div className="hero-buttons">
              <Link to="/products" className="btn-luxury">
                <span>Explore Collection</span>
              </Link>
              <Link to="/contact" className="btn-outline-luxury">
                Book Consultation
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </ParallaxSection>

      {/* Services Section */}
      <ParallaxSection
        backgroundImage="/images/workshop-background.jpg"
        speed={-0.3}
        className="services-section fabric-linen"
        overlay={true}
        overlayOpacity={0.1}
        height="auto"
      >
        <div className="container">
          <AnimatedSection delay={100}>
            <h2 className="section-title text-center mb-5">Our Craftsmanship Services</h2>
          </AnimatedSection>
          
          <div className="services-grid">
            <AnimatedSection delay={200}>
              <div className="service-card luxury-card">
                <span className="service-icon">✂️</span>
                <h3>Bespoke Tailoring</h3>
                <p>
                  Custom suits crafted to your exact measurements and preferences. 
                  Every detail designed to reflect your personal style and ensure the perfect fit.
                </p>
                <Link to="/products" className="btn-outline-luxury">
                  Design Your Suit
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div className="service-card luxury-card">
                <span className="service-icon">📏</span>
                <h3>Precision Measurements</h3>
                <p>
                  Professional fitting sessions using traditional techniques combined with 
                  modern 3D body scanning technology for unprecedented accuracy.
                </p>
                <Link to="/contact" className="btn-outline-luxury">
                  Schedule Fitting
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={600}>
              <div className="service-card luxury-card">
                <span className="service-icon">🧵</span>
                <h3>Expert Alterations</h3>
                <p>
                  Professional alterations and repairs to ensure your garments maintain 
                  their perfect fit and elegant appearance throughout their lifetime.
                </p>
                <Link to="/contact" className="btn-outline-luxury">
                  Get Quote
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </ParallaxSection>

      {/* Process Section */}
      <section className="process-section">
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title text-center mb-5">Our Tailoring Process</h2>
          </AnimatedSection>
          
          <div className="process-steps">
            {[
              {
                number: "01",
                title: "Consultation",
                description: "Personal style consultation to understand your preferences, lifestyle, and desired outcome."
              },
              {
                number: "02", 
                title: "Measurements",
                description: "Precise measurements taken by our master tailors using time-tested techniques."
              },
              {
                number: "03",
                title: "Fabric Selection", 
                description: "Choose from our curated collection of premium fabrics from renowned mills worldwide."
              },
              {
                number: "04",
                title: "Pattern Creation",
                description: "Individual pattern drafted specifically for your unique body shape and posture."
              },
              {
                number: "05",
                title: "Craftsmanship",
                description: "Skilled artisans hand-craft your garment with meticulous attention to every detail."
              },
              {
                number: "06",
                title: "Final Fitting",
                description: "Final adjustments and delivery of your perfectly fitted bespoke garment."
              }
            ].map((step, index) => (
              <AnimatedSection key={index} delay={index * 100}>
                <div className="process-step">
                  <div className="step-number">{step.number}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products with Parallax */}
      <ParallaxSection
        backgroundImage="/images/fabric-collection-bg.jpg"
        speed={-0.2}
        className="featured-products-section fabric-silk"
        overlay={true}
        overlayOpacity={0.15}
        height="auto"
      >
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title text-center mb-5">Featured Collection</h2>
          </AnimatedSection>
          
          <div className="product-grid">
            {featuredProducts.map((product, index) => (
              <AnimatedSection key={product._id} delay={index * 100}>
                <div className="featured-product-wrapper">
                  <ProductCard product={product} />
                </div>
              </AnimatedSection>
            ))}
          </div>
          
          <AnimatedSection delay={800}>
            <div className="text-center mt-5">
              <Link to="/products" className="btn-luxury">
                <span>View Full Collection</span>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </ParallaxSection>

      {/* Testimonials Section */}
      <section className="testimonials-section py-5">
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title text-center mb-5">What Our Clients Say</h2>
          </AnimatedSection>
          
          <div className="testimonials-grid">
            {[
              {
                text: "The attention to detail and craftsmanship is extraordinary. My suit fits like it was made for me – because it was!",
                author: "James Mitchell",
                title: "CEO, Tech Innovations"
              },
              {
                text: "From the first consultation to the final fitting, the experience was exceptional. The quality speaks for itself.",
                author: "Sarah Williams", 
                title: "Marketing Director"
              },
              {
                text: "I've never owned clothing that fits this perfectly. The team's expertise and passion for their craft is evident in every stitch.",
                author: "David Chen",
                title: "Investment Banker"
              }
            ].map((testimonial, index) => (
              <AnimatedSection key={index} delay={index * 200}>
                <div className="testimonial-card luxury-card">
                  <p className="testimonial-text">"{testimonial.text}"</p>
                  <div className="testimonial-author">
                    <strong>{testimonial.author}</strong>
                    <span>{testimonial.title}</span>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <ParallaxSection
        backgroundImage="/images/atelier-background.jpg"
        speed={-0.4}
        className="cta-section"
        overlay={true}
        overlayOpacity={0.6}
        height="60vh"
      >
        <div className="container text-center">
          <AnimatedSection delay={200}>
            <h2 className="hero-title text-white mb-4">Ready to Experience Bespoke Excellence?</h2>
            <p className="hero-subtitle text-white mb-4">
              Schedule your personal consultation and begin your journey to the perfect fit.
            </p>
            <Link to="/contact" className="btn-luxury">
              <span>Start Your Journey</span>
            </Link>
          </AnimatedSection>
        </div>
      </ParallaxSection>
    </div>
  );
};

export default Home;