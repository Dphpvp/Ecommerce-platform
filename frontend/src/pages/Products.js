// Revolutionary Products Page - Spectacular Shopping Experience
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Modern Product Card Component
const ModernProductCard = ({ product, delay = 0 }) => {
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
      className={`modern-product-card ${isVisible ? 'visible' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="product-image-container">
        <img 
          src={product.image || `https://images.unsplash.com/photo-${1594938328870 + Math.floor(Math.random() * 100)}-${Math.random().toString(36).substr(2, 9)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        <div className="product-overlay">
          <Link to={`/products/${product._id}`} className="view-product-btn">
            View Details
          </Link>
        </div>
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">
          {product.description || 'High-quality product designed for exceptional performance and style.'}
        </p>
        <div className="product-price">
          <span className="current-price">${product.price || 999}</span>
        </div>
        <button className="add-to-cart-btn">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

const Products = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="products-page">
      {/* Modern Products Hero Section */}
      <section className="modern-products-hero">
        <div className="container">
          <div className="products-hero-content">
            <div className="hero-badge">Our Collection</div>
            <h1 className="products-hero-title">
              Premium Products
            </h1>
            <p className="products-hero-description">
              Discover our carefully curated selection of high-quality products designed for exceptional performance and style
            </p>
            <div className="products-stats">
              <div className="stat-item">
                <span className="stat-number">{allProducts.length}</span>
                <span className="stat-label">Products</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">{categories.length}</span>
                <span className="stat-label">Categories</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Filters Section */}
      <section className="modern-filters-section">
        <div className="container">
          <div className="filters-container">
            <div className="search-container">
              <div className="search-box">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="category-container">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="results-summary">
            <span className="results-text">
              Showing {filteredProducts.length} of {allProducts.length} products
              {filteredProducts.length === 30 && allProducts.length > 30 && (
                <span className="limit-note"> (first 30 shown)</span>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Modern Products Grid Section */}
      <section className="modern-products-grid-section">
        <div className="container">
          {loading ? (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products-section">
              <div className="no-products-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </div>
              <h3 className="no-products-title">No Products Found</h3>
              <p className="no-products-text">
                {searchTerm || selectedCategory 
                  ? 'No products match your search criteria. Try adjusting your filters.' 
                  : 'No products available at the moment.'}
              </p>
              {(searchTerm || selectedCategory) && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                  className="clear-filters-btn"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="products-grid-content">
              <div className="section-header">
                <h2 className="section-title">
                  {selectedCategory ? selectedCategory : 'All Products'}
                </h2>
                <p className="section-subtitle">
                  {selectedCategory 
                    ? `Discover our ${selectedCategory.toLowerCase()} collection`
                    : 'Browse our complete product range'}
                </p>
              </div>
              
              <div className="modern-products-grid">
                {filteredProducts.map((product, index) => (
                  <ModernProductCard 
                    key={product._id} 
                    product={product}
                    delay={index * 50}
                  />
                ))}
              </div>

              {filteredProducts.length === 30 && allProducts.length > 30 && (
                <div className="pagination-note">
                  <p className="note-text">
                    Showing first 30 products. Contact us to explore our full collection.
                  </p>
                  <Link to="/contact" className="contact-btn">
                    Contact Us
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default Products;