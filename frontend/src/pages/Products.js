// Revolutionary Products Page - Spectacular Shopping Experience
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../components/toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

// Admin-style Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

// Product Card with Admin-style Modal
const ProductCardWithModal = ({ product, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const cardRef = useRef(null);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToastContext();

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

  const handleAddToCart = async () => {
    if (!user) {
      showToast('Please login to add items to cart', 'error');
      return;
    }

    setIsAdding(true);
    try {
      const success = await addToCart(product._id, 1);
      if (success) {
        showToast('Product added to cart successfully!', 'success');
        setIsModalOpen(false);
      } else {
        showToast('Failed to add to cart', 'error');
      }
    } catch (error) {
      showToast('Failed to add to cart', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const getStockStatus = () => {
    const stock = product.stock || 0;
    if (stock > 10) return 'in-stock';
    if (stock > 0) return 'low-stock';
    return 'out-of-stock';
  };

  const getStockText = () => {
    const stock = product.stock || 0;
    if (stock > 10) return 'In Stock';
    if (stock > 0) return `${stock} Left`;
    return 'Out of Stock';
  };

  return (
    <>
      <div
        ref={cardRef}
        className={`modern-product-card ${isVisible ? 'visible' : ''}`}
        style={{ animationDelay: `${delay}ms` }}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="product-image-container">
          <img 
            src={product.image_url} 
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.target.src = '/images/placeholder-product.jpg';
            }}
          />
          <div className="product-overlay">
            <span>View Details</span>
          </div>
        </div>

        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-category">{product.category}</p>
          <div className="price-section">
            <span className="price">${product.price}</span>
            <span className={`stock-status ${getStockStatus()}`}>
              {getStockText()}
            </span>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="product-modal-content">
          <h2>{product.name}</h2>

          <section className="modal-section">
            <h3>📦 Product Details</h3>
            <div className="product-details-grid">
              <div className="product-image-section">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="modal-product-image"
                  onError={(e) => {
                    e.target.src = '/images/placeholder-product.jpg';
                  }}
                />
              </div>
              <div className="product-info-section">
                <p><strong>Category:</strong> {product.category}</p>
                <p><strong>Price:</strong> ${product.price}</p>
                <p><strong>Stock:</strong> <span className={getStockStatus()}>{getStockText()}</span></p>
                {product.description && (
                  <p><strong>Description:</strong> {product.description}</p>
                )}
                {product.brand && (
                  <p><strong>Brand:</strong> {product.brand}</p>
                )}
              </div>
            </div>
          </section>

          <section className="modal-section">
            <h3>🛒 Actions</h3>
            <div className="modal-actions">
              <button
                className={`modal-btn primary ${(product.stock || 0) <= 0 ? 'disabled' : ''}`}
                onClick={handleAddToCart}
                disabled={isAdding || (product.stock || 0) <= 0}
              >
                {isAdding ? 'Adding...' : 
                 (product.stock || 0) <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                className="modal-btn secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      </Modal>
    </>
  );
};

// Keep the original for backward compatibility
const ModernProductCard = ({ product, delay = 0 }) => {
  return <ProductCardWithModal product={product} delay={delay} />;
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