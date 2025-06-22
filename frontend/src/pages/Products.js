// frontend/src/pages/Products.js
import React, { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import { ParallaxSection, ParallaxElement } from '../components/Parallax';
import { useIntersectionObserver } from '../hooks/useParallax';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

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
  const [products, setProducts] = useState([]);
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
      setProducts(data);

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

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="luxury-products-page">
      {/* Products Hero Section */}
      <ParallaxSection
        backgroundImage="https://images.unsplash.com/photo-1578662996443-48f949d9e1cc?w=1920&h=1080&fit=crop&auto=format"
        speed={-0.3}
        className="luxury-products-hero"
        overlay={true}
        overlayOpacity={0.6}
        height="60vh"
      >
        <div className="container">
          <div className="luxury-hero-content">
            <h1 className="luxury-hero-title">
              <span className="title-main">Our Premium Collection</span>
              <span className="title-accent">Bespoke Fabrics & Materials</span>
            </h1>
            <p className="luxury-hero-subtitle">
              Discover exceptional fabrics and craftsmanship in our curated selection of the world's finest materials
            </p>
            <div className="hero-decorative-line"></div>
          </div>
        </div>
      </ParallaxSection>

      {/* Filters Section */}
      <section className="luxury-filters-section">
        <div className="container">
          <div className="luxury-products-header">
            <div className="filters-container">
              {/* Search Input */}
              <div className="luxury-search-box">
                <input
                  type="text"
                  placeholder="Search our collection..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="luxury-search-input"
                />
                <span className="luxury-search-icon">🔍</span>
              </div>
              
              {/* Category Filter */}
              <div className="luxury-category-container">
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="luxury-category-select"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="products-summary">
              <span className="results-count">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'} found
              </span>
              <div className="view-toggle">
                <button className="view-btn active">⊞</button>
                <button className="view-btn">☰</button>
              </div>
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
        overlayOpacity={0.03}
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
              <h3>Curating Our Finest Selection</h3>
              <p>Loading our exquisite collection...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="luxury-no-products-section">
              <div className="no-products-icon">🧵</div>
              <h3>No Fabrics Found</h3>
              <p>
                {searchTerm || selectedCategory 
                  ? 'We couldn\'t find any fabrics matching your criteria. Try adjusting your search or browse our full collection.' 
                  : 'Our master craftsmen are updating the collection. Please return soon.'}
              </p>
              {(searchTerm || selectedCategory) && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                  className="btn-luxury-clear"
                >
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Featured Categories */}
              {!selectedCategory && !searchTerm && (
                <div className="luxury-featured-categories">
                  <div className="section-header">
                    <h2 className="luxury-section-title">Browse by Category</h2>
                    <div className="title-underline"></div>
                  </div>
                  
                  <div className="luxury-category-grid">
                    {categories.slice(0, 4).map((category, index) => (
                      <ParallaxElement key={category} speed={-0.1 + index * 0.05}>
                        <div 
                          className="luxury-category-card"
                          onClick={() => setSelectedCategory(category)}
                        >
                          <div className="category-content">
                            <h4 className="category-name">{category}</h4>
                            <p className="category-description">
                              Explore our {category.toLowerCase()} collection
                            </p>
                            <span className="category-count">
                              {products.filter(p => p.category === category).length} pieces
                            </span>
                          </div>
                          <div className="category-arrow">→</div>
                          <div className="category-hover-effect"></div>
                        </div>
                      </ParallaxElement>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Grid */}
              <div className="luxury-products-grid-section">
                <div className="section-header">
                  <h2 className="luxury-section-title">
                    {selectedCategory ? `${selectedCategory} Collection` : 'Our Collection'}
                  </h2>
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
              </div>
            </>
          )}
        </div>
      </ParallaxSection>

      {/* Call to Action Section */}
      <ParallaxSection
        backgroundImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop&auto=format"
        speed={-0.4}
        className="luxury-products-cta"
        overlay={true}
        overlayOpacity={0.7}
        height="50vh"
      >
        <div className="container">
          <div className="luxury-cta-content">
            <div className="cta-icon">✂️</div>
            <h2 className="cta-title">Bespoke Consultation</h2>
            <p className="cta-subtitle">
              Our master tailors are here to guide you through our collection and help create something truly extraordinary.
            </p>
            <div className="cta-features">
              <div className="cta-feature">
                <span className="feature-icon">👔</span>
                <span>Personal Styling</span>
              </div>
              <div className="cta-feature">
                <span className="feature-icon">📏</span>
                <span>Custom Measurements</span>
              </div>
              <div className="cta-feature">
                <span className="feature-icon">🎨</span>
                <span>Fabric Selection</span>
              </div>
            </div>
            <a href="/contact" className="btn-luxury-cta">
              <span className="btn-text">Schedule Your Consultation</span>
              <span className="btn-arrow">→</span>
            </a>
          </div>
        </div>
      </ParallaxSection>
    </div>
  );
};

export default Products;