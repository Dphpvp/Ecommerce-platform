// ASOS-Inspired Products Page - Sustainable Fashion Catalog
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
import '../styles/index.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

// Animated Product Card for Products Page
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

const Products = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

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

  // Sort products function
  const sortProducts = (products) => {
    switch (sortBy) {
      case 'price-low':
        return products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      case 'price-high':
        return products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      case 'name-asc':
        return products.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return products.sort((a, b) => b.name.localeCompare(a.name));
      case 'rating':
        return products.sort((a, b) => (b.rating || 4.2) - (a.rating || 4.2));
      case 'newest':
      default:
        return products.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
    }
  };

  // Get sort label for display
  const getSortLabel = (sortValue) => {
    switch (sortValue) {
      case 'price-low': return 'Price: Low to High';
      case 'price-high': return 'Price: High to Low';
      case 'name-asc': return 'Name: A to Z';
      case 'name-desc': return 'Name: Z to A';
      case 'rating': return 'Highest Rated';
      case 'newest':
      default: return 'Newest First';
    }
  };

  // Filter and sort products
  const filteredProducts = sortProducts(
    allProducts
      .filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
  ).slice(0, 30); // Increased to 30 products

  return (
    <div className="products-page">
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
              <button 
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <button 
                className="sort-button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                Sort by: {getSortLabel(sortBy)}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </button>
              {showSortDropdown && (
                <div className="sort-dropdown-menu">
                  <button onClick={() => { setSortBy('newest'); setShowSortDropdown(false); }} className={sortBy === 'newest' ? 'active' : ''}>
                    Newest First
                  </button>
                  <button onClick={() => { setSortBy('price-low'); setShowSortDropdown(false); }} className={sortBy === 'price-low' ? 'active' : ''}>
                    Price: Low to High
                  </button>
                  <button onClick={() => { setSortBy('price-high'); setShowSortDropdown(false); }} className={sortBy === 'price-high' ? 'active' : ''}>
                    Price: High to Low
                  </button>
                  <button onClick={() => { setSortBy('name-asc'); setShowSortDropdown(false); }} className={sortBy === 'name-asc' ? 'active' : ''}>
                    Name: A to Z
                  </button>
                  <button onClick={() => { setSortBy('name-desc'); setShowSortDropdown(false); }} className={sortBy === 'name-desc' ? 'active' : ''}>
                    Name: Z to A
                  </button>
                  <button onClick={() => { setSortBy('rating'); setShowSortDropdown(false); }} className={sortBy === 'rating' ? 'active' : ''}>
                    Highest Rated
                  </button>
                </div>
              )}
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
            <div className={`products-grid ${viewMode}-view`}>
              {filteredProducts.map((product, index) => (
                <AnimatedProductCard 
                  key={product._id} 
                  product={product}
                  delay={index * 50}
                  viewMode={viewMode}
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

      {/* Newsletter Section */}
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
          <div className="social-media-links">
            <a href="#" className="social-link" aria-label="Follow us on Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.80 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="Follow us on Facebook">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="Follow us on Twitter">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="Follow us on TikTok">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.90 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          </div>
          <div className="footer-content">
            <p className="footer-text">
              Made by{' '}
              <a 
                href="https://github.com/pradian" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                Petre Alexandru
              </a>{' '}
              and{' '}
              <a 
                href="https://github.com/Dphpvp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                Dph
              </a>
              <span className="footer-separator">•</span>
              <span className="footer-copyright">© 2025 All rights reserved</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Products;