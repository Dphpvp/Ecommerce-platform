// ASOS-Inspired Products Page - Sustainable Fashion Catalog
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../components/toast';
import '../styles/index.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

// Admin-style Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
    <div className="product-listing">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link to="/" className="breadcrumb-link">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Products</span>
      </div>

      {/* Filters Sidebar */}
      <div className="filters-sidebar">
        <div className="filters-header">
          <h3 className="filters-title">Filters</h3>
          <button 
            className="clear-filters"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
            }}
          >
            Clear All
          </button>
        </div>

        {/* Search Filter */}
        <div className="filter-group">
          <div className="filter-group-title">
            <span>Search</span>
          </div>
          <div className="filter-options">
            <div className="search-bar">
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
        </div>

        {/* Category Filter */}
        <div className="filter-group">
          <div className="filter-group-title">
            <span>Category</span>
          </div>
          <div className="filter-options">
            <div className="filter-option">
              <input
                type="radio"
                id="all-categories"
                name="category"
                checked={selectedCategory === ''}
                onChange={() => setSelectedCategory('')}
                style={{ display: 'none' }}
              />
              <div 
                className={`filter-checkbox ${selectedCategory === '' ? 'checked' : ''}`}
                onClick={() => setSelectedCategory('')}
              ></div>
              <label className="filter-label">All Categories</label>
            </div>
            {categories.map(category => (
              <div key={category} className="filter-option">
                <input
                  type="radio"
                  id={`cat-${category}`}
                  name="category"
                  checked={selectedCategory === category}
                  onChange={() => setSelectedCategory(category)}
                  style={{ display: 'none' }}
                />
                <div 
                  className={`filter-checkbox ${selectedCategory === category ? 'checked' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                ></div>
                <label className="filter-label">{category}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Sustainability Filter */}
        <div className="filter-group">
          <div className="filter-group-title">
            <span>Sustainability</span>
          </div>
          <div className="filter-options">
            <div className="filter-option">
              <div className="filter-checkbox checked"></div>
              <label className="filter-label">Eco-Friendly</label>
            </div>
            <div className="filter-option">
              <div className="filter-checkbox checked"></div>
              <label className="filter-label">Organic Materials</label>
            </div>
            <div className="filter-option">
              <div className="filter-checkbox checked"></div>
              <label className="filter-label">Fair Trade</label>
            </div>
          </div>
        </div>
      </div>

      {/* Product Listing Main */}
      <div className="product-listing-main">
        {/* Listing Header */}
        <div className="listing-header">
          <div className="listing-info">
            <h1 className="listing-title">
              {selectedCategory ? selectedCategory : 'All Products'}
            </h1>
            <span className="results-count">
              {filteredProducts.length} products
            </span>
          </div>
          <div className="listing-controls">
            <div className="view-toggle">
              <button className="view-toggle-btn active">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button className="view-toggle-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="sort-dropdown">
              <button className="sort-button">
                Sort by: Newest
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="error-container">
            <div className="error-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <h3 className="error-title">No Products Found</h3>
            <p className="error-message">
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
                className="btn btn-primary"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="products-grid grid-view">
              {filteredProducts.map((product, index) => (
                <ModernProductCard 
                  key={product._id} 
                  product={product}
                  delay={index * 50}
                />
              ))}
            </div>

            {/* Pagination */}
            {filteredProducts.length === 30 && allProducts.length > 30 && (
              <div className="pagination">
                <button className="pagination-btn disabled">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,18 9,12 15,6"/>
                  </svg>
                </button>
                <button className="pagination-btn active">1</button>
                <button className="pagination-btn">2</button>
                <button className="pagination-btn">3</button>
                <span>...</span>
                <button className="pagination-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default Products;