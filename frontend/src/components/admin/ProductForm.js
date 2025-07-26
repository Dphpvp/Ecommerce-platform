import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';
import SecureForm from '../SecureForm';
import { csrfManager } from '../../utils/csrf';


const ProductForm = ({
  product,
  categories = [],
  onSave,
  onCancel,
  isEdit = false,
}) => {
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const [categoryType, setCategoryType] = useState("existing");
  const [customCategory, setCustomCategory] = useState("");
  const [imagePreview, setImagePreview] = useState(product?.image_url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImagePreview(url);
  };

  const handleSubmit = async (sanitizedData, csrfToken) => {
    setIsSubmitting(true);
    try {
      const url = isEdit
        ? `${process.env.REACT_APP_API_BASE_URL}/admin/products/${product._id}`
        : `${process.env.REACT_APP_API_BASE_URL}/products`;

      const method = isEdit ? "PUT" : "POST";

      const productData = {
        ...sanitizedData,
        price: parseFloat(sanitizedData.price),
        stock: parseInt(sanitizedData.stock),
        category: categoryType === "existing" ? sanitizedData.category : customCategory
      };

      if (isEdit) {
        await makeAuthenticatedRequest(url, {
          method,
          body: JSON.stringify(productData),
        });
      } else {
        const response = await csrfManager.makeSecureRequest(url, {
          method,
          headers: {
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to save product');
        }
      }

      showToast(
        isEdit ? "Product updated successfully" : "Product added successfully",
        "success"
      );
      onSave();
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modern-product-form-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modern-product-form-container">
        <div className="modern-product-form">
          {/* Header */}
          <div className="form-header">
            <div className="header-content">
              <div className="header-icon">
                {isEdit ? "✏️" : "➕"}
              </div>
              <div className="header-text">
                <h2>{isEdit ? "Edit Product" : "Add New Product"}</h2>
                <p>{isEdit ? "Update product information" : "Add a new product to your inventory"}</p>
              </div>
            </div>
            <button className="close-btn" onClick={onCancel} type="button">
              ✕
            </button>
          </div>

          <SecureForm onSubmit={handleSubmit} validate={true} ref={formRef}>
            <div className="form-grid">
              {/* Left Column - Product Details */}
              <div className="form-column">
                <div className="form-section">
                  <h3 className="section-title">📝 Product Information</h3>
                  
                  <div className="input-group">
                    <label className="modern-label">
                      <span className="label-text">Product Name</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="modern-input"
                      placeholder="Enter product name"
                      defaultValue={product?.name || ""}
                      minLength="1"
                      maxLength="200"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="modern-label">
                      <span className="label-text">Description</span>
                      <span className="required">*</span>
                    </label>
                    <textarea
                      name="description"
                      className="modern-textarea"
                      placeholder="Describe your product in detail..."
                      defaultValue={product?.description || ""}
                      minLength="10"
                      maxLength="2000"
                      rows="4"
                      required
                    />
                    <div className="input-help">Minimum 10 characters</div>
                  </div>

                  <div className="input-row">
                    <div className="input-group">
                      <label className="modern-label">
                        <span className="label-text">Price</span>
                        <span className="required">*</span>
                      </label>
                      <div className="price-input-wrapper">
                        <span className="currency-symbol">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="999999.99"
                          name="price"
                          className="modern-input price-input"
                          placeholder="0.00"
                          defaultValue={product?.price || ""}
                          required
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="modern-label">
                        <span className="label-text">Stock Quantity</span>
                        <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="999999"
                        name="stock"
                        className="modern-input"
                        placeholder="0"
                        defaultValue={product?.stock || ""}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">🏷️ Category</h3>
                  
                  <div className="category-toggle">
                    <label className="toggle-option">
                      <input
                        type="radio"
                        name="categoryType"
                        value="existing"
                        checked={categoryType === "existing"}
                        onChange={(e) => setCategoryType(e.target.value)}
                      />
                      <span>Existing Category</span>
                    </label>
                    <label className="toggle-option">
                      <input
                        type="radio"
                        name="categoryType"
                        value="new"
                        checked={categoryType === "new"}
                        onChange={(e) => setCategoryType(e.target.value)}
                      />
                      <span>New Category</span>
                    </label>
                  </div>

                  {categoryType === "existing" ? (
                    <div className="input-group">
                      <select
                        name="category"
                        className="modern-select"
                        defaultValue={product?.category || ""}
                        required
                      >
                        <option value="">Choose Category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="input-group">
                      <input
                        type="text"
                        className="modern-input"
                        placeholder="Enter new category name"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        maxLength="100"
                        required
                      />
                      <div className="input-help">Use / for subcategories (e.g., Electronics/Phones)</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Image & Preview */}
              <div className="form-column">
                <div className="form-section">
                  <h3 className="section-title">🖼️ Product Image</h3>
                  
                  <div className="input-group">
                    <label className="modern-label">
                      <span className="label-text">Image URL</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="url"
                      name="image_url"
                      className="modern-input"
                      placeholder="https://example.com/image.jpg"
                      defaultValue={product?.image_url || ""}
                      onChange={handleImageUrlChange}
                      maxLength="500"
                      required
                    />
                  </div>

                  {/* Image Preview */}
                  <div className="image-preview-section">
                    <div className="preview-label">Preview:</div>
                    <div className="image-preview-container">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="image-preview"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          onLoad={(e) => {
                            e.target.style.display = 'block';
                            e.target.nextSibling.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div className="image-placeholder" style={{ display: imagePreview ? 'none' : 'flex' }}>
                        <div className="placeholder-content">
                          <div className="placeholder-icon">🖼️</div>
                          <div className="placeholder-text">
                            {imagePreview ? 'Loading...' : 'No image URL provided'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Info Preview */}
                <div className="form-section">
                  <h3 className="section-title">👁️ Product Preview</h3>
                  <div className="product-preview-card">
                    <div className="preview-image">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" />
                      ) : (
                        <div className="preview-placeholder">📦</div>
                      )}
                    </div>
                    <div className="preview-content">
                      <h4 className="preview-name">{product?.name || "Product Name"}</h4>
                      <p className="preview-description">
                        {product?.description ? 
                          (product.description.length > 80 ? 
                            product.description.substring(0, 80) + "..." : 
                            product.description
                          ) : 
                          "Product description will appear here..."
                        }
                      </p>
                      <div className="preview-details">
                        <span className="preview-price">${product?.price || "0.00"}</span>
                        <span className="preview-stock">Stock: {product?.stock || "0"}</span>
                      </div>
                      <div className="preview-category">{product?.category || "Category"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button 
                type="button" 
                onClick={onCancel} 
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading-spinner"></span>
                    {isEdit ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    {isEdit ? "✅ Update Product" : "➕ Add Product"}
                  </>
                )}
              </button>
            </div>
          </SecureForm>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;