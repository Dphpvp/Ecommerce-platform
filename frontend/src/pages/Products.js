// frontend/src/pages/Products.js
import React, { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import { ParallaxSection, ParallaxElement } from '../components/Parallax';
import { useIntersectionObserver } from '../hooks/useParallax';




const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Animation component for product cards
const AnimatedProductCard = ({ product, delay = 0 }) => {
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
  });

  return (
    <div
      ref={elementRef}
      className={`luxury-product-wrapper animate-on-scroll ${isIntersecting ? 'is-visible' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <ProductCard product={product} />
    </div>
  );
};

const Products = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedCategory 
        ? `${API_BASE}/products?category=${selectedCategory}`
        : `${API_BASE}/products`;
      
      const response = await fetch(url);
      const data = await response.json();
      setAllProducts(data);

      const uniqueCategories = [...new Set(data.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter and limit products to 30
  const filteredProducts = allProducts
    .filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 30); // Increased to 30 products

  return (
    <div className="luxury-products-page">
      {/* Products Hero Section */}
      <ParallaxSection
        backgroundImage="https://images.unsplash.com/photo-1578662996443-48f949d9e1cc?w=1920&h=1080&fit=crop&auto=format"
        speed={-0.3}
        className="luxury-products-hero"
        overlay={true}
        overlayOpacity={0.6}
        height="70vh"
      >
        <div className="container">
          <div className="luxury-hero-content">
            <h1 className="luxury-hero-title">
              <span className="title-main">Curated Excellence</span>
              <span className="title-accent">Master Crafted Materials</span>
            </h1>
            <p className="luxury-hero-subtitle">
              Each piece in our collection represents generations of textile mastery, sourced from the world's most prestigious mills and artisans
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">{allProducts.length}</span>
                <span className="stat-label">Premium Fabrics</span>
              </div>
              <div className="stat-divider">|</div>
              <div className="stat-item">
                <span className="stat-number">{categories.length}</span>
                <span className="stat-label">Collections</span>
              </div>
              <div className="stat-divider">|</div>
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">Years Heritage</span>
              </div>
            </div>
          </div>
        </div>
      </ParallaxSection>

      {/* Filters Section */}
      <section className="luxury-filters-section">
        <div className="container">
          <div className="luxury-products-header">
            <div className="filters-container">
              <div className="luxury-search-box">
                <input
                  type="text"
                  placeholder="Search our exclusive collection..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="luxury-search-input"
                />
                <span className="luxury-search-icon">⚜</span>
              </div>
              
              <div className="luxury-category-container">
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="luxury-category-select"
                >
                  <option value="">All Collections</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="products-summary">
              <span className="results-count">
                Displaying {filteredProducts.length} of {allProducts.length} pieces
                {filteredProducts.length === 30 && allProducts.length > 30 && (
                  <span className="limit-note"> (showing first 30)</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid Section */}
      <ParallaxSection
        backgroundImage="https://images.unsplash.com/photo-1566146340949-72de7aa8ed26?w=1920&h=1080&fit=crop&auto=format"
        speed={-0.1}
        className="luxury-products-main fabric-silk"
        overlay={true}
        overlayOpacity={0.02}
        height="auto"
      >
        <div className="container">
          {loading ? (
            <div className="luxury-loading-section">
              <div className="luxury-loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
              <h3>Curating Excellence</h3>
              <p>Assembling our finest selection...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="luxury-no-products-section">
              <div className="no-products-icon">🧵</div>
              <h3>Collection Unavailable</h3>
              <p>
                {searchTerm || selectedCategory 
                  ? 'No pieces match your refined criteria. Consider broadening your search to discover our full heritage collection.' 
                  : 'Our master artisans are curating new pieces. Please return shortly.'}
              </p>
              {(searchTerm || selectedCategory) && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                  className="btn-luxury-clear"
                >
                  <span>View Full Collection</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="luxury-products-grid-section">
                <div className="section-header">
                  <h2 className="luxury-section-title">
                    {selectedCategory ? `${selectedCategory} Heritage` : 'Master Collection'}
                  </h2>
                  <p className="section-subtitle">
                    {selectedCategory 
                      ? `Exceptional ${selectedCategory.toLowerCase()} pieces from renowned mills worldwide`
                      : 'Our most distinguished fabrics, carefully selected for the discerning connoisseur'}
                  </p>
                  <div className="title-underline"></div>
                </div>
                
                <div className="luxury-products-grid">
                  {filteredProducts.map((product, index) => (
                    <AnimatedProductCard 
                      key={product._id} 
                      product={product}
                      delay={index * 100}
                    />
                  ))}
                </div>

                {filteredProducts.length === 30 && allProducts.length > 30 && (
                  <div className="collection-note">
                    <div className="note-content">
                      <h4>Exclusive Curation</h4>
                      <p>We're showcasing our top 30 pieces. For our complete collection, please visit our atelier or contact our master tailors.</p>
                      <a href="/contact" className="btn-luxury-contact">
                        <span>Schedule Private Viewing</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ParallaxSection>

      {/* Exclusive Services Section */}
      <ParallaxSection
        backgroundImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop&auto=format"
        speed={-0.4}
        className="luxury-products-cta"
        overlay={true}
        overlayOpacity={0.8}
        height="60vh"
      >
        <div className="container">
          <div className="luxury-cta-content">
            <div className="cta-badge">Bespoke Services</div>
            <h2 className="cta-title">Master Tailor Consultation</h2>
            <p className="cta-subtitle">
              Experience the pinnacle of sartorial excellence with our master tailors. From fabric selection to final fitting, 
              we create garments that transcend fashion and become heirlooms.
            </p>
            <div className="cta-services">
              <div className="service-item">
                <span className="service-icon">👔</span>
                <div className="service-content">
                  <h4>Bespoke Tailoring</h4>
                  <p>Completely custom garments</p>
                </div>
              </div>
              <div className="service-item">
                <span className="service-icon">📏</span>
                <div className="service-content">
                  <h4>Master Fitting</h4>
                  <p>Precision measurements & fittings</p>
                </div>
              </div>
              <div className="service-item">
                <span className="service-icon">🎨</span>
                <div className="service-content">
                  <h4>Style Consultation</h4>
                  <p>Personal wardrobe curation</p>
                </div>
              </div>
            </div>
            <a href="/contact" className="btn-luxury-cta">
              <span className="btn-text">Begin Your Journey</span>
              <span className="btn-arrow">→</span>
            </a>
          </div>
        </div>
      </ParallaxSection>
    </div>
  );
};

export default Products;