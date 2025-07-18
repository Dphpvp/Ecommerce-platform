// Revolutionary Products Page - Spectacular Shopping Experience
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Revolutionary Product Card Component
const RevolutionaryProductCard = ({ product, delay = 0 }) => {
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
      className={`product-card-revolutionary ${isVisible ? 'reveal' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="product-image-revolutionary">
        <div 
          className="product-image-bg"
          style={{ 
            backgroundImage: `url(${product.image || `https://images.unsplash.com/photo-${1594938328870 + Math.floor(Math.random() * 100)}-${Math.random().toString(36).substr(2, 9)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80`})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        <div className="product-overlay-revolutionary">
          <div className="product-badge-revolutionary">
            Premium
          </div>
          <div className="product-actions-hover">
            <button className="quick-view-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button className="wishlist-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="product-content-revolutionary">
        <h3 className="product-title-revolutionary">{product.name}</h3>
        <p className="product-description-revolutionary">
          {product.description || 'Crafted with precision and attention to detail, this piece represents the pinnacle of luxury fashion.'}
        </p>
        <div className="product-rating-revolutionary">
          <div className="stars">
            {'★'.repeat(5)}
          </div>
          <span className="rating-count">(124 reviews)</span>
        </div>
        <div className="product-price-revolutionary">
          <span className="product-price-current-revolutionary">
            ${product.price || 999}
          </span>
          <span className="product-price-old-revolutionary">
            ${Math.floor((product.price || 999) * 1.3)}
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
      {/* Revolutionary Products Hero Section */}
      <section className="hero-revolutionary products-hero">
        <div className="hero-bg-revolutionary">
          <div 
            className="hero-bg-image" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1578662996443-48f949d9e1cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80)',
              transform: `translateY(${scrollY * 0.5}px)`
            }}
          ></div>
          <div className="hero-overlay-revolutionary"></div>
        </div>
        <div className="hero-content-revolutionary">
          <div className="hero-glass-card">
            <div className="hero-badge-revolutionary">
              Premium Collection
            </div>
            <h1 className="hero-title-revolutionary">
              Curated Excellence
            </h1>
            <p className="hero-subtitle-revolutionary">
              Discover our handpicked selection of luxury fashion pieces, each representing the pinnacle of craftsmanship and design
            </p>
            <div className="hero-stats-revolutionary">
              <div className="stat-item-revolutionary">
                <span className="stat-number-revolutionary">{allProducts.length}</span>
                <span className="stat-label-revolutionary">Premium Items</span>
              </div>
              <div className="stat-divider-revolutionary">|</div>
              <div className="stat-item-revolutionary">
                <span className="stat-number-revolutionary">{categories.length}</span>
                <span className="stat-label-revolutionary">Collections</span>
              </div>
              <div className="stat-divider-revolutionary">|</div>
              <div className="stat-item-revolutionary">
                <span className="stat-number-revolutionary">50+</span>
                <span className="stat-label-revolutionary">Years Heritage</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionary Filters Section */}
      <section className="filters-section-revolutionary">
        <div className="container">
          <div className="filters-header-revolutionary">
            <h2 className="filters-title-revolutionary">Refine Your Selection</h2>
            <p className="filters-subtitle-revolutionary">Discover pieces that match your refined taste</p>
          </div>
          <div className="filters-container-revolutionary">
            <div className="search-box-revolutionary">
              <div className="search-icon-revolutionary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search our exclusive collection..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-revolutionary"
              />
            </div>
            
            <div className="category-selector-revolutionary">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select-revolutionary"
              >
                <option value="">All Collections</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="select-arrow-revolutionary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="results-summary-revolutionary">
            <div className="results-count-revolutionary">
              Displaying <span className="count-highlight">{filteredProducts.length}</span> of <span className="count-highlight">{allProducts.length}</span> premium pieces
              {filteredProducts.length === 30 && allProducts.length > 30 && (
                <span className="limit-note-revolutionary"> (showing first 30)</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionary Products Grid Section */}
      <section className="products-grid-section-revolutionary">
        <div className="products-bg-revolutionary">
          <div 
            className="products-bg-image" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1566146340949-72de7aa8ed26?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80)',
              transform: `translateY(${scrollY * 0.1}px)`
            }}
          ></div>
          <div className="products-overlay-revolutionary"></div>
        </div>
        <div className="container">
          {loading ? (
            <div className="loading-section-revolutionary">
              <div className="loading-spinner-revolutionary">
                <div className="spinner-ring-revolutionary"></div>
                <div className="spinner-ring-revolutionary"></div>
                <div className="spinner-ring-revolutionary"></div>
              </div>
              <h3 className="loading-title-revolutionary">Curating Excellence</h3>
              <p className="loading-subtitle-revolutionary">Assembling our finest selection...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products-section-revolutionary">
              <div className="no-products-icon-revolutionary">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </div>
              <h3 className="no-products-title-revolutionary">Collection Unavailable</h3>
              <p className="no-products-subtitle-revolutionary">
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
                  className="btn-revolutionary btn-luxury-revolutionary"
                >
                  <span>View Full Collection</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="products-grid-content-revolutionary">
                <div className="section-header-revolutionary">
                  <h2 className="section-title-revolutionary">
                    {selectedCategory ? `${selectedCategory} Heritage` : 'Master Collection'}
                  </h2>
                  <p className="section-subtitle-revolutionary">
                    {selectedCategory 
                      ? `Exceptional ${selectedCategory.toLowerCase()} pieces from renowned artisans worldwide`
                      : 'Our most distinguished pieces, carefully selected for the discerning connoisseur'}
                  </p>
                  <div className="title-underline-revolutionary"></div>
                </div>
                
                <div className="product-grid-revolutionary">
                  {filteredProducts.map((product, index) => (
                    <RevolutionaryProductCard 
                      key={product._id} 
                      product={product}
                      delay={index * 100}
                    />
                  ))}
                </div>

                {filteredProducts.length === 30 && allProducts.length > 30 && (
                  <div className="collection-note-revolutionary">
                    <div className="note-content-revolutionary">
                      <div className="note-icon-revolutionary">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <h4 className="note-title-revolutionary">Exclusive Curation</h4>
                      <p className="note-subtitle-revolutionary">We're showcasing our top 30 pieces. For our complete collection, please visit our atelier or contact our master tailors.</p>
                      <Link to="/contact" className="btn-revolutionary btn-luxury-revolutionary">
                        <span>Schedule Private Viewing</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Revolutionary Services Section */}
      <section className="services-section-revolutionary">
        <div className="services-bg-revolutionary">
          <div 
            className="services-bg-image" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80)',
              transform: `translateY(${scrollY * 0.2}px)`
            }}
          ></div>
          <div className="services-overlay-revolutionary"></div>
        </div>
        <div className="container">
          <div className="services-content-revolutionary">
            <div className="services-badge-revolutionary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Bespoke Services
            </div>
            <h2 className="services-title-revolutionary">Master Tailor Consultation</h2>
            <p className="services-subtitle-revolutionary">
              Experience the pinnacle of sartorial excellence with our master tailors. From fabric selection to final fitting, 
              we create garments that transcend fashion and become heirlooms.
            </p>
            <div className="services-grid-revolutionary">
              <div className="service-item-revolutionary">
                <div className="service-icon-revolutionary">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 7h-9a2 2 0 01-2-2V2"/>
                    <path d="M9 2v3a2 2 0 002 2h9"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7"/>
                  </svg>
                </div>
                <div className="service-content-revolutionary">
                  <h4 className="service-title-revolutionary">Bespoke Tailoring</h4>
                  <p className="service-description-revolutionary">Completely custom garments crafted to perfection</p>
                </div>
              </div>
              <div className="service-item-revolutionary">
                <div className="service-icon-revolutionary">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <div className="service-content-revolutionary">
                  <h4 className="service-title-revolutionary">Master Fitting</h4>
                  <p className="service-description-revolutionary">Precision measurements & expert fittings</p>
                </div>
              </div>
              <div className="service-item-revolutionary">
                <div className="service-icon-revolutionary">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                    <path d="M2 2l7.586 7.586"/>
                    <circle cx="11" cy="11" r="2"/>
                  </svg>
                </div>
                <div className="service-content-revolutionary">
                  <h4 className="service-title-revolutionary">Style Consultation</h4>
                  <p className="service-description-revolutionary">Personal wardrobe curation & styling</p>
                </div>
              </div>
            </div>
            <Link to="/contact" className="btn-revolutionary btn-luxury-revolutionary btn-large">
              <span>Begin Your Journey</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Products;