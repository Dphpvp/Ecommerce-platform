import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';
import ProductForm from './ProductForm';
// Styles included in main theme

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log('🔄 Fetching admin products...');
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/products`);
      console.log('✅ Products data received:', data);
      setProducts(data.products || []);
    } catch (error) {
      console.error('❌ Failed to fetch products:', error);
      
      let errorMessage = 'Failed to fetch products';
      if (error.message.includes('Authentication required')) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error.message.includes('Network') || error.name === 'TypeError') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('🔄 Fetching admin categories...');
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/categories`);
      console.log('✅ Categories data received:', data);
      const categoryNames = data.categories?.map(cat => cat.name).sort() || [];
      setCategories(categoryNames);
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
      showToast('Failed to fetch categories', 'error');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/products/${productId}`, {
        method: 'DELETE'
      });

      showToast('Product deleted successfully', 'success');
      fetchProducts();
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete product:', error);
      showToast('Failed to delete product', 'error');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowAddForm(true);
  };

  const handleEditProduct = (product) => {
    setShowAddForm(false);
    setEditingProduct(product);
  };

  const closeModals = () => {
    setShowAddForm(false);
    setEditingProduct(null);
  };

  if (loading) return <div className="container"><p>Loading products...</p></div>;

  return (
    <div className="admin-products-page">
      <div className="professional-admin-container">
        <div className="admin-header-professional">
          <div className="admin-title-section">
            <h1 className="admin-title-professional">Product Management</h1>
            <p className="admin-subtitle-professional">
              Manage your product catalog with complete control over inventory, pricing, and details
            </p>
          </div>
          <button
            onClick={handleAddProduct}
            className="professional-add-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add New Product
          </button>
        </div>

        {/* Add Product Modal */}
        {showAddForm && (
          <ProductForm
            categories={categories}
            onSave={() => {
              closeModals();
              fetchProducts();
              fetchCategories();
            }}
            onCancel={closeModals}
          />
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <ProductForm
            product={editingProduct}
            categories={categories}
            onSave={() => {
              closeModals();
              fetchProducts();
              fetchCategories();
            }}
            onCancel={closeModals}
            isEdit={true}
          />
        )}

        <div className="professional-products-grid">
          {products.map((product) => (
            <div key={product._id} className="professional-product-card">
              <div className="professional-product-image">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = '/images/placeholder-product.jpg';
                  }}
                />
                <div className="professional-stock-indicator">
                  <span className={`stock-badge ${product.stock < 10 ? "low-stock" : product.stock < 5 ? "critical-stock" : "good-stock"}`}>
                    {product.stock < 5 ? '⚠️ Critical' : product.stock < 10 ? '⚠️ Low' : '✓ In Stock'}
                  </span>
                </div>
              </div>
              
              <div className="professional-product-info">
                <div className="product-header-professional">
                  <h3 className="product-name-professional">{product.name}</h3>
                  <span className="product-price-professional">${product.price}</span>
                </div>
                
                <p className="product-description-professional">{product.description}</p>
                
                <div className="product-details-professional">
                  <div className="detail-item">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">{product.category}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Stock</span>
                    <span className={`detail-value stock-value ${product.stock < 10 ? "low-stock" : ""}`}>
                      {product.stock} units
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="professional-product-actions">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="professional-edit-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => deleteProduct(product._id)}
                  className="professional-delete-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="professional-empty-products">
            <div className="professional-empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <h3>No products found</h3>
            <p>Start building your product catalog by adding your first product.</p>
            <button
              onClick={handleAddProduct}
              className="professional-empty-action-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Your First Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;