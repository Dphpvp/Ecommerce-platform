import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    stock: '',
    brand: '',
    sku: ''
  });
  const [categories, setCategories] = useState([]);
  const [categoryType, setCategoryType] = useState('existing');
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/categories`);
      const categoryNames = data.categories?.map(cat => cat.name).sort() || [];
      setCategories(categoryNames);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Product name must be at least 2 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (categoryType === 'existing' && !formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (categoryType === 'new' && !newCategory.trim()) {
      newErrors.newCategory = 'Please enter a new category name';
    }

    if (!formData.image_url.trim()) {
      newErrors.image_url = 'Image URL is required';
    } else {
      try {
        new URL(formData.image_url);
      } catch {
        newErrors.image_url = 'Please enter a valid URL';
      }
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: categoryType === 'existing' ? formData.category : newCategory.trim()
      };

      await makeAuthenticatedRequest(`${API_BASE}/products`, {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      showToast('Product added successfully!', 'success');
      navigate('/admin/products');
    } catch (error) {
      console.error('Failed to add product:', error);
      showToast(error.message || 'Failed to add product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/products');
  };

  return (
    <div className="admin-add-product">
      <div className="container">
        <div className="add-product-header">
          <h1>📦 Add New Product</h1>
          <div className="header-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-outline"
            >
              ← Back to Products
            </button>
          </div>
        </div>

        <div className="add-product-form-section">
          <form onSubmit={handleSubmit} className="product-form">
            
            {/* Basic Information */}
            <div className="form-section">
              <h3>📝 Basic Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Product Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="Enter product name"
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="brand">Brand</label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter brand name (optional)"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`form-textarea ${errors.description ? 'error' : ''}`}
                    placeholder="Enter detailed product description"
                    rows="4"
                  />
                  {errors.description && <span className="error-text">{errors.description}</span>}
                </div>
              </div>
            </div>

            {/* Category Selection */}
            <div className="form-section">
              <h3>🏷️ Category</h3>
              <div className="category-selection">
                <div className="category-toggle">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="categoryType"
                      value="existing"
                      checked={categoryType === 'existing'}
                      onChange={(e) => setCategoryType(e.target.value)}
                    />
                    Select Existing Category
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="categoryType"
                      value="new"
                      checked={categoryType === 'new'}
                      onChange={(e) => setCategoryType(e.target.value)}
                    />
                    Create New Category
                  </label>
                </div>

                {categoryType === 'existing' ? (
                  <div className="form-group">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`form-select ${errors.category ? 'error' : ''}`}
                    >
                      <option value="">Choose a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && <span className="error-text">{errors.category}</span>}
                  </div>
                ) : (
                  <div className="form-group">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className={`form-input ${errors.newCategory ? 'error' : ''}`}
                      placeholder="Enter new category name"
                    />
                    {errors.newCategory && <span className="error-text">{errors.newCategory}</span>}
                    <small className="form-hint">
                      Use forward slashes for subcategories (e.g., "Electronics/Smartphones")
                    </small>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing and Inventory */}
            <div className="form-section">
              <h3>💰 Pricing & Inventory</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="price">Price ($) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`form-input ${errors.price ? 'error' : ''}`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.price && <span className="error-text">{errors.price}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="stock">Stock Quantity *</label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className={`form-input ${errors.stock ? 'error' : ''}`}
                    placeholder="0"
                    min="0"
                  />
                  {errors.stock && <span className="error-text">{errors.stock}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="sku">SKU</label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter SKU (optional)"
                  />
                  <small className="form-hint">Stock Keeping Unit for inventory tracking</small>
                </div>
              </div>
            </div>

            {/* Product Image */}
            <div className="form-section">
              <h3>📸 Product Image</h3>
              <div className="image-section">
                <div className="form-group">
                  <label htmlFor="image_url">Image URL *</label>
                  <input
                    type="url"
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className={`form-input ${errors.image_url ? 'error' : ''}`}
                    placeholder="https://example.com/product-image.jpg"
                  />
                  {errors.image_url && <span className="error-text">{errors.image_url}</span>}
                </div>
                
                {formData.image_url && (
                  <div className="image-preview">
                    <img
                      src={formData.image_url}
                      alt="Product preview"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'block';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Adding Product...
                  </>
                ) : (
                  <>
                    ✅ Add Product
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;