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
      className={`product-card-wrapper animate-on-scroll ${isIntersecting ? 'is-visible' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="enhanced-product-card">
        <ProductCard product={product} />
      </div>
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
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="products">
      {/* Products Hero Section */}
      <ParallaxSection
        backgroundImage="/images/fabric-samples-hero.jpg"
        speed={-0.3}
        className="products-hero-section"
        overlay={true}
        overlayOpacity={0.5}
        height="50vh"
      >
        <div className="container text-center">
          <div className="hero-content">
            <h1 className="hero-title text-white">Our Premium Collection</h1>
            <p className="hero-subtitle text-white">
              Discover exceptional fabrics and craftsmanship in our curated selection
            </p>
          </div>
        </div>
      </ParallaxSection>

      {/* Filters Section */}
      <section className="filters-section py-4 bg-white shadow-sm">
        <div className="container">
          <div className="products-header">
            <div className="search-filter-container">
              {/* Search Input */}
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              
              {/* Category Filter */}
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-filter luxury-select"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="products-count">
              <span className="count-text">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid Section */}
      <ParallaxSection
        backgroundImage="/images/workshop-tools-bg.jpg"
        speed={-0.1}
        className="products-grid-section fabric-wool"
        overlay={true}
        overlayOpacity={0.05}
        height="auto"
      >
        <div className="container py-5">
          {loading ? (
            <div className="loading-section text-center py-5">
              <div className="loading-spinner"></div>
              <p>Loading our exquisite collection...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products-section text-center py-5">
              <h3>No Products Found</h3>
              <p>
                {searchTerm || selectedCategory 
                  ? 'Try adjusting your search criteria or browse all products.' 
                  : 'Our collection is being updated. Please check back soon.'}
              </p>
              {(searchTerm || selectedCategory) && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                  className="btn-outline-luxury"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Featured Categories */}
              {!selectedCategory && !searchTerm && (
                <div className="featured-categories mb-5">
                  <h2 className="section-title text-center mb-4">Shop by Category</h2>
                  <div className="category-cards">
                    {categories.slice(0, 4).map((category, index) => (
                      <ParallaxElement key={category} speed={-0.1 + index * 0.05}>
                        <div 
                          className="category-card luxury-card cursor-pointer"
                          onClick={() => setSelectedCategory(category)}
                        >
                          <h4>{category}</h4>
                          <p>Explore our {category.toLowerCase()} collection</p>
                          <span className="category-arrow">→</span>
                        </div>
                      </ParallaxElement>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Grid */}
              <div className="enhanced-product-grid">
                {filteredProducts.map((product, index) => (
                  <AnimatedProductCard 
                    key={product._id} 
                    product={product}
                    delay={index * 50}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </ParallaxSection>

      {/* Call to Action Section */}
      <ParallaxSection
        backgroundImage="/images/consultation-room.jpg"
        speed={-0.4}
        className="products-cta-section"
        overlay={true}
        overlayOpacity={0.6}
        height="40vh"
      >
        <div className="container text-center">
          <div className="cta-content">
            <h2 className="text-white mb-3">Need Help Choosing?</h2>
            <p className="text-white mb-4">
              Our expert consultants are here to help you find the perfect fit and style.
            </p>
            <a href="/contact" className="btn-luxury">
              <span>Schedule Consultation</span>
            </a>
          </div>
        </div>
      </ParallaxSection>
    </div>
  );
};

export default Products;